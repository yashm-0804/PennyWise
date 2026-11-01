/**
 * AI-2: the checks that run in code on every router item. Check 5, undo, belongs to the ledger.
 * What these can't catch: a plausible wrong amount that is really in the text, such as a mis-heard
 * "15 hazaar" for "50 hazaar". Only the person reading the confirm card can catch that.
 */
import type { TCheckedItem, TRouterItem } from "@/contract/schemas";
import { matchAmount, parseAmounts, unitBefore } from "./numbers";
import { guardrailCheck } from "./safety";
import { formatRupees, normalizeText, say, speakerLang, type Lang } from "./text";

export interface CheckContext {
  /** Paise, like all money outside the router. */
  categoryMedians: Record<string, number>;
  /** Paise. */
  cashBalance: number;
  /** Paise. */
  people: { person: string; owesMe: number; iOwe: number }[];
}

/** Types that write money to the ledger, so they can't go ahead without an amount. */
const NEEDS_AMOUNT = new Set<TRouterItem["type"]>(["expense", "income", "withdrawal", "lend", "borrow", "repay_in", "repay_out", "emi", "card_bill", "earmark"]);
const OUTLIER_TYPES = new Set<TRouterItem["type"]>(["expense", "emi", "card_bill"]);
const BALANCE_TYPES = new Set<TRouterItem["type"]>(["expense", "income", "withdrawal", "lend", "borrow", "repay_in", "repay_out", "emi", "card_bill"]);
const PERSON_TYPES = new Set<TRouterItem["type"]>(["lend", "borrow", "repay_in", "repay_out"]);
/** Below this, a number with no unit could easily be a dropped "hazaar". */
const BARE_SMALL_LIMIT = 100;

type Status = TCheckedItem["status"];
const worse = (a: Status, b: Status): Status => (a === "block" || b === "block" ? "block" : a === "ask" || b === "ask" ? "ask" : "ok");

function appendReadAs(existing: string | null, added: string): string {
  if (!existing || existing === added) return added;
  return existing.includes(added) ? existing : `${existing}; ${added}`;
}

const msg = {
  noQuote: (l: Lang) => say(l, {
    hi: "यह बात आपकी बोली हुई लाइन में नहीं मिली। कितना था, फिर से बताएं?",
    hinglish: "Yeh baat aapki boli hui line mein nahi mili. Kitna tha, phir se batayenge?",
    en: "That phrase isn't in what you said. How much was it?",
  }),
  noAmount: (l: Lang, quote: string) => say(l, {
    hi: `"${quote}" में कितना था?`,
    hinglish: `"${quote}" mein kitna tha?`,
    en: `How much was "${quote}"?`,
  }),
  notInQuote: (l: Lang, amount: string, quote: string) => say(l, {
    hi: `${amount} "${quote}" में नहीं मिला। कितना था?`,
    hinglish: `${amount} "${quote}" mein nahi mila. Kitna tha?`,
    en: `${amount} isn't in "${quote}". How much was it?`,
  }),
  badAmount: (l: Lang) => say(l, { hi: "यह रकम सही नहीं लगती। कितना था?", hinglish: "Yeh amount sahi nahi lagta. Kitna tha?", en: "That amount doesn't look right. How much was it?" }),
  inherited: (l: Lang, spoken: string, amount: string) => say(l, {
    hi: `आपने "${spoken}" कहा। पिछली रकम की unit से ${amount} पढ़ा। सही है?`,
    hinglish: `Aapne "${spoken}" bola. Pichle amount ki unit se ${amount} padha. Sahi hai?`,
    en: `You said "${spoken}". The earlier unit carries over, so this reads as ${amount}. Is that right?`,
  }),
  bareWithUnit: (l: Lang, literal: string, likely: string) => say(l, {
    hi: `${literal} या ${likely}?`,
    hinglish: `${literal} ya ${likely}?`,
    en: `${literal} or ${likely}?`,
  }),
  bareSmall: (l: Lang, literal: string) => say(l, {
    hi: `सिर्फ ${literal}? कोई unit छूट तो नहीं गई?`,
    hinglish: `Sirf ${literal}? Koi unit chhoot toh nahi gayi?`,
    en: `Only ${literal}? Was a unit left out?`,
  }),
  outlier: (l: Lang, category: string) => say(l, {
    hi: `यह ${category} के आम खर्च से तीन गुना से ज़्यादा है। रकम सही है?`,
    hinglish: `Yeh ${category} ke aam kharch se teen guna se zyada hai. Amount sahi hai?`,
    en: `This is more than three times your usual ${category} spend. Is the amount right?`,
  }),
  negativeCash: (l: Lang) => say(l, {
    hi: "इससे cash balance negative हो जाएगा। कोई withdrawal या opening balance छूट गया?",
    hinglish: "Isse cash balance negative ho jayega. Koi withdrawal ya opening balance chhoot gaya?",
    en: "This takes your cash balance negative. Is a withdrawal or an opening balance missing?",
  }),
  overRepaid: (l: Lang, who: string, due: string) => say(l, {
    hi: `${who} का हिसाब ${due} है। यह repayment उससे ज़्यादा है। सही है?`,
    hinglish: `${who} ka hisaab ${due} hai. Yeh repayment usse zyada hai. Sahi hai?`,
    en: `The balance with ${who} is ${due}. This repayment is larger than that. Is it right?`,
  }),
  whichPerson: (l: Lang) => say(l, { hi: "किसके साथ का हिसाब है?", hinglish: "Kiske saath ka hisaab hai?", en: "Who is this with?" }),
  unknown: (l: Lang) => say(l, { hi: "यह समझ नहीं आया। फिर से बताएं?", hinglish: "Yeh samajh nahi aaya. Phir se batayenge?", en: "That wasn't clear. Could you say it again?" }),
};

function collapse(s: string): string {
  return normalizeText(s).replace(/^[\s"'“”‘’.,;:!?।-]+|[\s"'“”‘’.,;:!?।-]+$/g, "");
}

/**
 * Applies the checks in dictation order. The cash balance and each person's balance run across the items,
 * so "10 hazaar nikale, 5 hazaar plumber ko" doesn't raise a false negative-cash question.
 */
export function checkItems(items: TRouterItem[], text: string, context: CheckContext): TCheckedItem[] {
  const lang = speakerLang(text);
  const fullNorm = normalizeText(text);
  const allAmounts = parseAmounts(fullNorm);
  let cash = context.cashBalance;
  const people = new Map(context.people.map((p) => [normalizeText(p.person), { ...p }]));
  const personOf = (name: string) => {
    const key = normalizeText(name);
    const existing = people.get(key);
    if (existing) return existing;
    const created = { person: name, owesMe: 0, iOwe: 0 };
    people.set(key, created);
    return created;
  };
  let searchFrom = 0;

  return items.map((item): TCheckedItem => {
    const messages: string[] = [];
    let status: Status = "ok";
    let readAs = item.read_as;
    const flag = (s: Status, message: string) => { status = worse(status, s); messages.push(message); };

    const quote = collapse(item.source_quote);
    // Search forward first, so a phrase said twice is matched in the right place.
    let quoteIndex = quote ? fullNorm.indexOf(quote, searchFrom) : -1;
    if (quoteIndex < 0 && quote) quoteIndex = fullNorm.indexOf(quote);
    if (quoteIndex >= 0) searchFrom = quoteIndex + quote.length;
    const quoteFound = quoteIndex >= 0;

    if (item.type === "investment_ask") {
      flag("block", guardrailCheck(text).message ?? guardrailCheck("which fund should I buy").message!);
      return { ...item, amount: null, status, messages };
    }

    const rupees = item.amount_rupees;
    if (rupees === null) {
      if (NEEDS_AMOUNT.has(item.type)) flag("block", msg.noAmount(lang, item.source_quote));
      else if (item.type === "goal_create" || item.type === "goal_update" || item.type === "profile_update") {
        if (item.type !== "goal_update") flag("ask", msg.noAmount(lang, item.source_quote));
      } else if (item.type === "unknown") flag("block", msg.unknown(lang));
      if (!quoteFound && item.type !== "unknown") flag("block", msg.noQuote(lang));
      return { ...item, amount: null, status, messages };
    }

    // Check 1: the source check.
    if (!quoteFound) {
      flag("block", msg.noQuote(lang));
      return { ...item, amount: null, status, messages };
    }
    if (!(rupees > 0)) {
      flag("block", msg.badAmount(lang));
      return { ...item, amount: null, status, messages };
    }
    const match = matchAmount(rupees, quote, fullNorm, quoteIndex);
    if (match.kind === "none") {
      flag("block", msg.notInQuote(lang, formatRupees(rupees), item.source_quote));
      return { ...item, amount: null, status, messages };
    }
    if (match.kind === "inherited") {
      const reading = formatRupees(rupees);
      readAs = appendReadAs(readAs, `${match.parsed.text} → ${reading}`);
      flag("ask", msg.inherited(lang, match.parsed.text, reading));
    } else if (match.parsed.bare && match.parsed.value < BARE_SMALL_LIMIT) {
      // The amount really is in the text, but a bare 5 is too easily a dropped "hazaar". Code asks and doesn't rewrite it.
      const unit = unitBefore(allAmounts, match.parsed.index);
      if (unit) {
        const likely = formatRupees(rupees * unit);
        readAs = appendReadAs(readAs, `${match.parsed.text} → ${formatRupees(rupees)} or ${likely}?`);
        flag("ask", msg.bareWithUnit(lang, formatRupees(rupees), likely));
      } else {
        flag("ask", msg.bareSmall(lang, formatRupees(rupees)));
      }
    }

    // Check 2: paise for the ledger. The quote travels with the item for the confirm card.
    const amount = Math.round(rupees * 100);

    // Check 3: outlier against this category's median.
    if (OUTLIER_TYPES.has(item.type) && item.category) {
      const median = context.categoryMedians[item.category];
      if (median > 0 && amount > 3 * median) flag("ask", msg.outlier(lang, item.category));
    }

    // Check 4: balance sanity, running across this dictation.
    if (BALANCE_TYPES.has(item.type)) {
      if (item.type === "withdrawal") cash += amount;
      else if (item.account === "cash") {
        if (item.type === "income" || item.type === "borrow" || item.type === "repay_in") cash += amount;
        else {
          cash -= amount;
          if (cash < 0) flag("ask", msg.negativeCash(lang));
        }
      }
    }
    if (PERSON_TYPES.has(item.type)) {
      if (!item.person) flag("ask", msg.whichPerson(lang));
      else {
        const p = personOf(item.person);
        if (item.type === "lend") p.owesMe += amount;
        if (item.type === "borrow") p.iOwe += amount;
        if (item.type === "repay_in") {
          if (amount > p.owesMe) flag("ask", msg.overRepaid(lang, item.person, formatRupees(p.owesMe / 100)));
          p.owesMe = Math.max(0, p.owesMe - amount);
        }
        if (item.type === "repay_out") {
          if (amount > p.iOwe) flag("ask", msg.overRepaid(lang, item.person, formatRupees(p.iOwe / 100)));
          p.iOwe = Math.max(0, p.iOwe - amount);
        }
      }
    }

    return { ...item, read_as: readAs, amount_text: item.amount_text ?? match.parsed.text, amount, status, messages };
  });
}
