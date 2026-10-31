/** Munshi's free-form answers: Gemini reads a fact sheet built in code. It may word things, never work out a figure. */
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { guardrailCheck } from "@/agents";
import { isUnsafe } from "@/agents/safety";
import { delimit, UNTRUSTED_RULE } from "@/agents/text";
import type { TAppState, TMunshiResponse } from "@/contract/schemas";
import { formatInr, monthLabel, progressPercent } from "@/engine";
import { getState } from "@/ledger";
import { llmJson } from "@/lib/llm";
import { detectRecurring } from "./recurring";

type Fact = { label: string; value: string };

const Reply = z.object({
  answer: z.string().describe("Two sentences at most, in the speaker's language"),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).describe("Up to 4 figures from the file that back the answer"),
});

export const ASK_SYSTEM = `You are Munshi, the record-keeper in a personal money app. Answer the user's question using only the file you are given.

${UNTRUSTED_RULE}

Rules:
- Every figure, date and name you use must appear in the file, exactly as written there. Never add, subtract, estimate or round. The file already holds the totals, so pick the right one.
- If the file doesn't hold the answer, say so plainly and name what it does hold. Never guess.
- Answer the question directly, in at most two short sentences. Reply in the speaker's language: Hinglish for Hinglish, Devanagari for Devanagari, English for English.
- You describe the user's own money and explain what it means. You may point out a pattern in the file.
- Never recommend or name a share, stock, fund, SIP, ETF, FD, bond or crypto, and never say where to invest. Offer to model a savings scenario instead.
- No elder or village persona, no jokes about anyone's community.
- facts: up to 4 figures from the file that back your answer, with a short label each. Leave it empty if none apply.`;

type Row = TAppState["rows"][number];

const previousMonth = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, "0")}`;
};

function byCategory(rows: Row[], month: string): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.countsAsSpend && r.date.startsWith(month)) totals.set(r.category ?? "other", (totals.get(r.category ?? "other") ?? 0) + r.amount);
  }
  return [...totals].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

/** Everything Munshi may say, already calculated, as display text. */
export function buildFile(db: DatabaseSync, state: TAppState) {
  const m = state.simMonth;
  const live = state.rows.filter((r) => !r.reversed);
  const thisMonth = byCategory(live, m);
  const lastMonth = byCategory(live, previousMonth(m));
  const spends = live.filter((r) => r.countsAsSpend && r.date.startsWith(m)).sort((a, b) => b.amount - a.amount);
  const history = (kinds: string[]) => live.filter((r) => kinds.includes(r.kind)).slice(0, 15).map((r) => `${r.date}: ${r.label}, ${formatInr(r.amount)}`);
  const p = state.profile;
  const left = p.monthlyIncome - p.monthSpend;
  return {
    current_month: monthLabel(m),
    money: {
      monthly_income: formatInr(p.monthlyIncome),
      spent_this_month: formatInr(p.monthSpend),
      [left < 0 ? "overspent_this_month_by" : "left_this_month"]: formatInr(Math.abs(left)),
      fixed_costs_a_month: formatInr(p.fixedCosts),
      spare_a_month_after_plan: formatInr(p.monthlySurplus),
      expected_bonus: p.expectedBonus === null ? "not stated" : formatInr(p.expectedBonus),
    },
    cash_in_hand: { balance: formatInr(state.cash.balance), not_yet_explained: formatInr(state.cash.unexplained) },
    spending_this_month_by_category_largest_first: thisMonth.map((c) => `${c.category}: ${formatInr(c.amount)}`),
    spending_last_month_by_category_largest_first: lastMonth.map((c) => `${c.category}: ${formatInr(c.amount)}`),
    largest_expenses_this_month: spends.slice(0, 8).map((r) => `${r.label}: ${formatInr(r.amount)} on ${r.date}`),
    people_who_owe_you: state.people.filter((x) => x.owesMe > 0).map((x) => `${x.person}: ${formatInr(x.owesMe)}`),
    people_you_owe: state.people.filter((x) => x.iOwe > 0).map((x) => `${x.person}: ${formatInr(x.iOwe)}`),
    lending_history: history(["lend", "repay_in"]),
    borrowing_history: history(["borrow", "repay_out"]),
    emis: {
      total_a_month: formatInr(state.emis.reduce((sum, e) => sum + e.monthly, 0)),
      list: state.emis.map((e) => `${e.name}: ${formatInr(e.monthly)} a month, ${e.instalmentsLeft} instalments left`),
    },
    recurring_payments: detectRecurring(db).map((r) => `${r.payee}: ${formatInr(r.monthly)} a month, last on ${r.lastSeen}, ${r.status.replace("_", " ")}`),
    goals: state.goals.map((g) => `${g.name}: ${formatInr(g.earmarked)} saved of ${formatInr(g.target)}, ${progressPercent(g.earmarked, g.target)}%, on track for ${monthLabel(g.projectedMonth)}`),
    learned_rules: state.rules.map((r) => `${r.pattern} is ${r.category}`),
    past_rulings: state.panchayats.filter((x) => x.rulingQuote).map((x) => `${x.label}: ${x.rulingQuote}`),
  };
}

const numbersIn = (text: string) => (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, "").replace(/\.0+$/, ""));

/** A figure the code never produced is an invented figure, so the reply is rejected. Small counts like "2 categories" are fine. */
export function inventedNumbers(reply: string, file: unknown): string[] {
  const allowed = new Set(numbersIn(JSON.stringify(file)));
  return numbersIn(reply).filter((n) => !allowed.has(n) && !(Number(n) <= 12 && Number.isInteger(Number(n))));
}

const list = (items: string[]) => items.slice(0, 3).join(", ");

/** The same file answered without a model, used in fake mode and whenever Gemini can't give a checked reply. */
export function answerWithoutModel(text: string, state: TAppState, file: ReturnType<typeof buildFile>): { answer: string; facts: Fact[] } {
  const t = text.toLowerCase();
  if (/emi|instal|किस्त/.test(t)) {
    if (file.emis.list.length === 0) return { answer: "Abhi koi EMI nahi chal rahi.", facts: [] };
    return { answer: `Har mahine EMI ${file.emis.total_a_month} jaati hai: ${list(file.emis.list)}.`, facts: [{ label: "EMIs a month", value: file.emis.total_a_month }] };
  }
  if (/borrow|i owe|mujhe dena|maine liya|udhar liya|chukana|लिया|देना है/.test(t)) {
    if (file.people_you_owe.length === 0) return { answer: "Aap kisi ke karzdaar nahi hain.", facts: [] };
    return { answer: `Aapko dena hai: ${list(file.people_you_owe)}.`, facts: [] };
  }
  if (/lent|lend|owes? me|udhar|udhaar|baaki|kisko|उधार|किसको/.test(t)) {
    const named = state.people.find((p) => t.includes(p.person.toLowerCase()));
    if (named) return { answer: `${named.person} ko aapko ${formatInr(named.owesMe)} dene hain, aur aapko unhe ${formatInr(named.iOwe)}.`, facts: [] };
    if (file.people_who_owe_you.length === 0) return { answer: "Abhi kisi ko aapko kuch nahi dena.", facts: [] };
    return { answer: `Aapko milna hai: ${list(file.people_who_owe_you)}.`, facts: [] };
  }
  if (/most|zyada|sabse|where|kahan|category|खर्च.*(कहां|कहाँ)|कहां|कहाँ/.test(t) && file.spending_this_month_by_category_largest_first.length > 0) {
    return { answer: `${file.current_month} mein sabse zyada: ${list(file.spending_this_month_by_category_largest_first)}.`, facts: [] };
  }
  if (/spend|spent|kharch|खर्च/.test(t)) {
    return { answer: `${file.current_month} mein ab tak ${file.money.spent_this_month} kharch hua hai.`, facts: [{ label: "Spent", value: file.money.spent_this_month }] };
  }
  if (/cash|naqad|नकद/.test(t)) return { answer: `Haath mein cash ${file.cash_in_hand.balance} hai.`, facts: [] };
  if (/subscri|recurring|netflix|hotstar|gym/.test(t) && file.recurring_payments.length > 0) {
    return { answer: `Har mahine: ${list(file.recurring_payments)}.`, facts: [] };
  }
  if (/goal|save|bach|बच/.test(t) && file.goals.length > 0) return { answer: `Goals: ${list(file.goals)}.`, facts: [] };
  return { answer: "Yeh aapki file mein nahi mila. Main kharch, EMI, udhar, cash, subscriptions aur goals ke baare mein bata sakta hoon.", facts: [] };
}

function intentOf(text: string): TMunshiResponse["intent"] {
  if (/lent|lend|owe|borrow|udhar|udhaar|उधार/i.test(text)) return "person_balance";
  if (/spend|spent|kharch|खर्च/i.test(text)) return "month_spend";
  return "other";
}

export async function askFile(db: DatabaseSync, text: string): Promise<TMunshiResponse> {
  const state = getState(db);
  const file = buildFile(db, state);
  const local = answerWithoutModel(text, state, file);
  const input = `${delimit("file", JSON.stringify(file))}\n${delimit("question", text)}`;
  const base = { intent: intentOf(text), price: null, scenario: null };

  let correction = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, source } = await llmJson({
        role: "munshi-ask",
        system: ASK_SYSTEM,
        input: `${input}${correction}`,
        schema: Reply,
        fake: () => local, // MOCK: fake mode answers from the same file, without a model.
      });
      const written = `${data.answer} ${data.facts.map((f) => f.value).join(" ")}`;
      const invented = inventedNumbers(written, file);
      if (invented.length === 0 && !isUnsafe(written) && !guardrailCheck(data.answer).refused) {
        return { ...base, answer: data.answer, facts: data.facts.slice(0, 4), source };
      }
      correction = `\nYour last reply was rejected${invented.length ? ` for using figures not in the file: ${invented.join(", ")}` : " for naming an investment"}. Use only figures written in the file.`;
    } catch {
      break;
    }
  }
  return { ...base, ...local, source: "template" };
}
