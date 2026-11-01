/** Glue between the routes and the modules. The modules hold the rules; this holds the order of calls. */
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { checkItems, parseRuling, routeUtterance, runGoalAgents } from "@/agents";
import type {
  TAppState, TCheckedItem, TDictateResponse, TPanchayat, TPlan, TPriceCheck, TRulingOp, TRulingResponse, TTrigger,
} from "@/contract/schemas";
import {
  affectedGoals, applyRuling, buildFactSheets, findPrecedent, generatePlans, isHeavy, previewRuling,
} from "@/engine";
import { monthsBetween, projectMonth } from "@/engine/dates";
import { addRule, applyItem, getPanchayat, getRulingId, getState, initSchema, logUtterance, savePanchayat } from "@/ledger";
import { getDb } from "@/lib/db";
import { looksLikeQuestion } from "@/lib/question";
import { seedDemo } from "../../seed";

const g = globalThis as unknown as { __pwReady?: boolean; __pwUtterances?: Map<string, TCheckedItem[]>; __pwConfirmed?: Set<string> };
const utterances = (): Map<string, TCheckedItem[]> => (g.__pwUtterances ??= new Map());

export function db(): DatabaseSync {
  const d = getDb();
  if (!g.__pwReady) {
    initSchema(d);
    if (getState(d).goals.length === 0) seedDemo(d);
    g.__pwReady = true;
  }
  return d;
}

/** Adds what the ledger's state leaves out: the last price check per goal, and the simulated label on alerts. */
export function fullState(d: DatabaseSync = db()): TAppState {
  const state = getState(d);
  const latest = d.prepare("SELECT * FROM price_checks WHERE goal_id = ? ORDER BY id DESC LIMIT 1");
  return {
    ...state,
    notices: state.notices.map((n) => ({ ...n, simulated: n.kind !== "heavy_expense" })),
    goals: state.goals.map((goal) => {
      const row = latest.get(goal.id) as
        | { goal_id: string; variant: string; price: number; source_url: string; label: string; checked_at: string }
        | undefined;
      const price: TPriceCheck | null = row
        ? { goalId: row.goal_id, variant: row.variant, price: row.price, sourceUrl: row.source_url, checkedAt: row.checked_at, label: row.label, cached: false }
        : null;
      return { ...goal, price };
    }),
  };
}

const expenseRows = (state: TAppState) => state.rows.filter((r) => r.countsAsSpend && !r.reversed);

function categoryMedians(state: TAppState): Record<string, number> {
  const groups = new Map<string, number[]>();
  for (const r of expenseRows(state)) if (r.category) groups.set(r.category, [...(groups.get(r.category) ?? []), r.amount]);
  const out: Record<string, number> = {};
  for (const [cat, list] of groups) out[cat] = [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
  return out;
}

const LEDGER_TYPES = new Set(["expense", "income", "withdrawal", "lend", "borrow", "repay_in", "repay_out", "emi", "card_bill", "goal_create", "goal_update", "earmark", "profile_update", "correction"]);

/** About six minutes of speech. Beyond this the amount parser gets slow enough to stall the app. */
const MAX_DICTATION_CHARS = 4000;

export async function dictate(text: string): Promise<TDictateResponse> {
  if (text.length > MAX_DICTATION_CHARS) throw new Error("That's too long to read in one go. Say it in shorter parts.");
  const d = db();
  const state = fullState(d);
  const { items, source } = await routeUtterance(text, {
    goals: state.goals.map((x) => x.name),
    people: state.people.map((p) => p.person),
    simMonth: state.simMonth,
  });
  const checked = checkItems(items, text, {
    categoryMedians: categoryMedians(state),
    cashBalance: state.cash.balance,
    people: state.people,
  });
  const hasLedger = checked.some((i) => LEDGER_TYPES.has(i.type));
  const route: TDictateResponse["route"] = checked.some((i) => i.type === "whatif")
    ? "panchayat"
    : hasLedger
      ? "entries"
      : checked.some((i) => i.type === "investment_ask")
        ? "refusal"
        : checked.some((i) => i.type === "question") || looksLikeQuestion(text)
          ? "buggy"
          : "entries";
  // In a mixed ramble the entries still go through. The investment question gets its refusal in the row; it's never saved.
  const paidThisMonth = new Set(state.rows.filter((r) => r.kind === "emi" && !r.reversed && r.date.startsWith(state.simMonth)).map((r) => r.amount));
  const rows = route === "entries"
    ? checked.map((i) => {
        if (i.type === "investment_ask") {
          return { ...i, status: "ask" as const, messages: ["Main kisi fund ya share ka naam nahi bata sakta. Ye row save nahi hogi."] };
        }
        if (i.type === "unknown" && source === "template") {
          return { ...i, status: "block" as const, messages: ["The AI isn't reachable right now, so nothing was understood. Your text is safe; try again in a moment."] };
        }
        if (i.type === "correction" && (i.pattern ?? i.payee ?? i.person ?? "").trim().length < 3) {
          return { ...i, status: "block" as const, messages: ["Whose payments should this cover? That name is too short to match safely."] };
        }
        if (i.type === "emi" && i.amount && paidThisMonth.has(i.amount)) {
          return { ...i, status: "ask" as const, messages: [...i.messages, "This EMI is already in this month's ledger. Saving it again counts it twice."] };
        }
        return i;
      })
    : checked;
  const utteranceId = randomUUID();
  utterances().set(utteranceId, rows);
  logUtterance(d, utteranceId, text, rows);
  return { utteranceId, raw_text: text, route, items: rows, llm_source: source };
}

export async function convene(trigger: TTrigger, plans?: TPlan[]): Promise<TPanchayat> {
  const d = db();
  const state = fullState(d);
  const list = plans ?? generatePlans(state, trigger);
  const voiced = new Set(affectedGoals(state, list));
  // A saving has no one to argue against it, so only costs convene voices.
  const voices = plans
    ? []
    : await runGoalAgents(
        buildFactSheets(state, trigger, list, findPrecedent(d, trigger)).filter((s) => voiced.has(s.goalId)),
      );
  const panchayat: TPanchayat = { id: randomUUID(), trigger, plans: list, voices, createdAt: new Date().toISOString() };
  savePanchayat(d, panchayat);
  return panchayat;
}

/** A spoken correction becomes a rule scoped around what that payee usually costs, so a ₹300 repayment to the same person isn't rent. */
function saveCorrection(d: DatabaseSync, state: TAppState, item: TCheckedItem) {
  const pattern = item.pattern ?? item.payee ?? item.person;
  if (!pattern || !item.category) return;
  const needle = pattern.toLowerCase();
  const amounts = expenseRows(state)
    .filter((r) => r.label.toLowerCase().includes(needle))
    .map((r) => r.amount)
    .sort((a, b) => a - b);
  const typical = amounts.length ? amounts[Math.floor(amounts.length / 2)] : item.amount;
  addRule(d, {
    pattern,
    category: item.category,
    minAmount: typical ? Math.floor(typical * 0.5) : null,
    maxAmount: typical ? Math.ceil(typical * 1.5) : null,
    reasonQuote: item.source_quote || null,
  });
}

export async function confirm(utteranceId: string, items: TCheckedItem[]) {
  const d = db();
  const confirmed = (g.__pwConfirmed ??= new Set());
  // A double tap or a retry must not post the same dictation twice.
  if (confirmed.has(utteranceId)) return { state: fullState(d), panchayat: null, errors: [] as string[] };
  if (utterances().has(utteranceId)) confirmed.add(utteranceId);
  const errors: string[] = [];
  const heavy: TCheckedItem[] = [];
  for (const item of items) {
    if (item.status === "block") continue;
    try {
      if (item.type === "correction") {
        saveCorrection(d, fullState(d), item);
      } else if (item.type === "expense" && item.amount && isHeavy(fullState(d), item.amount)) {
        heavy.push(item);
      } else {
        applyItem(d, item, "dictation");
      }
    } catch (err) {
      errors.push(`${item.source_quote}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  // Heavy expenses said together go to one panchayat together, so none skips it.
  const panchayat = heavy.length
    ? await convene({
        kind: "expense",
        label: heavy.map((i) => i.payee ?? i.source_quote).join(" + "),
        amount: heavy.reduce((sum, i) => sum + i.amount!, 0),
        quote: heavy.map((i) => i.source_quote).join("; "),
        hypothetical: true,
      })
    : null;
  if (errors.length) confirmed.delete(utteranceId);
  return { state: fullState(d), panchayat, errors };
}

const avgMonthly = (state: TAppState, category: string) => {
  const rows = expenseRows(state).filter((r) => r.category === category);
  const months = new Set(rows.map((r) => r.date.slice(0, 7)));
  return months.size ? Math.round(rows.reduce((sum, r) => sum + r.amount, 0) / months.size) : 0;
};

/** Plans for a lasting monthly change: put it all on one goal, or split it. `monthly` is positive for a saving, negative for a cost. */
function monthlyPlans(state: TAppState, monthly: number, category: string, percent: number | null): TPlan[] {
  const goals = state.goals.filter((x) => x.type !== "emergency" && x.monthlyContribution > 0);
  const impact = (goal: TAppState["goals"][number], change: number) => {
    const contribution = goal.monthlyContribution + change;
    if (contribution <= 0) return null;
    const afterMonth = projectMonth(state.simMonth, goal.target, goal.earmarked, contribution);
    return {
      goalId: goal.id, goalName: goal.name, beforeMonth: goal.projectedMonth, afterMonth,
      deltaMonths: monthsBetween(goal.projectedMonth, afterMonth), amountGiven: Math.abs(change),
    };
  };
  const actions = monthly > 0 && percent
    ? [{ kind: "reduce_budget" as const, category: category as never, percent, months: 12 }]
    : [];
  const assumption = "Modelled on the average of the months in your file. Nothing is saved until you rule.";
  const single = goals.slice(0, 2).flatMap((goal) => {
    const i = impact(goal, monthly);
    return i ? [{ title: `${monthly > 0 ? "All to" : "All from"} ${goal.name}`, actions, impacts: [i], assumptions: [assumption] }] : [];
  });
  const share = goals.length ? Math.trunc(monthly / goals.length) : 0;
  const shared = goals.map((goal) => impact(goal, share));
  const split = shared.every((i) => i !== null) && goals.length > 1
    ? [{ title: "Split across goals", actions, impacts: shared.filter((i): i is NonNullable<typeof i> => i !== null), assumptions: [assumption] }]
    : [];
  return [...single, ...split].slice(0, 3).map((p, i) => ({ id: "ABC"[i], ...p }));
}

export async function whatIf(text: string, utteranceId?: string): Promise<TPanchayat> {
  const state = fullState();
  const stored = utteranceId ? utterances().get(utteranceId) : undefined;
  const items = stored ?? (await dictate(text)).items;
  const item = items.find((i) => i.type === "whatif");
  if (!item) throw new Error("That didn't read as a what-if. Try: what if I cut dining by 30%?");
  const percentMatch = `${item.amount_text ?? ""} ${item.source_quote}`.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
  const percent = percentMatch ? Number(percentMatch[1]) : null;
  const headline = item.source_quote.replace(/^\s*what\s+if\s+(i\s+)?/i, "").replace(/\?$/, "").trim();
  const base: Omit<TTrigger, "amount"> = {
    kind: "whatif",
    label: headline.charAt(0).toUpperCase() + headline.slice(1),
    quote: item.source_quote,
    hypothetical: true,
  };
  if (item.category) {
    const average = avgMonthly(state, item.category);
    const rising = /\b(?:goes?\s+up|increase[sd]?|rises?|more|badh\p{L}*|zyada|mehng\p{L}*|hike[sd]?)\b/iu.test(item.source_quote);
    const change = percent !== null ? Math.round((average * percent) / 100) : item.amount ? average - item.amount : 0;
    const monthly = percent !== null && rising ? -change : change;
    if (monthly !== 0) {
      const plans = monthlyPlans(state, monthly, item.category, percent);
      if (plans.length) return convene({ ...base, label: `${base.label}, a month`, amount: Math.abs(monthly) }, plans);
    }
  }
  if (!item.amount) throw new Error("I need an amount or a percent for that what-if.");
  return convene({ ...base, amount: item.amount });
}

/** A ruling can move a goal without naming a plan. Use the plan that already moves that goal, and show it in the diff. */
function withPlan(panchayat: TPanchayat, ops: TRulingOp[]): TRulingOp[] {
  if (ops.some((o) => o.op === "choose_plan")) return ops;
  const moved = ops.flatMap((o) => (o.op === "move_goal" || o.op === "hold_goal" ? [o.goalId] : []));
  const plan = panchayat.plans.find((p) => p.impacts.some((i) => moved.includes(i.goalId))) ?? panchayat.plans[0];
  return plan ? [{ op: "choose_plan", planId: plan.id }, ...ops] : ops;
}

export async function ruling(panchayatId: string, text: string, apply: boolean, ops?: TRulingOp[]): Promise<TRulingResponse & { state: TAppState }> {
  const d = db();
  const panchayat = getPanchayat(d, panchayatId);
  if (!panchayat) throw new Error("This panchayat is no longer open.");
  const state = fullState(d);
  const parsed = ops
    ? { ops, questions: [] }
    : await parseRuling(text, panchayat, state.goals.map((x) => ({ id: x.id, name: x.name })));
  if (apply && parsed.ops.length === 0) throw new Error("That ruling doesn't decide anything yet. Say which plan or which goal moves.");
  const finalOps = parsed.ops.length ? withPlan(panchayat, parsed.ops) : [];
  const diff = previewRuling(state, panchayat, finalOps);
  const precedentCited = findPrecedent(d, panchayat.trigger);
  if (!apply) return { rulingId: null, ops: finalOps, questions: parsed.questions, diff, applied: false, precedentCited, state };
  applyRuling(d, panchayat, text, finalOps);
  return { rulingId: getRulingId(d, panchayat.id), ops: finalOps, questions: [], diff, applied: true, precedentCited, state: fullState(d) };
}
