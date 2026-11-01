/** Checks model prose and substitutes values in code. Models never write a number or a quote themselves. */
import type { TAgentReply, TFactSheet } from "@/contract/schemas";
import { isUnitWord, numberWordKind } from "./numbers";
import { bannedHits, denyHits, isUnsafe } from "./safety";
import { normalizeText } from "./text";

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const QUOTE_NAMES = new Set(["reason_quote", "precedent_quote"]);

/** "ek" and "do" are ordinary words, but "do mahine" is a number the model wrote itself. */
const COUNTED_NOUNS = new Set(
  ["mahine", "mahina", "month", "months", "saal", "year", "years", "din", "day", "days", "hafte", "hafta", "week", "weeks", "rupaye", "rupay", "rupees", "rupee", "rs", "percent", "pratishat", "महीने", "महीना", "साल", "दिन", "हफ्ते", "रुपये", "रुपए"].map(normalizeText),
);
const OTHER_NUMBER_WORDS = new Set(
  ["half", "quarter", "double", "twice", "triple", "aadha", "aadhi", "aadhe", "dugna", "dugni", "tigna", "percent", "pratishat", "fisad", "million", "billion", "आधा", "आधी", "दुगना", "प्रतिशत"].map(normalizeText),
);

/** Number words in text, ignoring ordinary uses of "ek", "do", "saath" and similar. */
export function numberWordHits(text: string): string[] {
  const words = normalizeText(text).match(/[\p{L}\p{M}]+/gu) ?? [];
  const hits = new Set<string>();
  words.forEach((w, i) => {
    if (OTHER_NUMBER_WORDS.has(w)) { hits.add(w); return; }
    const kind = numberWordKind(w);
    if (kind === "number") hits.add(w);
    if (kind === "ordinary") {
      const next = words[i + 1];
      if (next && (COUNTED_NOUNS.has(next) || isUnitWord(next))) hits.add(`${w} ${next}`);
    }
  });
  return [...hits];
}

/** Rule failures shared by goal lines and generated prose. `known` holds the placeholders the text may use. */
export function proseReasons(text: string, known: ReadonlyMap<string, string>): string[] {
  const reasons: string[] = [];
  if (!text.trim()) reasons.push("empty");
  for (const m of text.matchAll(PLACEHOLDER)) {
    const value = known.get(m[1]);
    if (value === undefined) reasons.push(`unknown_placeholder:${m[1]}`);
    else if (isUnsafe(value)) reasons.push(`unsafe_placeholder:${m[1]}`);
  }
  const prose = text.replace(PLACEHOLDER, " ");
  if (/[{}]/.test(prose)) reasons.push("malformed_placeholder");
  if (/\p{Nd}/u.test(prose)) reasons.push("digit");
  if (/[₹$%]/u.test(prose)) reasons.push("money_symbol");
  for (const w of numberWordHits(prose)) reasons.push(`number_word:${w}`);
  for (const d of denyHits(prose)) reasons.push(`deny:${d}`);
  for (const b of bannedHits(prose)) reasons.push(`banned:${b}`);
  return reasons;
}

/** Every value a goal's line may refer to. `{goal_name}` exists so a name like "iPhone 17" needs no digits. */
export function sheetValues(sheet: TFactSheet): Map<string, string> {
  const values = new Map<string, string>(Object.entries(sheet.placeholders));
  values.set("goal_name", sheet.goalName);
  if (sheet.reasonQuote) values.set("reason_quote", sheet.reasonQuote);
  else if (!values.get("reason_quote")) values.delete("reason_quote");
  if (sheet.precedentQuote) values.set("precedent_quote", sheet.precedentQuote);
  else if (!values.get("precedent_quote")) values.delete("precedent_quote");
  return values;
}

const MAX_WORDS_EXCLUSIVE = 14;

/** Rejects digits, number words, unknown placeholders, the investment deny-list and banned social terms. */
export function validateLine(line: string, sheet: TFactSheet): { ok: boolean; reasons: string[] } {
  const reasons = proseReasons(line, sheetValues(sheet));
  if (line.trim().split(/\s+/).length >= MAX_WORDS_EXCLUSIVE) reasons.push("too_long");
  return { ok: reasons.length === 0, reasons };
}

/** Single-pass substitution, so a value containing "{x}" or "$&" stays literal text. */
export function fillTemplate(text: string, values: ReadonlyMap<string, string>): string {
  const filled = text.replace(/["“”']?\{([A-Za-z_][A-Za-z0-9_]*)\}["“”']?/g, (whole, name: string) => {
    const value = values.get(name);
    if (value === undefined) return "";
    if (isUnsafe(value)) return "…";
    if (QUOTE_NAMES.has(name)) return `“${value}”`;
    return whole.replace(`{${name}}`, () => value);
  });
  return filled.replace(/\s+([.,!?।])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

/** Puts code-held values into a validated line. */
export function fillPlaceholders(reply: TAgentReply, sheet: TFactSheet): string {
  return fillTemplate(reply.line, sheetValues(sheet));
}
