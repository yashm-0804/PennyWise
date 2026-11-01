/**
 * The amount parser behind the source check. It reads digits, "5k", "10 hazaar", "2 lakh", "70 thousand",
 * Hindi number words, and Devanagari words and numerals. All values are rupees.
 */
import { normalizeText } from "./text";

const LATIN_WORDS: Record<number, string> = {
  1: "ek", 2: "do", 3: "teen tin", 4: "char chaar", 5: "paanch panch pach", 6: "chhe chhah che cheh chhah", 7: "saat sat", 8: "aath ath", 9: "nau", 10: "das dus",
  11: "gyarah gyara", 12: "barah bara", 13: "terah tera", 14: "chaudah chauda", 15: "pandrah pandra", 16: "solah sola", 17: "satrah satra", 18: "atharah athara", 19: "unnis unees", 20: "bees bis",
  21: "ikkis ikkees", 22: "baais bais", 23: "teis teyis", 24: "chaubis chaubees", 25: "pachees pachis", 26: "chhabbis chabbis", 27: "sattais sattaees", 28: "atthais athais", 29: "untees unatis", 30: "tees tis",
  31: "ikattis iktees", 32: "battis battees", 33: "tentis taintees", 34: "chauntis chautees", 35: "paintis paintees", 36: "chhattis chhatees", 37: "saintis saintees", 38: "adtis adtees", 39: "untalis unchaalis", 40: "chalis chaalis chalees",
  41: "iktalis", 42: "bayalis byalis", 43: "tentalis", 44: "chawalis chauvalis", 45: "paintalis", 46: "chhiyalis", 47: "saintalis", 48: "adtalis", 49: "unchas", 50: "pachas pachaas",
  51: "ikyavan", 52: "bavan", 53: "tirpan", 54: "chauvan", 55: "pachpan", 56: "chhappan", 57: "sattavan", 58: "atthavan", 59: "unsath", 60: "saath sath",
  61: "iksath", 62: "basath", 63: "tirsath", 64: "chausath", 65: "painsath", 66: "chhiyasath", 67: "sarsath", 68: "adsath", 69: "unhattar", 70: "sattar",
  71: "ikhattar", 72: "bahattar", 73: "tihattar", 74: "chauhattar", 75: "pachattar", 76: "chhihattar", 77: "satattar", 78: "athattar", 79: "unasi", 80: "assi",
  81: "ikyasi", 82: "bayasi", 83: "tirasi", 84: "chaurasi", 85: "pachasi", 86: "chhiyasi", 87: "sattasi", 88: "athasi", 89: "navasi", 90: "nabbe nabe",
  91: "ikyanve", 92: "banve", 93: "tiranve", 94: "chauranve", 95: "pachanve", 96: "chhiyanve", 97: "sattanve", 98: "atthanve", 99: "ninyanve",
};

const DEVANAGARI_WORDS: string[] = (
  "एक दो तीन चार पाँच|पांच छह|छः|छे सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह|पन्द्रह सोलह सत्रह अठारह उन्नीस बीस " +
  "इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस " +
  "इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ " +
  "इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी " +
  "इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानवे बानवे तिरानवे चौरानवे पचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे"
).split(" ");

const ENGLISH_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const ENGLISH_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

const WORD_VALUE = new Map<string, number>();
for (const [value, forms] of Object.entries(LATIN_WORDS)) for (const f of forms.split(" ")) WORD_VALUE.set(f, Number(value));
DEVANAGARI_WORDS.forEach((forms, i) => forms.split("|").forEach((f) => WORD_VALUE.set(normalizeText(f), i + 1)));
ENGLISH_ONES.forEach((w, i) => { if (w) WORD_VALUE.set(w, i); });
for (const [w, v] of Object.entries(ENGLISH_TENS)) WORD_VALUE.set(w, v);
WORD_VALUE.set("a", 1); // "a lakh"

/**
 * Words that are also ordinary words: "do" (kar do), "ek" (a), "saath" (with), "tera" (your), "bara" (big),
 * "one" (new one), "panch" (a panchayat member). They only count as numbers right before a unit or a currency word.
 */
const ORDINARY = new Set(["ek", "do", "one", "a", "panch", "saath", "sath", "sat", "tera", "bara", "sola", "bis", "che", "tis", "ath", "pach", "tin", normalizeText("एक"), normalizeText("दो")]);

const UNITS: Record<string, number> = {
  sau: 100, hundred: 100, hundreds: 100, [normalizeText("सौ")]: 100,
  k: 1000, thousand: 1000, thousands: 1000, hazaar: 1000, hazar: 1000, hajar: 1000, hajaar: 1000, hazzar: 1000, [normalizeText("हज़ार")]: 1000,
  lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000, [normalizeText("लाख")]: 100000,
  crore: 10000000, crores: 10000000, cr: 10000000, karod: 10000000, karoda: 10000000, [normalizeText("करोड़")]: 10000000,
};
/** Valid as a unit only when glued to digits, such as "2l". */
const GLUED_UNITS: Record<string, number> = { l: 100000 };

const CURRENCY = new Set(["₹", "rs", "inr", "rupaye", "rupay", "rupee", "rupees", "rupiya", "rupiye", "bucks", normalizeText("रुपये"), normalizeText("रुपए"), normalizeText("रुपया")]);

/** A number right before one of these counts something other than money. */
const NOT_MONEY_AFTER = new Set([
  "%", "percent", "pct", "pratishat", "fisad", "mahine", "mahina", "month", "months", "saal", "year", "years", "yrs", "din", "day", "days", "hafte", "hafta", "week", "weeks",
  "baje", "am", "pm", "ghante", "ghanta", "hour", "hours", "minute", "minutes", "kg", "km", "gb", "tb", "inch", "log", "people", "baar", "times", "installments", "instalments", "kisht", "kishte",
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  ...["महीने", "महीना", "साल", "दिन", "हफ्ते", "बजे", "प्रतिशत", "लोग", "बार", "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"].map(normalizeText),
]);
/** A number right after one of these is a model name, as in "iPhone 17". */
const NOT_MONEY_BEFORE = new Set(["iphone", "pixel", "galaxy", "oneplus", "ps", "model", "version", "plan", "section", normalizeText("आईफोन")]);

const FRACTION_ALONE: Record<string, number> = { dedh: 1.5, dhed: 1.5, dhai: 2.5, adhai: 2.5, [normalizeText("डेढ़")]: 1.5, [normalizeText("ढाई")]: 2.5 };
const FRACTION_ADD: Record<string, number> = { saade: 0.5, sade: 0.5, saadhe: 0.5, sadhe: 0.5, sawa: 0.25, sava: 0.25, [normalizeText("साढ़े")]: 0.5, [normalizeText("सवा")]: 0.25 };
const FRACTION_SUB: Record<string, number> = { paune: 0.25, pone: 0.25, [normalizeText("पौने")]: 0.25 };

export interface ParsedAmount {
  /** Rupees. */
  value: number;
  /** The phrase, in normalized text. */
  text: string;
  index: number;
  end: number;
  /** The multiplier of the last unit said, such as 1000 for "10 hazaar". Null if none. */
  unit: number | null;
  /** No unit and no currency word, so its scale is unknown. */
  bare: boolean;
}

interface Tok { s: string; start: number; end: number; kind: "num" | "word" | "sym"; }

function tokenize(text: string): Tok[] {
  const out: Tok[] = [];
  for (const m of text.matchAll(/\d{1,3}(?:,\d{2})*,\d{3}(?:\.\d+)?|\d+(?:\.\d+)?|[\p{L}\p{M}]+|\S/gu)) {
    const s = m[0];
    const kind = /^\d/.test(s) ? "num" : /^[\p{L}\p{M}]/u.test(s) ? "word" : "sym";
    out.push({ s, start: m.index, end: m.index + s.length, kind });
  }
  return out;
}

interface Head { value: number; next: number; ordinary: boolean; numeric: boolean; }

function readHead(toks: Tok[], j: number): Head | null {
  const t = toks[j];
  if (!t) return null;
  if (t.kind === "num") return { value: Number(t.s.replace(/,/g, "")), next: j + 1, ordinary: false, numeric: true };
  if (t.kind !== "word") return null;
  if (t.s in FRACTION_ALONE) return { value: FRACTION_ALONE[t.s], next: j + 1, ordinary: true, numeric: false };
  if (t.s in FRACTION_ADD || t.s in FRACTION_SUB) {
    const inner = readHead(toks, j + 1);
    const sign = t.s in FRACTION_ADD ? FRACTION_ADD[t.s] : -FRACTION_SUB[t.s];
    if (inner) return { value: inner.value + sign, next: inner.next, ordinary: false, numeric: false };
    return { value: 1 + sign, next: j + 1, ordinary: true, numeric: false }; // "sawa lakh", "paune lakh"
  }
  const v = WORD_VALUE.get(t.s);
  if (v === undefined) return null;
  if (t.s in ENGLISH_TENS) {
    const nextWord = toks[j + 1]?.s ?? "";
    const ones = ENGLISH_ONES.indexOf(nextWord);
    if (ones > 0 && ones < 10) return { value: v + ones, next: j + 2, ordinary: false, numeric: false };
  }
  return { value: v, next: j + 1, ordinary: ORDINARY.has(t.s), numeric: false };
}

function unitAt(toks: Tok[], j: number): { mult: number; next: number } | null {
  const t = toks[j];
  if (!t || t.kind !== "word") return null;
  if (t.s in UNITS) return { mult: UNITS[t.s], next: j + 1 };
  const prev = toks[j - 1];
  if (t.s in GLUED_UNITS && prev?.kind === "num" && prev.end === t.start) return { mult: GLUED_UNITS[t.s], next: j + 1 };
  return null;
}

function isCurrency(t: Tok | undefined): boolean {
  return !!t && CURRENCY.has(t.s);
}

/** Finds every money amount in the text, in order. */
export function parseAmounts(input: string): ParsedAmount[] {
  const text = normalizeText(input);
  const toks = tokenize(text);
  const out: ParsedAmount[] = [];
  let i = 0;
  while (i < toks.length) {
    const start = i;
    let j = i;
    let currency = false;
    if (isCurrency(toks[j]) && toks[j].s !== "rupaye") {
      currency = true;
      j++;
      if (toks[j]?.s === ".") j++;
    }
    const firstHead = readHead(toks, j);
    if (!firstHead) { i = start + 1; continue; }

    const first = toks[j];
    const before = toks[j - 1];
    // "T20", "A17": digits glued to letters are a name, not money. "iPhone 17" is a model number.
    const glued = first.kind === "num" && before?.kind === "word" && before.end === first.start;
    const model = !currency && !!before && NOT_MONEY_BEFORE.has(before.s);

    let total = 0;
    let lastUnit: number | null = null;
    let cursor = j;
    let isFirst = true;
    let end = cursor;
    for (;;) {
      const head = readHead(toks, cursor);
      if (!head) break;
      const unit = unitAt(toks, head.next);
      if (unit && (lastUnit === null || unit.mult < lastUnit)) {
        total += head.value * unit.mult;
        lastUnit = unit.mult;
        cursor = unit.next;
        end = cursor;
        isFirst = false;
        continue;
      }
      if (isFirst) {
        total = head.value;
        end = head.next;
      } else if (!unit && !head.ordinary) {
        // "do sau pachas" = 250 and "5 hazaar 500" = 5,500, but "10 hazaar 5 plumber" stays two amounts.
        const afterHundred = lastUnit === 100 && head.value < 100;
        const afterLarger = lastUnit !== null && lastUnit >= 1000 && head.numeric && head.value >= 100 && head.value < lastUnit;
        if (afterHundred || afterLarger) {
          total += head.value;
          end = head.next;
        }
      }
      break;
    }

    const after = toks[end];
    const afterIsGlued = after?.kind === "word" && toks[end - 1]?.end === after.start && !isCurrency(after);
    const trailingCurrency = isCurrency(after) || (after?.s === "/" && toks[end + 1]?.s === "-");
    const hasCurrency = currency || trailingCurrency;
    const nextIndex = Math.max(end, start + 1);

    const notMoney = glued || model || afterIsGlued || (!!after && NOT_MONEY_AFTER.has(after.s));
    const ordinaryWordAlone = lastUnit === null && !hasCurrency && firstHead.ordinary;
    if (notMoney || ordinaryWordAlone || !Number.isFinite(total) || total <= 0) {
      i = nextIndex;
      continue;
    }

    const lastTok = isCurrency(after) ? after : toks[end - 1];
    out.push({
      value: Math.round(total * 100) / 100,
      text: text.slice(toks[start].start, lastTok.end),
      index: toks[start].start,
      end: lastTok.end,
      unit: lastUnit,
      bare: lastUnit === null && !hasCurrency,
    });
    i = isCurrency(after) ? end + 1 : nextIndex;
  }
  return out;
}

/** The first amount in the text, in rupees, or null. */
export function parseAmount(input: string): number | null {
  return parseAmounts(input)[0]?.value ?? null;
}

/** The nearest thousand-or-larger unit said before this position in normalized text. */
export function unitBefore(amounts: ParsedAmount[], index: number): number | null {
  let found: number | null = null;
  for (const a of amounts) if (a.end <= index && a.unit !== null && a.unit >= 1000) found = a.unit;
  return found;
}

export type AmountMatch =
  | { kind: "exact"; parsed: ParsedAmount }
  /** The quote only says "5"; ₹5,000 is right only because an earlier unit carries over. */
  | { kind: "inherited"; parsed: ParsedAmount; unit: number }
  | { kind: "none" };

/**
 * Does this amount appear in the quote? `quoteIndex` is where the quote sits in the normalized full text.
 * An inherited unit never comes from later in the text, or from anything but the nearest earlier unit.
 */
export function matchAmount(rupees: number, quote: string, fullText: string, quoteIndex?: number): AmountMatch {
  const full = normalizeText(fullText);
  const q = normalizeText(quote);
  const index = quoteIndex ?? full.indexOf(q);
  if (index < 0 || !q) return { kind: "none" };
  const all = parseAmounts(full);
  const inside = all.filter((a) => a.index >= index && a.end <= index + q.length);
  const same = (x: number, y: number) => Math.round(x * 100) === Math.round(y * 100);
  const exact = inside.find((a) => same(a.value, rupees));
  if (exact) return { kind: "exact", parsed: exact };
  for (const a of inside) {
    if (!a.bare) continue;
    const unit = unitBefore(all, a.index);
    if (unit !== null && same(a.value * unit, rupees)) return { kind: "inherited", parsed: a, unit };
  }
  return { kind: "none" };
}

/** Number words the validator rejects in model prose. Ordinary words are handled separately. */
export function numberWordKind(word: string): "number" | "ordinary" | null {
  const w = normalizeText(word);
  if (w === "k" || w === "cr" || w === "a") return null;
  if (w in UNITS || w in FRACTION_ALONE || w in FRACTION_ADD || w in FRACTION_SUB) return "number";
  if (!WORD_VALUE.has(w)) return null;
  return ORDINARY.has(w) ? "ordinary" : "number";
}

export function isUnitWord(word: string): boolean {
  return normalizeText(word) in UNITS;
}
