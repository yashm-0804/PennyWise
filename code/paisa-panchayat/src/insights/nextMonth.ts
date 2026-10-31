import type { DatabaseSync } from "node:sqlite";
import type { z } from "zod";
import { RawTxn, type TNextMonthResponse, type TNotice } from "@/contract/schemas";
import { fireConditions } from "@/engine";
import { addNotice, getState, postImportedTxn, setProfileValue, setSimMonth } from "@/ledger";
import { categorize } from "@/ingest";
import { ruleMatches } from "@/ledger/post";
import data from "../../seed/next-month.json";
import { driftNudges } from "./drift";
import { detectRecurring, previousAmount, recurringNotice } from "./recurring";
import { monthlyReview } from "./review";

const KEY = "next_month_result";
type Rule = { id: string; pattern: string; category: string; minAmount: number | null; maxAmount: number | null };
const key = (s: string | null) => (s ?? "").toLowerCase().replace(/[^a-z0-9@.]+/g, " ").trim();

/**
 * Order: your rules (code), then what this payee was filed under before (code), then the categorizer for what is left.
 * So a known payee costs no model call, and at most one call is spent here.
 */
async function label(db: DatabaseSync, txns: z.infer<typeof RawTxn>[], rules: Rule[]) {
  const history = new Map<string, string>();
  for (const r of db.prepare("SELECT payee, category FROM events WHERE kind = 'expense' AND payee IS NOT NULL AND category IS NOT NULL AND category != 'other' ORDER BY date").all() as { payee: string; category: string }[]) {
    history.set(key(r.payee), r.category);
  }
  const out = txns.map((txn) => ({ txn, category: null as string | null, ruleId: null as string | null }));
  const rest: number[] = [];
  txns.forEach((t, i) => {
    if (t.amount <= 0) return;
    const rule = rules.find((r) => ruleMatches(r, { payee: t.payee, label: t.payee ?? t.narration, amount: t.amount, source_quote: t.narration }));
    if (rule) { out[i].category = rule.category; out[i].ruleId = rule.id; return; }
    const known = history.get(key(t.payee));
    if (known) out[i].category = known;
    else rest.push(i);
  });
  if (rest.length) {
    (await categorize(rest.map((i) => txns[i]), rules)).forEach((c, k) => { out[rest[k]].category = c.category; out[rest[k]].ruleId = c.ruleId; });
  }
  return out;
}

/** Simulates the next month. A second call returns the stored result and posts nothing. At most 2 model calls: one categorize batch, one review prose. */
export async function runNextMonth(db: DatabaseSync): Promise<TNextMonthResponse> {
  const stored = db.prepare("SELECT value FROM profile WHERE key = ?").get(KEY) as { value: string } | undefined;
  if (stored?.value) return JSON.parse(stored.value) as TNextMonthResponse;

  const month = data.month;
  const txns = data.txns.map((t) => RawTxn.parse(t));
  const rules = getState(db).rules.map((r) => ({ id: r.id, pattern: r.pattern, category: r.category, minAmount: r.minAmount, maxAmount: r.maxAmount }));
  const labelled = await label(db, txns, rules);

  const used = new Map<string, number>();
  for (const { txn, category, ruleId } of labelled) {
    const id = postImportedTxn(db, txn, category);
    if (id && ruleId) used.set(ruleId, (used.get(ruleId) ?? 0) + 1);
  }
  setSimMonth(db, month);

  const rulesApplied = [...used].map(([id, count]) => {
    const r = rules.find((x) => x.id === id || x.pattern === id);
    return { rule: r ? `${r.pattern} → ${r.category}` : id, count };
  });
  const added: TNotice[] = [];
  for (const { rule, count } of rulesApplied) {
    added.push(addNotice(db, { kind: "rule_applied", title: "Your rule ran", body: `${rule}: ${count} ${count === 1 ? "payment" : "payments"} sorted without asking.`, goalId: null }));
  }
  const fired = fireConditions(db, data.bonus);
  added.push(...fired);
  for (const r of detectRecurring(db)) {
    const n = recurringNotice(r, r.status === "changed" ? previousAmount(db, r.payee) : undefined);
    if (n) added.push(addNotice(db, { ...n, goalId: null }));
  }
  for (const d of driftNudges(db)) {
    // When a ruling already moved this goal this month, its notice carries the date. Saying it twice reads as a double count.
    const body = fired.some((f) => f.goalId === d.goalId) ? d.body.replace(/, and I slip .*$/, ".") : d.body;
    added.push(addNotice(db, { kind: d.kind, title: d.title, body, goalId: d.goalId }));
  }

  const review = await monthlyReview(db, month);
  const result: TNextMonthResponse = { month, simulated: true, rulesApplied, notices: added.map((n) => ({ ...n, simulated: true })), review };
  setProfileValue(db, KEY, JSON.stringify(result));
  return result;
}
