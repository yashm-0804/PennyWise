/** The plain reason behind each Home figure. All from code, so the explanation can't disagree with the number. */
import type { TAppState } from "@/contract/schemas";
import { humanize, inr, month, monthsBetween } from "./format";

type Row = TAppState["rows"][number];
type Goal = TAppState["goals"][number];

function biggestSpend(state: TAppState): Row | undefined {
  return state.rows
    .filter((r) => r.countsAsSpend && r.date.startsWith(state.simMonth))
    .sort((a, b) => b.amount - a.amount)[0];
}

export function leftReason(state: TAppState): string {
  const { monthlyIncome: income, monthSpend: spent } = state.profile;
  const left = income - spent;
  const sum = `${inr(income)} income − ${inr(spent)} spent in ${month(state.simMonth)}.`;
  if (left >= 0) return `${sum} This much is still unspent this month.`;
  const top = biggestSpend(state);
  const cause = top ? ` Biggest cost: ${top.label}, ${inr(top.amount)}.` : "";
  return `${sum} It's negative because you spent ${inr(-left)} more than came in this month.${cause} Money from your savings doesn't reduce this figure.`;
}

export function ringReason(state: TAppState): string {
  const { monthlyIncome: income, monthSpend: spent } = state.profile;
  if (spent > income) return `0% because spending (${inr(spent)}) has passed this month's income (${inr(income)}).`;
  return `The share of this month's ${inr(income)} income you haven't spent yet.`;
}

export function spentReason(state: TAppState): string {
  const top = biggestSpend(state);
  return `Everything counted as spending in ${month(state.simMonth)}.${top ? ` Biggest: ${top.label}, ${inr(top.amount)}.` : ""} Cash withdrawals, money lent and repayments aren't counted.`;
}

export function fixedReason(state: TAppState): string {
  const emis = state.emis.reduce((sum, e) => sum + e.monthly, 0);
  return `Bills you pay every month, such as rent and subscriptions${emis ? `, including ${inr(emis)} of EMIs` : ""}.`;
}

export function safetyReason(state: TAppState): string {
  const { emergencyFund, fixedCosts, livingBudget = 0 } = state.profile;
  const costs = fixedCosts + livingBudget;
  const cover = costs > 0 ? ` That covers about ${(emergencyFund / costs).toFixed(1)} months of costs.` : "";
  return `Money set aside in your Emergency Fund.${cover} A plan that draws on it lowers this number.`;
}

export function spareReason(state: TAppState): string {
  const { monthlyIncome, fixedCosts, livingBudget, goalContributions, monthlySurplus } = state.profile;
  const parts = [`${inr(monthlyIncome)} income`, `${inr(fixedCosts)} fixed costs`];
  if (livingBudget !== undefined) parts.push(`${inr(livingBudget)} day-to-day`);
  if (goalContributions !== undefined) parts.push(`${inr(goalContributions)} going to goals`);
  const sum = `${parts.join(" − ")}.`;
  return monthlySurplus < 0
    ? `${sum} It's negative because your plan commits more each month than comes in.`
    : `${sum} This is what's free each month after your plan.`;
}

export function goalReason(goal: Goal): string {
  const late = monthsBetween(goal.targetMonth, goal.projectedMonth);
  const timing = late > 0 ? `That's ${late} months after your target.` : late < 0 ? `That's ${-late} months ahead of your target.` : "That's on your target.";
  return `${inr(goal.earmarked)} saved of ${inr(goal.target)}. At ${inr(goal.monthlyContribution)} a month you'll get there in ${month(goal.projectedMonth)}. ${timing}`;
}

export function cashReason(state: TAppState): string {
  const { balance, unexplained } = state.cash;
  if (balance < 0) return "Negative because you've logged more cash spending than cash withdrawals. Tell me about a withdrawal or your opening cash to fix it.";
  if (unexplained > 0) return `Cash you withdrew minus cash you've logged as spent. ${inr(unexplained)} hasn't been explained yet. It isn't counted as spending until you say where it went.`;
  return "Cash you withdrew minus cash you've logged as spent.";
}

export function owedReason(person: string, state: TAppState): string {
  const rows = state.rows.filter((r) => !r.reversed && r.label.toLowerCase().includes(person.toLowerCase()) && ["lend", "repay_in"].includes(r.kind));
  const last = rows[0];
  return `Money you lent minus what ${person} has repaid.${last ? ` Latest: ${last.label}, ${inr(last.amount)}.` : ""} It isn't counted as spending.`;
}

export function oweReason(person: string): string {
  return `Money you borrowed from ${person} minus what you've repaid. It isn't counted as income.`;
}

export function emiReason(emi: TAppState["emis"][number]): string {
  return `Your monthly instalment, with ${emi.instalmentsLeft} left. Each one counts as spending in the month it's paid, and the full price is never counted too.`;
}

export function rowReason(row: Row): string {
  if (row.reversed) return "You undid this, so it no longer counts.";
  const category = row.category ? ` under ${humanize(row.category)}` : "";
  switch (row.kind) {
    case "withdrawal":
      return row.countsAsSpend
        ? "You marked this cash as spent, so all of it counts as spending now."
        : "Moved from your bank to cash in hand. Not spending until you say where it went.";
    case "lend": return "Money you lent. It isn't spending, because you expect it back.";
    case "borrow": return "Money you borrowed. It isn't income, because you owe it back.";
    case "repay_in": return "Someone paid you back. It isn't income, because it was already your money.";
    case "repay_out": return "You repaid a loan. It isn't spending, because the money was borrowed.";
    case "income": return "Money that came in. It adds to this month's income picture, not to spending.";
    case "card_bill": return "Paying your card bill. The purchases already counted, so this doesn't count twice.";
    case "emi": return "This month's EMI. It counts as spending now, and the full price is never counted too.";
    default: return row.countsAsSpend ? `Counted as spending${category}.` : `Not counted as spending${category}.`;
  }
}
