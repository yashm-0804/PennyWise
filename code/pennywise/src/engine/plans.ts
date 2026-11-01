/** The planner: pure code over AppState. It can only propose actions from the closed PlanAction list. */
import type { TAppState, TFactSheet, TGoalView, TPlan, TPlanAction, TTrigger } from "@/contract/schemas";
import { addMonths, formatInr, maxMonth, monthLabel, monthsBetween, progressPercent, projectMonth } from "./dates";

export const ASSUMED_EMI_RATE = 14;
const EMI_MONTHS = 12;
const FLOOR_COVER_MONTHS = 3;
const FIRST_GOAL_MAX_DELAY = 2;
const TRIM_PERCENT = 30;
const TRIM_MONTHS = 6;
const HEAVY_INCOME_SHARE = 0.25;
const MAX_VOICES = 3;

/** Heavy means more than the month's surplus and more than a quarter of income, so a ₹5,000 plumber stays a row. */
export function isHeavy(state: TAppState, amount: number): boolean {
  const { monthlyIncome, monthlySurplus } = state.profile;
  return amount > Math.max(monthlySurplus, monthlyIncome * HEAVY_INCOME_SHARE);
}

/** What the month's costs must be, given income, surplus and contributions. */
/** The least the emergency fund may be drawn down to. */
export function emergencyFloor(state: TAppState): number {
  return FLOOR_COVER_MONTHS * monthlyCosts(state);
}

export function monthlyCosts(state: TAppState): number {
  const committed = state.goals.reduce((s, g) => s + g.monthlyContribution, 0);
  return Math.max(0, state.profile.monthlyIncome - state.profile.monthlySurplus - committed);
}

function coverMonths(state: TAppState, fund: number): string {
  const costs = monthlyCosts(state);
  return costs > 0 ? (fund / costs).toFixed(1) : "unknown";
}

function impact(state: TAppState, g: TGoalView, given: number) {
  const computed = projectMonth(state.simMonth, g.target, g.earmarked - given, g.monthlyContribution);
  const afterMonth = maxMonth(g.projectedMonth, computed);
  return {
    goalId: g.id,
    goalName: g.name,
    beforeMonth: g.projectedMonth,
    afterMonth,
    deltaMonths: monthsBetween(g.projectedMonth, afterMonth),
    amountGiven: given,
  };
}

/** EMI instalment in paise, rounded up to a whole rupee. */
export function emiInstalment(principal: number, annualRatePercent: number, months: number): number {
  const r = annualRatePercent / 1200;
  const raw = r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
  return Math.ceil(raw / 100) * 100;
}

function baseAssumptions(state: TAppState): string[] {
  const out: string[] = [];
  if (state.profile.monthlyIncome <= 0) out.push("Assumption: income not set, so no surplus is counted");
  out.push(state.profile.expectedBonus == null ? "Assumption: no bonus stated, so none is counted" : "Assumption: the expected bonus is not counted until it arrives");
  return out;
}

function surplusAction(surplus: number): TPlanAction[] {
  return surplus > 0 ? [{ kind: "use_surplus", amount: surplus }] : [];
}

type Candidate = Omit<TPlan, "id">;

/** Goals give up earmarked money. The smallest date goal gives first and moves at most two months, unless more is needed. */
function goalsChipIn(state: TAppState, amount: number, surplus: number): Candidate | null {
  let need = amount - surplus;
  const assumptions = [`Assumption: only this month's surplus of ${formatInr(surplus)} is used`, ...baseAssumptions(state)];
  if (need <= 0) return { title: "Use this month's surplus", actions: [{ kind: "use_surplus", amount }], impacts: [], assumptions };
  const dated = state.goals.filter((g) => g.type === "date" && g.earmarked > 0).sort((a, b) => a.target - b.target);
  const commodity = state.goals.filter((g) => g.type === "commodity" && g.earmarked > 0);
  const given = new Map<string, number>();
  const take = (g: TGoalView, cap: number) => {
    const already = given.get(g.id) ?? 0;
    const portion = Math.min(need, Math.max(0, cap - already));
    if (portion > 0) {
      given.set(g.id, already + portion);
      need -= portion;
    }
  };
  dated.forEach((g, i) => take(g, i === 0 ? Math.min(g.earmarked, FIRST_GOAL_MAX_DELAY * g.monthlyContribution) : g.earmarked));
  dated.forEach((g) => take(g, g.earmarked));
  commodity.forEach((g) => take(g, g.earmarked));
  if (need > 0) return null;
  const order = [...dated, ...commodity].filter((g) => given.has(g.id));
  const impacts = order.map((g) => impact(state, g, given.get(g.id)!));
  return {
    title: `Surplus, then ${order.map((g) => g.name).join(" and ")} give way`,
    actions: [...surplusAction(surplus), ...impacts.map((i): TPlanAction => ({ kind: "delay_goal", goalId: i.goalId, toMonth: i.afterMonth }))],
    impacts,
    assumptions,
  };
}

/** Draws on the emergency fund, only down to its floor. */
function drawEmergency(state: TAppState, amount: number, surplus: number): Candidate | null {
  const need = amount - surplus;
  const fund = state.goals.find((g) => g.type === "emergency");
  if (need <= 0 || !fund) return null;
  const floor = emergencyFloor(state);
  if (fund.earmarked - need < floor) return null;
  return {
    title: `Surplus, then draw on ${fund.name}`,
    actions: [...surplusAction(surplus), { kind: "draw_emergency", amount: need }],
    impacts: [impact(state, fund, need)],
    assumptions: [`Assumption: the fund's floor is three months of costs, ${formatInr(floor)}`, ...baseAssumptions(state)],
  };
}

/** An EMI at an assumed rate. Whatever the surplus can't cover comes out of contributions, least essential goal first. */
function emiPlan(state: TAppState, amount: number, surplus: number): Candidate | null {
  const monthly = emiInstalment(amount, ASSUMED_EMI_RATE, EMI_MONTHS);
  let shortfall = monthly - surplus;
  const actions: TPlanAction[] = [{ kind: "emi", months: EMI_MONTHS, annualRatePercent: ASSUMED_EMI_RATE }];
  const impacts: TPlan["impacts"] = [];
  const order = [...state.goals.filter((g) => g.type === "commodity"), ...state.goals.filter((g) => g.type === "date").sort((a, b) => a.target - b.target)];
  for (const g of order) {
    if (shortfall <= 0) break;
    const cut = Math.min(shortfall, g.monthlyContribution);
    if (cut <= 0) continue;
    actions.push({ kind: "reduce_contribution", goalId: g.id, amount: cut, months: EMI_MONTHS });
    impacts.push(impact(state, g, cut * EMI_MONTHS));
    shortfall -= cut;
  }
  if (shortfall > 0) return null;
  return {
    title: `EMI over ${EMI_MONTHS} months`,
    actions,
    impacts,
    assumptions: [`Assumption: ${ASSUMED_EMI_RATE}% a year, say your actual rate to change this`, `Instalment works out to ${formatInr(monthly)} a month`, ...baseAssumptions(state)],
  };
}

/** Trims the biggest flexible budget, using the average of finished months as that budget. */
function trimBudget(state: TAppState, amount: number, surplus: number): Candidate | null {
  const dining = state.rows.filter((r) => r.category === "dining" && r.countsAsSpend && r.date.slice(0, 7) < state.simMonth);
  const months = new Set(dining.map((r) => r.date.slice(0, 7))).size;
  if (months === 0) return null;
  const average = Math.round(dining.reduce((s, r) => s + r.amount, 0) / months);
  const saved = Math.round((average * TRIM_PERCENT) / 100) * TRIM_MONTHS;
  if (surplus + saved < amount) return null;
  return {
    title: `Trim dining by ${TRIM_PERCENT}% for ${TRIM_MONTHS} months`,
    actions: [...surplusAction(Math.min(surplus, amount)), { kind: "reduce_budget", category: "dining", percent: TRIM_PERCENT, months: TRIM_MONTHS }],
    impacts: [],
    assumptions: [`Assumption: dining budget taken as the ${formatInr(average)} monthly average so far`, ...baseAssumptions(state)],
  };
}

/** Only a what-if can wait: a confirmed expense was said to be needed now. */
function deferPlan(state: TAppState, trigger: TTrigger, surplus: number): Candidate | null {
  if (trigger.kind !== "whatif" || surplus <= 0) return null;
  const toMonth = addMonths(state.simMonth, Math.ceil(trigger.amount / surplus));
  return {
    title: `Wait until ${monthLabel(toMonth)}`,
    actions: [{ kind: "defer_expense", toMonth }],
    impacts: [],
    assumptions: [`Assumption: the surplus of ${formatInr(surplus)} a month is saved until then`, ...baseAssumptions(state)],
  };
}

/** Up to three feasible plans, each built on a different action. Fewer if fewer are feasible; none if nothing covers it. */
export function generatePlans(state: TAppState, trigger: TTrigger): TPlan[] {
  const surplus = Math.max(0, state.profile.monthlySurplus);
  const candidates = [
    goalsChipIn(state, trigger.amount, surplus),
    drawEmergency(state, trigger.amount, surplus),
    emiPlan(state, trigger.amount, surplus),
    trimBudget(state, trigger.amount, surplus),
    deferPlan(state, trigger, surplus),
  ].filter((c): c is Candidate => c !== null);
  return candidates.slice(0, 3).map((c, i) => ({ id: "ABC"[i], ...c }));
}

/** Walks plans in order, so the plan listed first is always heard, and stops at three goals. */
export function affectedGoals(_state: TAppState, plans: TPlan[]): string[] {
  const ids: string[] = [];
  for (const plan of plans) {
    for (const i of plan.impacts) {
      if ((i.deltaMonths > 0 || i.amountGiven > 0) && !ids.includes(i.goalId)) ids.push(i.goalId);
    }
  }
  return ids.slice(0, MAX_VOICES);
}

const slug = (goalId: string) => goalId.replace(/^g-/, "").replace(/[^a-z0-9]+/gi, "_").toLowerCase();

/** Each goal sees only its own numbers, as named placeholders that code fills into the agent's line. */
const monthsWord = (n: number) => `${n} ${n === 1 ? "mahina" : "mahine"}`;

export function buildFactSheets(state: TAppState, trigger: TTrigger, plans: TPlan[], precedent: string | null): TFactSheet[] {
  return affectedGoals(state, plans).map((goalId) => {
    const g = state.goals.find((x) => x.id === goalId)!;
    const s = slug(goalId);
    const own = plans.map((p) => ({ plan: p, impact: p.impacts.find((i) => i.goalId === goalId) ?? null }));
    const hits = own.flatMap((o) => (o.impact ? [o.impact] : []));
    const worst = hits.reduce((a, b) => (b.deltaMonths > a.deltaMonths ? b : a), hits[0]);
    const placeholders: Record<string, string> = {
      goal_name: g.name,
      trigger_amount: formatInr(trigger.amount),
      goal_target: formatInr(g.target),
      goal_earmarked: formatInr(g.earmarked),
      goal_progress_percent: `${progressPercent(g.earmarked, g.target)}%`,
      goal_current_month: monthLabel(g.projectedMonth),
      goal_delay_months: monthsWord(worst.deltaMonths),
      goal_after_month: monthLabel(worst.afterMonth),
      goal_amount_given: formatInr(worst.amountGiven),
      [`${s}_delay_months`]: monthsWord(worst.deltaMonths),
      [`${s}_after_month`]: monthLabel(worst.afterMonth),
      [`${s}_amount_given`]: formatInr(worst.amountGiven),
    };
    for (const { plan, impact: i } of own) {
      if (!i) continue;
      const key = `plan_${plan.id.toLowerCase()}`;
      placeholders[`${key}_delay_months`] = monthsWord(i.deltaMonths);
      const partner = plan.impacts.find((x) => x.goalId !== goalId);
      if (partner) placeholders[`${key}_partner`] = partner.goalName;
      placeholders[`${key}_after_month`] = monthLabel(i.afterMonth);
      placeholders[`${key}_amount_given`] = formatInr(i.amountGiven);
    }
    if (g.type === "emergency") {
      placeholders.goal_cover_months = coverMonths(state, g.earmarked);
      placeholders.goal_cover_months_after = coverMonths(state, g.earmarked - worst.amountGiven);
    }
    if (g.reasonQuote) placeholders.reason_quote = g.reasonQuote;
    if (precedent) placeholders.precedent_quote = precedent;
    return {
      goalId,
      goalName: g.name,
      trigger,
      plans: own.map((o) => ({ planId: o.plan.id, title: o.plan.title, impact: o.impact })),
      placeholders,
      reasonQuote: g.reasonQuote,
      precedentQuote: precedent,
    };
  });
}
