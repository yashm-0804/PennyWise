import type { DatabaseSync } from "node:sqlite";
import type { TBuggyResponse, TPriceCheck } from "@/contract/schemas";
import { guardrailCheck, writeProse } from "@/agents";
import { formatInr, progressPercent } from "@/engine";
import { getState } from "@/ledger";
import { askFile } from "./askFile";
import { readApplePrice, type FetchHtml } from "./price";

type Fact = { label: string; value: string };
const GOAL_ALIAS: Record<string, RegExp> = { "g-iphone": /iphone|आईफोन|आई फोन|फोन/i };
const GOAL_WORDS = /budget|इकट्ठा|percent|percentage|प्रतिशत|progress|kitna jama|कितना.*(जमा|बचा)|plan/i;
const SPEND = /kitna\s+kharch|kharch|kharcha|spend|spent|खर्च/i;

/** Illustration only. The rate is assumed and no security is named. */
export function scenarioText(): string {
  const i = 0.06 / 12;
  const fv = Math.round(10_000 * ((1 + i) ** 12 - 1) / i) * 100;
  return `Illustration only: ₹10,000 a month at an assumed 6% a year reaches about ${formatInr(fv)} in 12 months. Not a recommendation.`;
}

async function prose(facts: Fact[], fallback: string) {
  return writeProse("buggy", Object.fromEntries(facts.map((f) => [f.label, f.value])), fallback);
}

export async function answerBuggy(db: DatabaseSync, text: string, opts: { fetchHtml?: FetchHtml } = {}): Promise<TBuggyResponse> {
  const guard = guardrailCheck(text);
  if (guard.refused) {
    const scenario = scenarioText();
    return { answer: guard.message ?? "", intent: "refused", price: null, facts: [], scenario, source: "template" };
  }
  const state = getState(db);
  const lower = text.toLowerCase();
  const goal = state.goals.find((g) => (GOAL_ALIAS[g.id] ?? new RegExp(`\\b${g.name.split(" ")[0].toLowerCase()}`, "i")).test(lower) || lower.includes(g.name.toLowerCase()));
  // A purchase goal gets its live price. Everything else goes to the file.
  const priced = goal ?? (GOAL_WORDS.test(text) && !SPEND.test(text) ? state.goals.find((x) => x.type === "commodity") : undefined);
  if (priced && priced.type === "commodity") return goalAnswer(db, priced, opts.fetchHtml);
  return askFile(db, text);
}

async function goalAnswer(db: DatabaseSync, g: ReturnType<typeof getState>["goals"][number], fetchHtml?: FetchHtml): Promise<TBuggyResponse> {
  const facts: Fact[] = [
    { label: "Goal", value: g.name },
    { label: "Saved", value: formatInr(g.earmarked) },
    { label: "Planned price", value: formatInr(g.target) },
    { label: "Progress at planned price", value: `${progressPercent(g.earmarked, g.target)}%` },
  ];
  let fallback = `${g.name} ke liye ${formatInr(g.earmarked)} jama hai, yani planned ${formatInr(g.target)} ka ${progressPercent(g.earmarked, g.target)}%.`;
  let price: TPriceCheck | null = null;
  if (g.type === "commodity" && g.priceUrl && g.variant) {
    try {
      price = await readApplePrice(g.id, g.variant, { db, fetchHtml });
      const diff = price.price - g.target;
      const pct = progressPercent(g.earmarked, price.price);
      const change = diff > 0 ? `up ${formatInr(diff)} since planning` : diff < 0 ? `down ${formatInr(-diff)} since planning` : "unchanged since planning";
      facts.push(
        { label: price.label, value: formatInr(price.price) },
        { label: "Price change", value: change },
        { label: "Progress at current price", value: `${pct}%` },
      );
      const hinglish = diff > 0 ? `price ${formatInr(diff)} badh gaya` : diff < 0 ? `price ${formatInr(-diff)} ghat gaya` : "price wahi hai";
      fallback += ` ${price.label} ab ${formatInr(price.price)} hai (${hinglish}), toh abhi ${pct}% hua${price.cached ? " (pichli checked price se)" : ""}.`;
    } catch {
      fallback += " Naya price check nahi ho paaya; aap price bata dein toh hisaab kar dunga.";
    }
  }
  const r = await prose(facts, fallback);
  return { answer: r.text, intent: "goal_progress", price, facts, scenario: null, source: r.source };
}
