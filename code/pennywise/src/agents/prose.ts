/** AI-7: generated prose for the monthly review and for Buggy. The same checks as goal lines, then retry, then fallback. */
import { z } from "zod";
import { generateChecked } from "./retry";
import { isUnsafe } from "./safety";
import { delimit, UNTRUSTED_RULE } from "./text";
import { fillTemplate, proseReasons } from "./validator";

const ProseReply = z.object({ text: z.string().describe("Two sentences at most, using {placeholders} for all numbers") });

const ROLE_BRIEF = {
  review: "You write the short summary of the user's month in their money app. Say what stands out and how it affects their goals.",
  buggy: "You are Buggy, the record-keeper in the user's money app, PennyWise. You answer from the facts given, and you say so if they don't answer the question. You hold no professional title, and you don't advise on what to buy.",
} as const;

export function proseSystem(role: "review" | "buggy"): string {
  return `${ROLE_BRIEF[role]}

${UNTRUSTED_RULE}

Write at most two short sentences.
- Language: match the facts. If they include the user's words in Devanagari, write in Devanagari. If in Latin-letter Hinglish, write plain Hinglish. If in English, write English. With no user words, use plain Hinglish.
- Use only the facts given. Add nothing else.
- Never write a number. No digits, and no number words in any language (paanch, hazaar, lakh, half, double, "do mahine"). The ordinary Hindi words "ek" and "do", as in "ek baat" or "kar do", are fine.
- Every number, amount, date and name from the facts must be written as its {placeholder}, spelled exactly as listed. Code fills in the values.
- Example, with facts saved and goal_name: "{goal_name} ke liye {saved} jama hai, aur track par hai."
- Never suggest an investment or name a product: no share, stock, ticker, mutual fund, fund house, SIP, ETF, FD, bond or crypto.
- No elder or village persona, no dialect comedy, no gendered jokes, no surnames, no reference to anyone's community or to words like khap, biradari, hukka-paani, jaati or izzat.`;
}

/** Fact names become placeholders. A label such as "Against ₹82,900" gets a safe name like fact_2. */
function factMap(facts: Record<string, string>): { name: string; label: string; value: string }[] {
  return Object.entries(facts).map(([label, value], i) => ({
    name: /^[A-Za-z_][A-Za-z0-9_]*$/.test(label) ? label : `fact_${i + 1}`,
    label,
    value,
  }));
}

/** MOCK: stands in for Gemini's prose in fake mode. Builds a sentence from the placeholders it was given. */
function fakeProse(role: "review" | "buggy", facts: { name: string; label: string }[]): { text: string } {
  const parts = facts.slice(0, 3).map((f) => `${f.label.replace(/[^\p{L}\p{M} ]/gu, " ").replace(/_/g, " ").replace(/\s+/g, " ").trim()}: {${f.name}}`);
  const opener = role === "review" ? "Is mahine ka hisaab" : "Aapke ledger ke hisaab se";
  return { text: parts.length ? `${opener}: ${parts.join(", ")}.` : `${opener} abhi kuch khaas nahi hai.` };
}

const LAST_RESORT = {
  review: "Is mahine ka hisaab upar table mein hai.",
  buggy: "Yeh jawab abhi nahi likh paaye. Hisaab upar table mein hai.",
} as const;

export async function writeProse(
  role: "review" | "buggy",
  facts: Record<string, string>,
  fallback: string,
): Promise<{ text: string; source: "gemini" | "cache" | "fake" | "template" }> {
  const entries = factMap(facts);
  const known = new Map(entries.map((e) => [e.name, e.value]));
  const offered = entries.filter((e) => !isUnsafe(e.value) && !isUnsafe(e.label));

  const result = await generateChecked(
    {
      role: `prose:${role}`,
      system: proseSystem(role),
      input: delimit("facts", JSON.stringify(offered.map((e) => ({ placeholder: e.name, meaning: e.label, value: e.value })))),
      schema: ProseReply,
      fake: () => fakeProse(role, entries),
    },
    (reply) => {
      const reasons = proseReasons(reply.text, known);
      // The fake and a careless model can both copy a label. Labels aren't scanned as placeholders, so scan the result too.
      if (isUnsafe(fillTemplate(reply.text, known))) reasons.push("unsafe_output");
      return reasons;
    },
  );
  if (result) return { text: fillTemplate(result.data.text, known), source: result.source };
  return { text: isUnsafe(fallback) ? LAST_RESORT[role] : fallback, source: "template" };
}
