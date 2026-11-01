/**
 * Everything that writes money. One rule: spending is only the sum of postings to expense accounts.
 * Every event's postings sum to zero, and nothing is edited to undo it: a reversal event negates it.
 */
import { randomUUID } from "node:crypto";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { CATEGORIES, type TCheckedItem, type TRawTxn } from "@/contract/schemas";
import { addMonths, monthsBetween } from "@/engine/dates";

export type EventSource = "dictation" | "seed" | "sms" | "csv" | "pdf" | "simulated";
type Meta = Record<string, unknown>;
export type EventInput = {
  kind: string;
  date: string;
  source: EventSource;
  sourceQuote?: string | null;
  label: string;
  amount: number;
  account?: string | null;
  category?: string | null;
  payee?: string | null;
  reference?: string | null;
  meta?: Meta | null;
  reversalOf?: string | null;
  postings: [account: string, amount: number][];
};
type EventRow = {
  id: string; kind: string; date: string; source: EventSource; source_quote: string | null; label: string; amount: number;
  account: string | null; category: string | null; payee: string | null; reference: string | null; meta: string | null;
};
export type EmiPlan = { id: string; name: string; monthly: number; total_instalments: number; paid_before: number };
export type GoalRow = {
  id: string; name: string; type: string; target: number; monthly_contribution: number; target_month: string;
  floor_month: string | null; reduction_amount: number; reduction_months: number; reason_quote: string | null;
  variant: string | null; price_url: string | null;
};

export const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 13)}`;
const now = () => new Date().toISOString();
const NOT_REVERSED = "NOT EXISTS (SELECT 1 FROM events r WHERE r.reversal_of = e.id)";

export function all<T>(db: DatabaseSync, sql: string, ...params: SQLInputValue[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}
export function one<T>(db: DatabaseSync, sql: string, ...params: SQLInputValue[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

let savepoint = 0;
/** Savepoints, so these can nest: an applyRuling that posts an expense is still all or nothing. */
export function tx<T>(db: DatabaseSync, fn: () => T): T {
  const name = `sp_${++savepoint}`;
  db.exec(`SAVEPOINT ${name}`);
  try {
    const result = fn();
    db.exec(`RELEASE ${name}`);
    return result;
  } catch (err) {
    db.exec(`ROLLBACK TO ${name}`);
    db.exec(`RELEASE ${name}`);
    throw err;
  }
}

function accountKind(id: string): string {
  if (id.startsWith("person:")) return "person";
  if (id.startsWith("emi:")) return "emi";
  if (id.startsWith("expense:")) return "expense";
  if (id.startsWith("income:")) return "income";
  if (["bank", "cash", "card", "opening"].includes(id)) return id;
  throw new Error(`Unknown account: ${id}`);
}

function ensureAccount(db: DatabaseSync, id: string, name?: string): void {
  db.prepare("INSERT OR IGNORE INTO accounts (id, kind, name) VALUES (?, ?, ?)").run(id, accountKind(id), name ?? id);
}

export function postEvent(db: DatabaseSync, e: EventInput): string {
  const sum = e.postings.reduce((s, [, amount]) => s + amount, 0);
  if (sum !== 0) throw new Error(`Unbalanced event ${e.kind}: postings sum to ${sum}`);
  const id = newId("ev");
  return tx(db, () => {
    db.prepare(`INSERT INTO events (id, kind, date, source, source_quote, reversal_of, label, amount, account, category, payee, reference, meta, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, e.kind, e.date, e.source, e.sourceQuote ?? null, e.reversalOf ?? null, e.label, e.amount, e.account ?? null,
      e.category ?? null, e.payee ?? null, e.reference ?? null, e.meta ? JSON.stringify(e.meta) : null, now(),
    );
    for (const [account, amount] of e.postings) {
      ensureAccount(db, account);
      db.prepare("INSERT INTO postings (event_id, account_id, amount) VALUES (?, ?, ?)").run(id, account, amount);
    }
    return id;
  });
}

export function simMonthOf(db: DatabaseSync): string {
  return one<{ month: string }>(db, "SELECT month FROM sim_clock WHERE id = 1")!.month;
}

/** A dictated row with no date lands late in its month, inside the simulated clock rather than the real one. */
export function defaultDate(db: DatabaseSync, month?: string | null): string {
  return `${month && /^\d{4}-\d{2}$/.test(month) ? month : simMonthOf(db)}-28`;
}

function personAccount(db: DatabaseSync, person: string | null): { id: string; name: string } {
  const name = person?.trim();
  if (!name) throw new Error("This item needs a person");
  const id = `person:${name.toLowerCase()}`;
  ensureAccount(db, id, name);
  return { id, name: one<{ name: string }>(db, "SELECT name FROM accounts WHERE id = ?", id)!.name };
}

const validCategory = (c: string | null | undefined) =>
  c && (CATEGORIES as readonly string[]).includes(c) ? c : "other";

export function findGoal(db: DatabaseSync, nameOrId: string | null): GoalRow | undefined {
  if (!nameOrId) return undefined;
  const q = nameOrId.trim().toLowerCase();
  const goals = all<GoalRow>(db, "SELECT * FROM goals ORDER BY rowid");
  return goals.find((g) => g.id.toLowerCase() === q || g.name.toLowerCase() === q)
    ?? goals.find((g) => g.name.toLowerCase().includes(q) || q.includes(g.name.toLowerCase()));
}

export function earmarkedFor(db: DatabaseSync, goalId: string): number {
  return one<{ s: number }>(db, `SELECT COALESCE(SUM(x.amount), 0) s FROM earmarks x WHERE x.goal_id = ?
    AND (x.event_id IS NULL OR NOT EXISTS (SELECT 1 FROM events r WHERE r.reversal_of = x.event_id))`, goalId)!.s;
}

/** Earmarks are labels over the bank balance, not postings, so moving one never touches spending. */
export function addEarmark(db: DatabaseSync, goalId: string, amount: number, label: string, eventId: string | null = null, createdAt?: string): void {
  db.prepare("INSERT INTO earmarks (id, goal_id, amount, label, event_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(newId("em"), goalId, amount, label, eventId, createdAt ?? now());
}

export function getProfileValue(db: DatabaseSync, key: string): string | null {
  return one<{ value: string | null }>(db, "SELECT value FROM profile WHERE key = ?", key)?.value ?? null;
}

export function setProfileValue(db: DatabaseSync, key: string, value: string | null): void {
  db.prepare("INSERT INTO profile (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

export function openEmiPlans(db: DatabaseSync): EmiPlan[] {
  return all<EmiPlan>(db, `SELECT p.id, p.name, p.monthly, p.total_instalments, p.paid_before FROM recurring p
    WHERE p.kind = 'emi' AND (p.event_id IS NULL OR NOT EXISTS (SELECT 1 FROM events r WHERE r.reversal_of = p.event_id))
    ORDER BY p.rowid`);
}

export function instalmentsLeft(db: DatabaseSync, plan: EmiPlan): number {
  const paid = one<{ n: number }>(db, `SELECT COUNT(*) n FROM events e WHERE e.kind = 'emi'
    AND json_extract(e.meta, '$.planId') = ? AND ${NOT_REVERSED}`, plan.id)!.n;
  return Math.max(0, plan.total_instalments - plan.paid_before - paid);
}

function findEmiPlan(db: DatabaseSync, text: string | null, amount: number): EmiPlan | undefined {
  const plans = openEmiPlans(db);
  const q = (text ?? "").toLowerCase();
  return plans.find((p) => q && (q.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(q)))
    ?? plans.find((p) => p.monthly === amount)
    ?? (plans.length === 1 && !q ? plans[0] : undefined);
}

/**
 * An EMI is a fixed monthly obligation: opening one posts nothing, so the full price never counts as spend.
 * Only the instalments do, each one through an `emi` event.
 */
export function openEmi(
  db: DatabaseSync,
  e: { name: string; monthly: number; instalments: number; principal: number; date?: string; source?: EventSource; sourceQuote?: string | null; paidBefore?: number },
): string {
  return tx(db, () => {
    const date = e.date ?? defaultDate(db);
    const eventId = postEvent(db, {
      kind: "emi_open", date, source: e.source ?? "dictation", sourceQuote: e.sourceQuote, label: `${e.name} on EMI`,
      amount: e.principal, account: null, category: null, payee: e.name, postings: [],
    });
    ensureAccount(db, `emi:${e.name}`, e.name);
    const planId = newId("emi");
    db.prepare("INSERT INTO recurring (id, name, kind, monthly, total_instalments, paid_before, principal, started, event_id) VALUES (?, ?, 'emi', ?, ?, ?, ?, ?, ?)")
      .run(planId, e.name, e.monthly, e.instalments, e.paidBefore ?? 0, e.principal, date.slice(0, 7), eventId);
    return planId;
  });
}

/** Posts one EMI instalment. Exported for the Plan C path in applyRuling. */
export function postInstalment(
  db: DatabaseSync,
  e: { planId: string | null; label: string; amount: number; date: string; source: EventSource; account?: string; sourceQuote?: string | null; reference?: string | null; payee?: string | null },
): string {
  const account = e.account ?? "bank";
  return postEvent(db, {
    kind: "emi", date: e.date, source: e.source, sourceQuote: e.sourceQuote, label: e.label, amount: e.amount, account,
    category: "emi", payee: e.payee ?? e.label, reference: e.reference, meta: e.planId ? { planId: e.planId } : null,
    postings: [["expense:emi", e.amount], [account, -e.amount]],
  });
}

function itemAmount(item: TCheckedItem): number | null {
  if (item.amount != null) return Math.abs(item.amount);
  if (item.amount_rupees != null) return Math.round(Math.abs(item.amount_rupees) * 100);
  return null;
}

export function applyItem(db: DatabaseSync, item: TCheckedItem, source: "dictation" | "seed", date?: string): string | null {
  const amount = itemAmount(item);
  const when = date ?? defaultDate(db, item.month);
  const base = { date: when, source, sourceQuote: item.source_quote || null };
  const acct = item.account ?? "bank";
  const need = () => {
    if (amount == null || amount === 0) throw new Error(`Item "${item.type}" needs an amount`);
    return amount;
  };
  return tx(db, () => {
    switch (item.type) {
      case "expense": {
        const a = need();
        const category = validCategory(item.category);
        return postEvent(db, {
          ...base, kind: "expense", label: item.payee ?? (item.source_quote || category), amount: a, account: acct, category,
          payee: item.payee, postings: [[`expense:${category}`, a], [acct, -a]],
        });
      }
      case "income": {
        const a = need();
        return postEvent(db, {
          ...base, kind: "income", label: item.payee ?? "Income", amount: a, account: acct, payee: item.payee,
          postings: [[acct, a], ["income:other", -a]],
        });
      }
      case "withdrawal": {
        const a = need();
        return postEvent(db, {
          ...base, kind: "withdrawal", label: "ATM withdrawal", amount: a, account: "bank",
          postings: [["cash", a], ["bank", -a]],
        });
      }
      case "lend": {
        const a = need();
        const p = personAccount(db, item.person);
        return postEvent(db, { ...base, kind: "lend", label: `Lent to ${p.name}`, amount: a, account: acct, payee: p.name, postings: [[p.id, a], [acct, -a]] });
      }
      case "borrow": {
        const a = need();
        const p = personAccount(db, item.person);
        return postEvent(db, { ...base, kind: "borrow", label: `Borrowed from ${p.name}`, amount: a, account: acct, payee: p.name, postings: [[acct, a], [p.id, -a]] });
      }
      case "repay_in": {
        const a = need();
        const p = personAccount(db, item.person);
        return postEvent(db, { ...base, kind: "repay_in", label: `${p.name} repaid`, amount: a, account: acct, payee: p.name, postings: [[acct, a], [p.id, -a]] });
      }
      case "repay_out": {
        const a = need();
        const p = personAccount(db, item.person);
        return postEvent(db, { ...base, kind: "repay_out", label: `Repaid ${p.name}`, amount: a, account: acct, payee: p.name, postings: [[p.id, a], [acct, -a]] });
      }
      case "emi": {
        const a = need();
        const plan = findEmiPlan(db, item.payee, a);
        return postInstalment(db, {
          ...base, planId: plan?.id ?? null, label: plan?.name ?? item.payee ?? "EMI", amount: a,
          account: acct === "cash" ? "cash" : "bank", payee: item.payee,
        });
      }
      case "card_bill": {
        const a = need();
        return postEvent(db, { ...base, kind: "card_bill", label: "Card bill paid", amount: a, account: "bank", postings: [["card", a], ["bank", -a]] });
      }
      case "earmark": {
        const a = need();
        const goal = findGoal(db, item.goal);
        if (!goal) throw new Error(`No goal called "${item.goal}"`);
        const eventId = postEvent(db, { ...base, kind: "earmark", label: `Earmarked for ${goal.name}`, amount: a, payee: goal.name, postings: [] });
        addEarmark(db, goal.id, a, item.source_quote || "Earmark", eventId);
        return eventId;
      }
      case "goal_create": return createGoal(db, item, base, need());
      case "goal_update": return updateGoal(db, item, base, amount);
      case "profile_update": return updateProfile(db, item, base, amount);
      case "correction": {
        if (item.pattern && item.category) {
          addRuleInternal(db, { pattern: item.pattern, category: item.category, minAmount: null, maxAmount: null, reasonQuote: item.source_quote || null });
        }
        return null;
      }
      default:
        return null;
    }
  });
}

type Base = { date: string; source: EventSource; sourceQuote: string | null };

function createGoal(db: DatabaseSync, item: TCheckedItem, base: Base, target: number): string {
  const name = item.goal?.trim();
  if (!name) throw new Error("A new goal needs a name");
  const sim = simMonthOf(db);
  const month = item.month && /^\d{4}-\d{2}$/.test(item.month) ? item.month : addMonths(sim, 12);
  const months = Math.max(1, monthsBetween(sim, month));
  const id = `g-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${newId("x").slice(2, 6)}`;
  // A dictated goal states no contribution, so it gets what reaches the target by its month.
  db.prepare(`INSERT INTO goals (id, name, type, target, monthly_contribution, target_month, reason_quote, created_at)
    VALUES (?, ?, 'date', ?, ?, ?, ?, ?)`).run(id, name, target, Math.ceil(target / months), month, item.reason, now());
  return postEvent(db, { ...base, kind: "goal_create", label: `New goal: ${name}`, amount: target, payee: name, meta: { goalId: id }, postings: [] });
}

function updateGoal(db: DatabaseSync, item: TCheckedItem, base: Base, amount: number | null): string {
  const goal = findGoal(db, item.goal);
  if (!goal) throw new Error(`No goal called "${item.goal}"`);
  const month = item.month && /^\d{4}-\d{2}$/.test(item.month) ? item.month : goal.target_month;
  db.prepare("UPDATE goals SET target = ?, target_month = ?, reason_quote = ? WHERE id = ?")
    .run(amount ?? goal.target, month, item.reason ?? goal.reason_quote, goal.id);
  return postEvent(db, {
    ...base, kind: "goal_update", label: `Updated ${goal.name}`, amount: amount ?? 0, payee: goal.name,
    meta: { goalId: goal.id, before: { target: goal.target, target_month: goal.target_month, reason_quote: goal.reason_quote } }, postings: [],
  });
}

const PROFILE_KEYS = { monthly_income: "monthly_income", fixed_costs: "fixed_costs", expected_bonus: "expected_bonus" } as const;

function updateProfile(db: DatabaseSync, item: TCheckedItem, base: Base, amount: number | null): string | null {
  if (!item.field || amount == null) return null;
  if (item.field === "emergency_fund") {
    const goal = one<{ id: string; name: string }>(db, "SELECT id, name FROM goals WHERE type = 'emergency' ORDER BY rowid LIMIT 1");
    const before = goal ? earmarkedFor(db, goal.id) : Number(getProfileValue(db, "emergency_fund") ?? 0);
    const eventId = postEvent(db, {
      ...base, kind: "profile_update", label: "Emergency fund updated", amount, meta: { key: "emergency_fund", before: String(before) }, postings: [],
    });
    if (goal) addEarmark(db, goal.id, amount - before, "Emergency fund updated", eventId);
    else setProfileValue(db, "emergency_fund", String(amount));
    return eventId;
  }
  const key = PROFILE_KEYS[item.field];
  const before = getProfileValue(db, key);
  setProfileValue(db, key, String(amount));
  return postEvent(db, { ...base, kind: "profile_update", label: `Profile: ${key.replace("_", " ")}`, amount, meta: { key, before }, postings: [] });
}

const WITHDRAWAL = /\b(ATM|CASH WDL|CASH WITHDRAWAL|NWD)\b/i;
const CARD_BILL = /(CC BILL|CARD BILL|CREDIT CARD (BILL|PAYMENT)|CC PAYMENT)/i;
const CARD_CREDIT = /(PAYMENT RECEIVED|THANK YOU|BILL PAYMENT)/i;
const EMI = /\bEMI\b/i;
const SALARY = /\b(SALARY|SAL CREDIT|PAYROLL)\b/i;
const BONUS = /\bBONUS\b/i;

/** Two rows are one transaction on a matching reference, or on amount, date and account when either has no reference. */
function findDuplicate(db: DatabaseSync, txn: TRawTxn): string | null {
  const live = `e.reversal_of IS NULL AND e.source != 'dictation' AND ${NOT_REVERSED}`;
  if (txn.reference) {
    const byRef = one<{ id: string }>(db, `SELECT e.id FROM events e WHERE e.reference = ? AND ${live} LIMIT 1`, txn.reference);
    if (byRef) return byRef.id;
  }
  const refClause = txn.reference ? "AND e.reference IS NULL" : "";
  const byKey = one<{ id: string }>(db, `SELECT e.id FROM events e WHERE e.amount = ? AND e.date = ? AND e.account = ? ${refClause} AND ${live} LIMIT 1`,
    Math.abs(txn.amount), txn.date, txn.account);
  return byKey?.id ?? null;
}

/** Returns the event id, or null when this row duplicates one already posted (or is zero). */
export function postImportedTxn(db: DatabaseSync, txn: TRawTxn, category: string | null): string | null {
  const amount = Math.abs(txn.amount);
  if (amount === 0) return null;
  return tx(db, () => {
    if (findDuplicate(db, txn)) return null;
    const text = `${txn.narration} ${txn.payee ?? ""}`;
    const label = txn.payee ?? txn.narration;
    const base = { date: txn.date, source: txn.source, sourceQuote: txn.narration, reference: txn.reference, amount, payee: txn.payee };
    if (txn.amount < 0) {
      if (txn.account === "card" && CARD_CREDIT.test(text)) {
        // The card statement's half of a bill paid from the bank: one transfer, not income.
        const bankSide = one<{ id: string }>(db, `SELECT e.id FROM events e WHERE e.kind = 'card_bill' AND e.amount = ?
          AND ABS(julianday(e.date) - julianday(?)) <= 5 AND ${NOT_REVERSED} LIMIT 1`, amount, txn.date);
        if (bankSide) return null;
        return postEvent(db, { ...base, kind: "card_bill", label: "Card bill paid", account: "card", postings: [["card", amount], ["bank", -amount]] });
      }
      const income = SALARY.test(text) ? "income:salary" : BONUS.test(text) ? "income:bonus" : "income:other";
      return postEvent(db, { ...base, kind: "income", label, account: txn.account, postings: [[txn.account, amount], [income, -amount]] });
    }
    if (txn.account === "bank" && WITHDRAWAL.test(text)) {
      return postEvent(db, { ...base, kind: "withdrawal", label: "ATM withdrawal", account: "bank", postings: [["cash", amount], ["bank", -amount]] });
    }
    if (txn.account === "bank" && CARD_BILL.test(text)) {
      const cardSide = one<{ id: string }>(db, `SELECT e.id FROM events e WHERE e.kind = 'card_bill' AND e.amount = ?
        AND ABS(julianday(e.date) - julianday(?)) <= 5 AND ${NOT_REVERSED} LIMIT 1`, amount, txn.date);
      if (cardSide) return null;
      return postEvent(db, { ...base, kind: "card_bill", label: "Card bill paid", account: "bank", postings: [["card", amount], ["bank", -amount]] });
    }
    if (category === "emi" || EMI.test(text)) {
      const plan = findEmiPlan(db, text, amount);
      return postInstalment(db, {
        planId: plan?.id ?? null, label: plan?.name ?? label, amount, date: txn.date, source: txn.source, account: txn.account,
        sourceQuote: txn.narration, reference: txn.reference, payee: txn.payee,
      });
    }
    const cat = validCategory(category);
    return postEvent(db, { ...base, kind: "expense", label, account: txn.account, category: cat, postings: [[`expense:${cat}`, amount], [txn.account, -amount]] });
  });
}

/**
 * Dinner 3,000 where friends owe 2,000: spend 1,000, lent 2,000. Exported for S7 and fixture 7;
 * the router has no split item yet, so dictation can't reach it.
 */
export function postSplitExpense(
  db: DatabaseSync,
  e: { total: number; owed: number; person: string; category: string; label: string; account?: "bank" | "cash" | "card"; date?: string; source?: EventSource; sourceQuote?: string | null },
): string {
  if (e.owed < 0 || e.owed > e.total) throw new Error("The owed share must be between zero and the total");
  const account = e.account ?? "bank";
  const cat = validCategory(e.category);
  const p = personAccount(db, e.person);
  return postEvent(db, {
    kind: "expense", date: e.date ?? defaultDate(db), source: e.source ?? "dictation", sourceQuote: e.sourceQuote, label: e.label,
    amount: e.total, account, category: cat, payee: e.label,
    postings: [[`expense:${cat}`, e.total - e.owed], [p.id, e.owed], [account, -e.total]],
  });
}

function getEvent(db: DatabaseSync, id: string): EventRow {
  const row = one<EventRow>(db, "SELECT * FROM events WHERE id = ?", id);
  if (!row) throw new Error(`No event ${id}`);
  return row;
}

function parseMeta(row: { meta: string | null }): Meta {
  return row.meta ? (JSON.parse(row.meta) as Meta) : {};
}

function reverse(db: DatabaseSync, row: EventRow): string {
  const postings = all<{ account_id: string; amount: number }>(db, "SELECT account_id, amount FROM postings WHERE event_id = ?", row.id);
  // Dated like the original, so the month it came out of nets to zero.
  return postEvent(db, {
    kind: "reversal", date: row.date, source: row.source, label: `Undo: ${row.label}`, amount: row.amount, reversalOf: row.id,
    postings: postings.map((p) => [p.account_id, -p.amount] as [string, number]),
  });
}

const isReversed = (db: DatabaseSync, id: string) => Boolean(one(db, "SELECT 1 FROM events WHERE reversal_of = ?", id));

/**
 * The user's override. "spend" counts the cash not yet explained as spent, so cash already logged
 * from this withdrawal is not counted a second time. "transfer" puts it back.
 */
export function setWithdrawalTreatment(db: DatabaseSync, eventId: string, treatment: "transfer" | "spend"): void {
  tx(db, () => {
    const row = getEvent(db, eventId);
    if (row.kind !== "withdrawal") throw new Error("Only a withdrawal has a treatment");
    if (isReversed(db, eventId)) throw new Error("This withdrawal was undone");
    const meta = parseMeta(row);
    const current = meta.treatment === "spend" ? "spend" : "transfer";
    if (current === treatment) return;
    if (treatment === "spend") {
      const balance = one<{ s: number }>(db, "SELECT COALESCE(SUM(amount), 0) s FROM postings WHERE account_id = 'cash'")!.s;
      const counted = Math.min(row.amount, Math.max(0, balance));
      const adjustmentId = postEvent(db, {
        kind: "withdrawal_treatment", date: row.date, source: row.source, label: "Cash from ATM counted as spend", amount: counted,
        account: "cash", category: "other", postings: [["expense:other", counted], ["cash", -counted]],
      });
      meta.treatment = "spend";
      meta.adjustmentId = adjustmentId;
    } else {
      reverse(db, getEvent(db, meta.adjustmentId as string));
      meta.treatment = "transfer";
      delete meta.adjustmentId;
    }
    db.prepare("UPDATE events SET meta = ? WHERE id = ?").run(JSON.stringify(meta), eventId);
  });
}

/** Undo is a reversal event. A second undo of the same event does nothing. */
export function undoEvent(db: DatabaseSync, eventId: string): void {
  tx(db, () => {
    const row = getEvent(db, eventId);
    if (row.kind === "reversal" || isReversed(db, eventId)) return;
    const meta = parseMeta(row);
    if (typeof meta.adjustmentId === "string" && !isReversed(db, meta.adjustmentId)) reverse(db, getEvent(db, meta.adjustmentId));
    reverse(db, row);
    if (row.kind === "goal_create" && typeof meta.goalId === "string") {
      db.prepare("DELETE FROM earmarks WHERE goal_id = ?").run(meta.goalId);
      db.prepare("DELETE FROM goals WHERE id = ?").run(meta.goalId);
    } else if (row.kind === "goal_update" && typeof meta.goalId === "string") {
      const b = meta.before as { target: number; target_month: string; reason_quote: string | null };
      db.prepare("UPDATE goals SET target = ?, target_month = ?, reason_quote = ? WHERE id = ?").run(b.target, b.target_month, b.reason_quote, meta.goalId);
    } else if (row.kind === "profile_update" && typeof meta.key === "string" && meta.key !== "emergency_fund") {
      setProfileValue(db, meta.key, (meta.before as string | null) ?? null);
    }
  });
}

/** Rule text is matched against payee, label and narration, without case, inside the amount range. */
export function ruleMatches(
  rule: { pattern: string; minAmount: number | null; maxAmount: number | null },
  row: { payee?: string | null; label: string; amount: number; source_quote?: string | null },
): boolean {
  const q = rule.pattern.toLowerCase();
  const text = `${row.payee ?? ""} ${row.label} ${row.source_quote ?? ""}`.toLowerCase();
  if (!text.includes(q)) return false;
  if (rule.minAmount != null && row.amount < rule.minAmount) return false;
  if (rule.maxAmount != null && row.amount > rule.maxAmount) return false;
  return true;
}

function addRuleInternal(
  db: DatabaseSync,
  rule: { pattern: string; category: string; minAmount: number | null; maxAmount: number | null; reasonQuote: string | null },
): { ruleId: string; applied: number } {
  const category = validCategory(rule.category);
  const ruleId = newId("r");
  db.prepare("INSERT INTO rules (id, pattern, category, min_amount, max_amount, reason_quote, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ruleId, rule.pattern, category, rule.minAmount, rule.maxAmount, rule.reasonQuote, now());
  const rows = all<EventRow>(db, `SELECT e.* FROM events e WHERE e.kind = 'expense' AND e.category != ? AND ${NOT_REVERSED}`, category);
  ensureAccount(db, `expense:${category}`);
  let applied = 0;
  for (const row of rows) {
    if (!ruleMatches(rule, row)) continue;
    // Recategorising moves money between two expense accounts: it stays balanced and spend is unchanged.
    db.prepare("UPDATE postings SET account_id = ? WHERE event_id = ? AND account_id = ?").run(`expense:${category}`, row.id, `expense:${row.category}`);
    db.prepare("UPDATE events SET category = ? WHERE id = ?").run(category, row.id);
    db.prepare("INSERT INTO rule_changes (rule_id, event_id, old_category) VALUES (?, ?, ?)").run(ruleId, row.id, row.category);
    applied++;
  }
  return { ruleId, applied };
}

/** Removes a rule and puts back the categories it changed, so a wrong correction costs nothing. */
export function undoRule(db: DatabaseSync, ruleId: string): void {
  tx(db, () => {
    const rule = one<{ category: string }>(db, "SELECT category FROM rules WHERE id = ?", ruleId);
    if (!rule) return;
    for (const c of all<{ event_id: string; old_category: string }>(db, "SELECT event_id, old_category FROM rule_changes WHERE rule_id = ?", ruleId)) {
      db.prepare("UPDATE postings SET account_id = ? WHERE event_id = ? AND account_id = ?").run(`expense:${c.old_category}`, c.event_id, `expense:${rule.category}`);
      db.prepare("UPDATE events SET category = ? WHERE id = ?").run(c.old_category, c.event_id);
    }
    db.prepare("DELETE FROM rule_changes WHERE rule_id = ?").run(ruleId);
    db.prepare("DELETE FROM rules WHERE id = ?").run(ruleId);
  });
}

export function addRule(
  db: DatabaseSync,
  rule: { pattern: string; category: string; minAmount: number | null; maxAmount: number | null; reasonQuote: string | null },
): { ruleId: string; applied: number } {
  return tx(db, () => addRuleInternal(db, rule));
}
