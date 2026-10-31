/** Pure client-flow decisions, kept out of React so they can be tested. */
import type { TAppState, TCheckedItem, TDictateResponse, TGoalDiff, TPanchayat, TPlanAction, TRulingOp } from "@/contract/schemas";
import { inr, month } from "./format";

export type Step = "confirm" | "panchayat" | "munshi" | "no-open-panchayat";

export function stepForRoute(route: TDictateResponse["route"]): Step {
  switch (route) {
    case "entries": return "confirm";
    case "panchayat": return "panchayat";
    case "munshi":
    case "refusal": return "munshi";
    case "ruling": return "no-open-panchayat";
  }
}

export function editAmount(item: TCheckedItem, paise: number): TCheckedItem {
  const next = { ...item, amount: paise, amount_rupees: paise / 100 };
  if (item.status !== "block") return next;
  // A human fixed the row, so it stops blocking. It stays "ask" and says so.
  return { ...next, status: "ask", messages: [...item.messages, "Changed by you"] };
}

export type WhoField = "person" | "goal" | "payee";

/** Which free-text field names this row. */
export function whoField(item: TCheckedItem): WhoField | null {
  if (["lend", "borrow", "repay_in", "repay_out"].includes(item.type)) return "person";
  if (["goal_create", "goal_update", "earmark"].includes(item.type)) return "goal";
  if (["expense", "income", "emi", "card_bill"].includes(item.type)) return "payee";
  return null;
}

export function canConfirm(items: TCheckedItem[]): boolean {
  return items.length > 0 && items.every((i) => i.status !== "block" && i.amount !== 0);
}

export const ITEM_LABEL: Record<TCheckedItem["type"], string> = {
  expense: "Expense", income: "Income", withdrawal: "Cash withdrawal", lend: "Lent", borrow: "Borrowed",
  repay_in: "Repaid to you", repay_out: "You repaid", emi: "EMI", card_bill: "Card bill",
  goal_create: "New goal", goal_update: "Goal change", earmark: "Earmark", profile_update: "Profile change",
  correction: "New rule", whatif: "What-if", ruling: "Ruling", question: "Question",
  investment_ask: "Investment question", unknown: "Not understood",
};

/** Event ids that a confirm added, found by comparing state before and after. */
export function newEventIds(before: TAppState | null, after: TAppState): string[] {
  const seen = new Set(before?.rows.map((r) => r.eventId));
  return after.rows.filter((r) => !seen.has(r.eventId)).map((r) => r.eventId);
}

/** Months holding simulated data: from "simulated" rows, plus any next-month run this session. */
export function simulatedMonths(state: TAppState | null, runThisSession: string[]): Set<string> {
  const months = new Set(runThisSession);
  for (const r of state?.rows ?? []) if (r.source === "simulated") months.add(r.date.slice(0, 7));
  return months;
}

export type GoalRow = { goalId: string; goalName: string; beforeMonth: string };

/** One table row per goal touched by any plan or by the ruling diff. */
export function goalRows(p: TPanchayat, diff: TGoalDiff[]): GoalRow[] {
  const rows = new Map<string, GoalRow>();
  for (const plan of p.plans) {
    for (const i of plan.impacts) {
      if (!rows.has(i.goalId)) rows.set(i.goalId, { goalId: i.goalId, goalName: i.goalName, beforeMonth: i.beforeMonth });
    }
  }
  for (const d of diff) {
    if (!rows.has(d.goalId)) rows.set(d.goalId, { goalId: d.goalId, goalName: d.goalName, beforeMonth: d.beforeMonth });
  }
  return [...rows.values()];
}

export type Names = Record<string, string>;

export function goalNames(state: TAppState | null): Names {
  return Object.fromEntries((state?.goals ?? []).map((g) => [g.id, g.name]));
}

export function actionLabel(a: TPlanAction, names: Names): string {
  switch (a.kind) {
    case "use_surplus": return `${inr(a.amount)} from surplus`;
    case "draw_emergency": return `${inr(a.amount)} from emergency fund`;
    case "delay_goal": return `${names[a.goalId] ?? "Goal"} to ${month(a.toMonth)}`;
    case "reduce_contribution": return `${names[a.goalId] ?? "Goal"} gives ${inr(a.amount)} for ${a.months} mo`;
    case "reduce_budget": return `${a.category} budget −${a.percent}% for ${a.months} mo`;
    case "defer_expense": return `Defer to ${month(a.toMonth)}`;
    case "emi": return `${a.months}-month EMI at ${a.annualRatePercent}%`;
  }
}

/** The plain-language lines a ruling adds beyond its date diff. */
export function opNotes(ops: TRulingOp[], names: Names): string[] {
  const notes: string[] = [];
  for (const op of ops) {
    if (op.op === "hold_goal") notes.push(`${names[op.goalId] ?? "Goal"} on hold until ${op.until}`);
    if (op.op === "add_condition") {
      const { cmp, amount, then } = op.condition;
      notes.push(`If bonus ${cmp === "lt" ? "under" : "is at least"} ${inr(amount)}: ${names[then.goalId] ?? "goal"} to ${month(then.toMonth)}`);
    }
  }
  return notes;
}

export function chosenPlanId(ops: TRulingOp[]): string | null {
  for (const op of ops) if (op.op === "choose_plan") return op.planId;
  return null;
}
