/** Reads, and the small writes that aren't money movements: panchayats, rulings, conditions, notices, the clock. */
import type { DatabaseSync } from "node:sqlite";
import type {
  TAppState, TGoalView, TMonthlyReview, TNotice, TPanchayat, TRulingOp,
} from "@/contract/schemas";
import { CATEGORIES } from "@/contract/schemas";
import { formatInr, maxMonth, monthsBetween, projectMonth, addMonths } from "@/engine/dates";
import {
  addEarmark, all, earmarkedFor, getProfileValue, instalmentsLeft, newId, one, openEmiPlans, ruleMatches, setProfileValue, simMonthOf, tx,
  type GoalRow,
} from "./post";

type Row = {
  id: string; kind: string; date: string; source: TAppState["rows"][number]["source"]; source_quote: string | null; label: string;
  amount: number; account: string | null; category: string | null; payee: string | null; meta: string | null;
  spend: number; reversed: number;
};
export type ConditionRow = { id: string; panchayat_id: string; condition_json: string; status: string };
const IMPORT_SOURCES = new Set(["sms", "csv", "pdf", "simulated"]);
const SAME_AS_WINDOW_DAYS = 3;

export function spendForMonth(db: DatabaseSync, month: string): number {
  return one<{ s: number }>(db, `SELECT COALESCE(SUM(p.amount), 0) s FROM postings p
    JOIN accounts a ON a.id = p.account_id JOIN events e ON e.id = p.event_id
    WHERE a.kind = 'expense' AND substr(e.date, 1, 7) = ?`, month)!.s;
}

function balanceOf(db: DatabaseSync, account: string): number {
  return one<{ s: number }>(db, "SELECT COALESCE(SUM(amount), 0) s FROM postings WHERE account_id = ?", account)!.s;
}

function goalView(db: DatabaseSync, g: GoalRow, simMonth: string): TGoalView {
  const earmarked = earmarkedFor(db, g.id);
  const lost = g.reduction_amount * g.reduction_months;
  const computed = projectMonth(simMonth, g.target, earmarked - lost, g.monthly_contribution);
  return {
    id: g.id,
    name: g.name,
    type: g.type as TGoalView["type"],
    target: g.target,
    earmarked,
    monthlyContribution: g.monthly_contribution,
    targetMonth: g.target_month,
    projectedMonth: g.floor_month ? maxMonth(computed, g.floor_month) : computed,
    reasonQuote: g.reason_quote,
    priceUrl: g.price_url,
    variant: g.variant,
  };
}

function dayDiff(a: string, b: string): number {
  return Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;
}

/** Fixture 10: a spoken row and an imported row that look alike stay as two rows, each flagged. */
function sameAsFlags(rows: Row[]): Map<string, string> {
  const flags = new Map<string, string>();
  const live = rows.filter((r) => !r.reversed && (r.kind === "expense" || r.kind === "emi"));
  const spoken = live.filter((r) => r.source === "dictation");
  const imported = live.filter((r) => IMPORT_SOURCES.has(r.source));
  for (const s of spoken) {
    for (const i of imported) {
      if (s.amount !== i.amount || dayDiff(s.date, i.date) > SAME_AS_WINDOW_DAYS) continue;
      flags.set(s.id, `Same as this? ${formatInr(i.amount)} imported on ${i.date}: ${i.label}`);
      flags.set(i.id, `Same as this? ${formatInr(s.amount)} spoken on ${s.date}: ${s.label}`);
    }
  }
  return flags;
}

export function getState(db: DatabaseSync): TAppState {
  const simMonth = simMonthOf(db);
  const rawRows = all<Row>(db, `SELECT e.*,
      (SELECT COALESCE(SUM(p.amount), 0) FROM postings p JOIN accounts a ON a.id = p.account_id WHERE p.event_id = e.id AND a.kind = 'expense') spend,
      EXISTS (SELECT 1 FROM events r WHERE r.reversal_of = e.id) reversed
    FROM events e
    WHERE e.reversal_of IS NULL AND e.kind NOT IN ('opening', 'withdrawal_treatment')
    ORDER BY e.date DESC, e.rowid DESC`);
  const flags = sameAsFlags(rawRows);
  const rows: TAppState["rows"] = rawRows.map((r) => {
    const treatedAsSpend = r.kind === "withdrawal" && r.meta ? (JSON.parse(r.meta) as { treatment?: string }).treatment === "spend" : false;
    return {
      eventId: r.id,
      date: r.date,
      kind: r.kind,
      label: r.label,
      amount: r.amount,
      account: r.account,
      category: r.category,
      source: r.source,
      sourceQuote: r.source_quote,
      countsAsSpend: !r.reversed && (r.spend !== 0 || treatedAsSpend),
      reversed: Boolean(r.reversed),
      flag: flags.get(r.id) ?? null,
    };
  });

  const goalRows = all<GoalRow>(db, "SELECT * FROM goals ORDER BY rowid");
  const goals = goalRows.map((g) => goalView(db, g, simMonth));

  const income = Number(getProfileValue(db, "monthly_income") ?? 0);
  const fixed = Number(getProfileValue(db, "fixed_costs") ?? 0);
  const living = Number(getProfileValue(db, "living_budget") ?? 0);
  const emergency = goals.find((g) => g.type === "emergency");
  const bonus = getProfileValue(db, "expected_bonus");
  const committed = goalRows.reduce((sum, g) => sum + g.monthly_contribution - (g.reduction_months > 0 ? g.reduction_amount : 0), 0);

  const cashBalance = balanceOf(db, "cash");
  const people = all<{ id: string; name: string }>(db, "SELECT id, name FROM accounts WHERE kind = 'person' ORDER BY name")
    .map(({ id, name }) => {
      const b = balanceOf(db, id);
      return { person: name, owesMe: Math.max(0, b), iOwe: Math.max(0, -b) };
    });

  const rules = all<{ id: string; pattern: string; category: string; min_amount: number | null; max_amount: number | null; reason_quote: string | null }>(
    db, "SELECT * FROM rules ORDER BY created_at, rowid",
  ).map((r) => {
    const rule = { pattern: r.pattern, minAmount: r.min_amount, maxAmount: r.max_amount };
    return {
      id: r.id,
      pattern: r.pattern,
      category: r.category as (typeof CATEGORIES)[number],
      minAmount: r.min_amount,
      maxAmount: r.max_amount,
      reasonQuote: r.reason_quote,
      appliedCount: rawRows.filter((row) => !row.reversed && row.kind === "expense" && row.category === r.category && ruleMatches(rule, row)).length,
    };
  });

  const notices = all<{ id: string; kind: TNotice["kind"]; title: string; body: string; goal_id: string | null; created_at: string }>(
    db, "SELECT * FROM notices ORDER BY created_at DESC, rowid DESC",
  ).map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, goalId: n.goal_id, createdAt: n.created_at }));

  const panchayats = all<{ id: string; trigger_json: string; ruling_text: string | null; created_at: string }>(
    db, "SELECT id, trigger_json, ruling_text, created_at FROM panchayats ORDER BY created_at DESC, rowid DESC",
  ).map((p) => {
    const trigger = JSON.parse(p.trigger_json) as TPanchayat["trigger"];
    return { id: p.id, label: `${trigger.label} ${formatInr(trigger.amount)}`, rulingQuote: p.ruling_text, createdAt: p.created_at };
  });

  const review = getProfileValue(db, "latest_review");

  return {
    simMonth,
    syntheticData: true,
    profile: {
      monthlyIncome: income,
      fixedCosts: fixed,
      emergencyFund: emergency ? emergency.earmarked : Number(getProfileValue(db, "emergency_fund") ?? 0),
      expectedBonus: bonus == null ? null : Number(bonus),
      monthlySurplus: income - fixed - living - committed,
      monthSpend: spendForMonth(db, simMonth),
      livingBudget: living,
      goalContributions: committed,
    },
    cash: {
      balance: cashBalance,
      unexplained: Math.max(0, cashBalance),
      flag: cashBalance < 0 ? `Cash wallet is ${formatInr(-cashBalance)} short: a withdrawal may be missing` : null,
    },
    rows,
    people,
    emis: openEmiPlans(db).map((p) => ({ name: p.name, monthly: p.monthly, instalmentsLeft: instalmentsLeft(db, p) })),
    goals,
    rules,
    notices,
    review: review ? (JSON.parse(review) as TMonthlyReview) : null,
    panchayats,
  };
}

export function addNotice(db: DatabaseSync, n: Omit<TNotice, "id" | "createdAt">): TNotice {
  const notice: TNotice = { ...n, id: newId("n"), createdAt: new Date().toISOString() };
  db.prepare("INSERT INTO notices (id, kind, title, body, goal_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(notice.id, notice.kind, notice.title, notice.body, notice.goalId, notice.createdAt);
  return notice;
}

export function logUtterance(db: DatabaseSync, id: string, text: string, parsed: unknown): void {
  db.prepare(`INSERT INTO utterances (id, text, parsed_json, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET text = excluded.text, parsed_json = excluded.parsed_json`)
    .run(id, text, JSON.stringify(parsed ?? null), new Date().toISOString());
}

/** So the review a builder generates comes back through getState. */
export function saveReview(db: DatabaseSync, review: TMonthlyReview): void {
  setProfileValue(db, "latest_review", JSON.stringify(review));
}

/**
 * Moving the clock forward pays each month's contributions into earmarks, so a goal's date holds
 * steady as time passes instead of slipping a month every month. Moving it back only moves the clock.
 */
export function setSimMonth(db: DatabaseSync, month: string): void {
  tx(db, () => {
    const from = simMonthOf(db);
    for (let i = 1; i <= monthsBetween(from, month); i++) {
      const paidIn = addMonths(from, i);
      for (const g of all<GoalRow>(db, "SELECT * FROM goals ORDER BY rowid")) {
        const reduced = g.reduction_months > 0 ? g.reduction_amount : 0;
        const room = g.target - earmarkedFor(db, g.id);
        const pay = Math.min(g.monthly_contribution - reduced, Math.max(0, room));
        if (pay > 0) addEarmark(db, g.id, pay, `Monthly contribution, ${paidIn}`);
        if (g.reduction_months > 0) db.prepare("UPDATE goals SET reduction_months = reduction_months - 1 WHERE id = ?").run(g.id);
      }
    }
    db.prepare("UPDATE sim_clock SET month = ? WHERE id = 1").run(month);
  });
}

export function savePanchayat(db: DatabaseSync, p: TPanchayat): void {
  db.prepare(`INSERT INTO panchayats (id, trigger_json, plans_json, voices_json, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET trigger_json = excluded.trigger_json, plans_json = excluded.plans_json, voices_json = excluded.voices_json`)
    .run(p.id, JSON.stringify(p.trigger), JSON.stringify(p.plans), JSON.stringify(p.voices), p.createdAt);
}

export function getPanchayat(db: DatabaseSync, id: string): TPanchayat | null {
  const row = one<{ id: string; trigger_json: string; plans_json: string; voices_json: string; created_at: string }>(db, "SELECT * FROM panchayats WHERE id = ?", id);
  if (!row) return null;
  return { id: row.id, trigger: JSON.parse(row.trigger_json), plans: JSON.parse(row.plans_json), voices: JSON.parse(row.voices_json), createdAt: row.created_at };
}

export function getRulingId(db: DatabaseSync, panchayatId: string): string | null {
  return one<{ ruling_id: string | null }>(db, "SELECT ruling_id FROM panchayats WHERE id = ?", panchayatId)?.ruling_id ?? null;
}

export function recordRuling(db: DatabaseSync, panchayatId: string, text: string, ops: TRulingOp[]): string {
  const rulingId = `rul-${panchayatId}`;
  db.prepare("UPDATE panchayats SET ruling_id = ?, ruling_text = ?, ops_json = ?, ruled_at = ? WHERE id = ?")
    .run(rulingId, text, JSON.stringify(ops), new Date().toISOString(), panchayatId);
  return rulingId;
}

export function listRulings(db: DatabaseSync): { trigger: TPanchayat["trigger"]; text: string; ruledAt: string }[] {
  return all<{ trigger_json: string; ruling_text: string; ruled_at: string }>(
    db, "SELECT trigger_json, ruling_text, ruled_at FROM panchayats WHERE ruling_text IS NOT NULL ORDER BY ruled_at DESC, rowid DESC",
  ).map((r) => ({ trigger: JSON.parse(r.trigger_json), text: r.ruling_text, ruledAt: r.ruled_at }));
}

export function addCondition(db: DatabaseSync, panchayatId: string, condition: unknown): void {
  db.prepare("INSERT INTO conditions (id, panchayat_id, condition_json, status) VALUES (?, ?, ?, 'pending')")
    .run(newId("c"), panchayatId, JSON.stringify(condition));
}

export function pendingConditions(db: DatabaseSync): ConditionRow[] {
  return all<ConditionRow>(db, "SELECT * FROM conditions WHERE status = 'pending' ORDER BY rowid");
}

export function resolveCondition(db: DatabaseSync, id: string, status: "fired" | "not_met"): void {
  db.prepare("UPDATE conditions SET status = ?, resolved_at = ? WHERE id = ?").run(status, new Date().toISOString(), id);
}

/**
 * The date a ruling sets is a floor, because the date engine stays the authority: a goal can't be
 * projected earlier than its money allows, but it can always be moved later.
 */
export function moveGoal(db: DatabaseSync, goalId: string, toMonth: string): void {
  db.prepare("UPDATE goals SET target_month = ?, floor_month = ? WHERE id = ?").run(toMonth, toMonth, goalId);
}

export function setGoalReduction(db: DatabaseSync, goalId: string, amount: number, months: number): void {
  db.prepare("UPDATE goals SET reduction_amount = ?, reduction_months = ? WHERE id = ?").run(amount, months, goalId);
}

export function addRecurring(db: DatabaseSync, r: { name: string; kind: "subscription"; monthly: number; started: string }): void {
  db.prepare("INSERT INTO recurring (id, name, kind, monthly, started) VALUES (?, ?, ?, ?, ?)").run(newId("rec"), r.name, r.kind, r.monthly, r.started);
}
