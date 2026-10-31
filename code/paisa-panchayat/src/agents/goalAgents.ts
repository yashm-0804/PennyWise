/** AI-3: one separate model call per goal, in parallel. Each call sees only its own fact sheet. */
import { AgentReply, type TAgentReply, type TFactSheet, type TVoice } from "@/contract/schemas";
import { generateChecked } from "./retry";
import { isUnsafe } from "./safety";
import { delimit, normalizeText, UNTRUSTED_RULE } from "./text";
import { fillPlaceholders, sheetValues, validateLine } from "./validator";

export const GOAL_AGENT_SYSTEM = `You are one savings goal speaking at a meeting about a new expense. You speak for this goal only, and you know only the fact sheet you are given. Other goals speak in their own separate calls.

${UNTRUSTED_RULE}

Return two things.

1. stances: one entry for every plan on the sheet, using its exact planId.
- defend: this plan protects you or costs you nothing, so you back it.
- concede: this plan costs you, but the cost is acceptable.
- oppose: this plan costs you too much.
Decide from the plan's impact on you. A larger delay is more reason to oppose.

2. line: what you say out loud, under 14 words.

Rules for the line:
- Plain, direct Hinglish in Latin letters. If the trigger quote is in Devanagari, write in Devanagari Hinglish instead. Speak as the goal itself, and say why, not just what.
- Never write a number. No digits, and no number words in any language: paanch, hazaar, lakh, das, half, double, "do mahine", "ek saal". The ordinary Hindi words "ek" and "do", as in "ek baat" or "kar do", are fine.
- Every number, month, amount and quote must be a {placeholder} from available_placeholders, spelled exactly, in curly braces. Code fills in the values. Never invent a placeholder.
- {reason_quote} is the user's own stored reason for this goal, and {precedent_quote} is their earlier ruling. Use them when they are listed, because they are your best argument. Never add quote marks around them, and never retype their words.
- Your name, if you need it, is {goal_name}.
- Keep your verbs free of gender: "yeh nahi chalega" rather than "main nahi karunga".
- Count your words before answering. A {placeholder} counts as one word.

What makes a good line:
- Take a position on a named plan: which plan you'd accept, which you refuse, and what you'd give. Say the plan's letter, as in "Plan A". Don't only complain.
- Bargain when a plan has a {plan_a_partner}: offer your share only if that goal gives too.
- An emergency fund argues about months of cover. A trip or a purchase can give way a little and says so. A big long-term goal defends its reason.
- Use {reason_quote} at most when the reason is your strongest argument, and don't open with "Tumne kaha tha" every time.

Good lines (use only placeholders your sheet actually lists):
- "Plan A mein {plan_a_amount_given} de dunga, agar {plan_a_partner} bhi de."
- "{reason_quote}. Plan A mujhse {plan_a_delay_months} chheen raha hai."
- "Cover {goal_cover_months} se {goal_cover_months_after} ho jaayega. Plan B nahi."
- "Plan C theek hai, mujhe chhoota bhi nahi."
- "Pichli baar tumne kaha tha {precedent_quote}. Usi par chalo."
Bad lines: "Mujhe 4 mahine peeche mat karo" (digit), "Do mahine ka nuksan hai" (number word), "Deposit ke liye bola tha" (retyped quote), "Paisa liquid fund mein daalo" (product), "Nuksan mat do" (no position on any plan).

Never do these:
- Never suggest an investment or name a product: no share, stock, ticker, mutual fund, fund house, SIP, ETF, FD, bond or crypto. Plans can only delay a goal, reduce a budget, use surplus, draw the emergency fund, defer the expense, or take an EMI at the user's stated rate.
- No elder, village or uncle persona. No dialect comedy, gendered jokes, surnames, or anyone's community. Never use words like khap, biradari, hukka-paani, jaati or izzat, or any caste name.`;

const QUOTE_FIELDS = (sheet: TFactSheet) => ({
  reasonQuote: sheet.reasonQuote && !isUnsafe(sheet.reasonQuote) ? sheet.reasonQuote : null,
  precedentQuote: sheet.precedentQuote && !isUnsafe(sheet.precedentQuote) ? sheet.precedentQuote : null,
});

/** Code picks each goal's angle from its own numbers, so the three voices argue differently. */
export function speakingAngle(sheet: TFactSheet): string {
  const v = sheet.placeholders;
  if (v.goal_cover_months) {
    return "Argue about months of cover. Use {goal_cover_months} and {goal_cover_months_after}. Name the plan you refuse.";
  }
  const hit = sheet.plans.find((p) => p.impact && p.impact.deltaMonths > 0);
  const key = hit ? `plan_${hit.planId.toLowerCase()}` : null;
  if (hit?.impact && hit.impact.deltaMonths <= 3 && key && v[`${key}_partner`]) {
    return `You can give way a little. Your stance on plan ${hit.planId} is concede. Offer {${key}_amount_given} only if {${key}_partner} gives too. Don't use {reason_quote}.`;
  }
  return "You lose the most. Defend your reason with {reason_quote} and say what the plan costs you. Your stance on the plan that hurts you is oppose.";
}

/** The prompt holds only this one sheet. Quotes that fail the safety scan never reach the model. */
export function goalAgentInput(sheet: TFactSheet): string {
  const available: Record<string, string> = {};
  for (const [name, value] of sheetValues(sheet)) if (!isUnsafe(value)) available[name] = value;
  const { reasonQuote, precedentQuote } = QUOTE_FIELDS(sheet);
  return delimit(
    "fact_sheet",
    JSON.stringify({
      goal: sheet.goalName,
      trigger: {
        kind: sheet.trigger.kind,
        label: isUnsafe(sheet.trigger.label) ? null : sheet.trigger.label,
        quote: isUnsafe(sheet.trigger.quote) ? null : sheet.trigger.quote,
        hypothetical: sheet.trigger.hypothetical,
      },
      plans: sheet.plans,
      reason_quote: reasonQuote,
      precedent_quote: precedentQuote,
      available_placeholders: available,
      your_angle: speakingAngle(sheet),
    }),
  );
}

/** Code's own stances: the worst-hit plan is opposed, others conceded, untouched ones defended. */
export function computeStances(sheet: TFactSheet): TAgentReply["stances"] {
  const worst = Math.max(0, ...sheet.plans.map((p) => p.impact?.deltaMonths ?? 0));
  return sheet.plans.map((p) => {
    const delta = p.impact?.deltaMonths ?? 0;
    if (delta <= 0 && !p.impact?.amountGiven) return { planId: p.planId, stance: "defend" as const };
    return { planId: p.planId, stance: delta > 0 && delta === worst ? ("oppose" as const) : ("concede" as const) };
  });
}

function costPlaceholder(sheet: TFactSheet): string | null {
  const names = Object.keys(sheet.placeholders).filter((n) => !isUnsafe(sheet.placeholders[n]) && !/quote/i.test(n) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
  return names.find((n) => /delay|month|mahin/i.test(n)) ?? names[0] ?? null;
}

const isDevanagari = (s: string | null | undefined) => !!s && /\p{Script=Devanagari}/u.test(s);

/** MOCK: stands in for Gemini's goal voice in fake mode. Built from the sheet, so each goal argues differently. */
export function fakeReply(sheet: TFactSheet): TAgentReply {
  const stances = computeStances(sheet);
  const cost = costPlaceholder(sheet);
  const opposes = stances.some((s) => s.stance === "oppose");
  const { reasonQuote, precedentQuote } = QUOTE_FIELDS(sheet);
  let line: string;
  if (precedentQuote) line = "Pichli baar tumne kaha tha {precedent_quote}. Usi par chalo.";
  else if (opposes && reasonQuote) line = cost ? `Tumne kaha tha {reason_quote}. {${cost}} ka nuksan mat do.` : "Tumne kaha tha {reason_quote}. Yeh plan nahi chalega.";
  else if (opposes) line = cost ? `Yeh plan mujhe {${cost}} peeche karta hai. Manzoor nahi.` : "Yeh plan mujhe peeche karta hai. Manzoor nahi.";
  else if (stances.some((s) => s.stance === "concede")) line = cost ? `Theek hai, {${cost}} chalega, par baaki goals bhi kuch dein.` : "Theek hai, chalega, par baaki goals bhi kuch dein.";
  else line = "Yeh plan mujhe nahi chhoota. Isi par chalo.";
  return { stances, line };
}

/** The line used when the model fails twice. Written by code, and labelled "template" on screen. */
export function templateReply(sheet: TFactSheet): TAgentReply {
  const stances = computeStances(sheet);
  const { reasonQuote } = QUOTE_FIELDS(sheet);
  const cost = costPlaceholder(sheet);
  const deva = isDevanagari(sheet.trigger.quote) || isDevanagari(sheet.reasonQuote);
  const candidates = deva
    ? [reasonQuote ? "आपने कहा था {reason_quote}। इस plan को ध्यान से देखिए।" : null, "इस plan का असर मेरे target पर पड़ता है।"]
    : [
        reasonQuote ? "Tumne kaha tha {reason_quote}. Yeh plan dhyan se dekho." : null,
        cost ? `Is plan se mujhe {${cost}} ka asar padta hai.` : null,
        "Is plan ka asar mere target par padta hai.",
      ];
  const line = candidates.find((c): c is string => !!c && validateLine(c, sheet).ok) ?? "Is plan ka asar mere target par padta hai.";
  return { stances, line };
}

/** Repairs stances in code, because a retry spends scarce quota. Unknown plans go, missing plans get code's stance. */
function repairStances(reply: TAgentReply, sheet: TFactSheet): TAgentReply["stances"] {
  const computed = computeStances(sheet);
  return sheet.plans.map((p) => reply.stances.find((s) => s.planId === p.planId) ?? computed.find((s) => s.planId === p.planId)!);
}

/** The planner picks affected goals, at most 3. This cap keeps a demo run inside the free-tier call budget anyway. */
const MAX_GOAL_AGENTS = 3;

async function runOne(sheet: TFactSheet): Promise<TVoice> {
  const result = await generateChecked(
    {
      role: `goal-agent:${normalizeText(sheet.goalId)}`,
      system: GOAL_AGENT_SYSTEM,
      input: goalAgentInput(sheet),
      schema: AgentReply,
      fake: () => fakeReply(sheet),
    },
    (reply) => validateLine(reply.line, sheet).reasons,
  );
  const reply = result?.data ?? templateReply(sheet);
  return {
    goalId: sheet.goalId,
    goalName: sheet.goalName,
    stances: repairStances(reply, sheet),
    line: fillPlaceholders(reply, sheet),
    source: result?.source ?? "template",
  };
}

/** One failing goal falls back to its template without affecting the others. */
export async function runGoalAgents(sheets: TFactSheet[]): Promise<TVoice[]> {
  return Promise.all(sheets.slice(0, MAX_GOAL_AGENTS).map(runOne));
}
