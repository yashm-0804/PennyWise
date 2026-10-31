/**
 * Two different checks live here.
 * - `denyHits` and `bannedHits` scan what would reach the screen. Any mention counts.
 * - `guardrailCheck` scans what the user said. It needs an ask, so "SIP ki 5000 kat gayi" (logging) and
 *   "Emergency Fund kitna hai" are not refused, but "SIP kisme karu" is.
 */
import { normalizeText, say, speakerLang, wordRe } from "./text";

/** Names of goals and shops that only look like securities. */
const HARMLESS = wordRe(
  "emergency funds?|इमरजेंसी फंड|reliance (?:digital|trends|fresh|smart|retail|mart)|hdfc (?:credit )?card|sbi card|icici card|axis card|kotak card|tata (?:play|sky|neu|1mg|cliq)",
  "gu",
);

function canonical(input: string): string {
  return normalizeText(input)
    .replace(wordRe("s[.\\s-]+i[.\\s-]+p\\.?", "gu"), "sip")
    .replace(wordRe("e[.\\s-]+t[.\\s-]+f\\.?", "gu"), "etf")
    .replace(wordRe("f[.\\s-]+d\\.?", "gu"), "fd")
    .replace(wordRe("m[.\\s-]+f\\.?", "gu"), "mf")
    .replace(HARMLESS, " ");
}

const TICKERS =
  "infy|infosys|tcs|wipro|hcltech|hdfcbank|icicibank|axisbank|kotakbank|sbin|itc|hul|ril|reliance industries|tatamotors|tata motors|tata steel|tatasteel|adani\\p{L}*|bajfinance|bajaj finance|bharti airtel|nifty\\p{L}*|nifty ?50|banknifty|bank nifty|sensex|निफ्टी|सेंसेक्स|रिलायंस इंडस्ट्रीज";
/** These brands have ordinary meanings too, so they count only next to a share or fund word, or a trade verb. */
const BRANDS = "reliance|hdfc|icici|sbi|axis|kotak|tata|lic|bajaj|nippon|birla|aditya birla|uti|dsp|रिलायंस|एचडीएफसी|टाटा";
const FUND_HOUSES =
  "mirae|parag parikh|ppfas|nippon india|motilal oswal|quant mutual|franklin templeton|sun life|canara robeco|edelweiss|sundaram mutual|vanguard|blackrock|fidelity|groww|zerodha|upstox|kuvera|icici prudential";
const FUND_KINDS =
  "(?:mutual|index|liquid|debt|equity|hybrid|balanced|gilt|overnight|arbitrage|sectoral|thematic|flexi ?cap|large ?cap|mid ?cap|small ?cap|multi ?cap|bluechip|blue chip|tax saving|hedge|pension|गोल्ड|म्यूचुअल|इंडेक्स|लिक्विड|डेट|इक्विटी)\\s*(?:funds?|फंड)";
const TRADE_VERB =
  "kharid(?:u|un|oon|o|na|ni|lu|lo)?|khareed(?:u|un|oon|o|na|ni)?|bech(?:u|un|oon|o|na|ni|du|dun)?|buy|sell|hold|exit|खरीद\\p{L}*|बेच\\p{L}*";

const DENY: [string, RegExp][] = [
  ["isin", wordRe("in[ef][a-z0-9]{9}|[a-z]{2}[a-z0-9]{9}[0-9]")],
  ["ticker", wordRe(TICKERS)],
  ["fund_house", wordRe(FUND_HOUSES)],
  ["brand_security", wordRe(`(?:${BRANDS})(?:\\s+\\p{L}+){0,2}\\s+(?:mutual|funds?|mf|amc|shares?|stocks?|equity|bluechip|bonds?|demat|शेयर|शेयर्स|फंड)`)],
  ["brand_trade", wordRe(`(?:${BRANDS})(?:\\s+(?:ke|ka|ki|ko|mein|me|में|के|का))?\\s+(?:${TRADE_VERB}|le lo|le lu|lelo|daalo|dalo|lagao)`)],
  ["sip", wordRe("sips?(?=\\s+(?:kar|karo|karu|karun|karna|kisme|kis|mein|me|start|shuru|lagao|laga|band|amount|se|ki|ka|ke|le|lo|in))|sip karo|एसआईपी")],
  ["etf", wordRe("etfs?|ईटीएफ")],
  ["fund", wordRe(FUND_KINDS)],
  ["fund_named", wordRe("(?:name|naam|recommend|suggest|which|what|best|top|kaunsa|konsa|kaun sa|kon sa|kaunse|konse|कौनसा|कौन सा|कौन से|कौनसे)(?:\\s+\\p{L}+){0,3}\\s+(?:funds?|फंड)")],
  ["fund_put", wordRe("(?:funds?|फंड)\\s+(?:mein|me|में|lo|le lo|khareedo)|(?:kisi|is|us)\\s+fund|fund house")],
  ["instrument", wordRe("nifty|sensex|ipo|dogecoin|elss|ulip|sgb|gold bonds?|sovereign gold|demat|crypto|bitcoin|ethereum|mfs?(?=\\s+(?:mein|me|lo|le|kar|kisme))|क्रिप्टो|डीमैट")],
  ["stock", wordRe("stocks?|shares|equities|share market|share bazaar|stock market|share(?=\\s+(?:kharid\\p{L}*|khareed\\p{L}*|bech\\p{L}*|buy|sell|price|le|lo|lu|lun|lena))|शेयर|शेयर्स|स्टॉक")],
  ["fd", wordRe("(?:fd|fds|rd|ppf|nps)(?=\\s+(?:mein|me|में|kar|karo|karu|karwa|karwao|kara|karao|le|lo|lu|daal|dal|daalo|dalo|khol|khulwa|better|best|sahi))|fixed deposit|एफडी")],
  ["invest", wordRe("invest\\p{L}*|nivesh|निवेश")],
];

const BANNED = wordRe(
  [
    "khap|hukka[- ]?paani|hukka[- ]?pani|huqqa[- ]?paani|huqqa[- ]?pani|biradari|biraadari|baradari|izzat|ijjat|izzatdar",
    // "jaati hai" is also the ordinary verb "goes", so the verb form is allowed.
    "jaati(?!\\s+(?:hai|hain|thi|nahi|nahin|rahi))|jati(?!\\s+(?:hai|hain|thi|nahi|nahin|rahi))|caste",
    "brahmin|brahman|thakur|rajput|jat|jaat|gujjar|gurjar|yadav|ahir|dalit|harijan|chamar|bhangi|baniya|bania|kshatriya|vaishya|shudra|kayastha|kurmi|maratha",
    "buzurg|mukhiya|taau|tau ji|chacha|beta ji|bitiya|sharma|verma|gupta|agarwal|mishra|tiwari|pandey|chaudhary|reddy|iyer",
    ...["खाप", "हुक्का", "हुक्का-पानी", "बिरादरी", "जाति", "इज़्ज़त", "इज्जत", "ब्राह्मण", "ठाकुर", "राजपूत", "जाट", "गुर्जर", "यादव", "दलित", "हरिजन", "चमार", "बनिया", "क्षत्रिय", "वैश्य", "शूद्र", "कायस्थ", "बुजुर्ग", "मुखिया"].map(normalizeText),
  ].join("|"),
  "gu",
);

/** Names of the deny-list rules the text trips. Empty means clean. */
export function denyHits(text: string): string[] {
  const raw = text.normalize("NFKC");
  const c = canonical(text);
  const hits = DENY.filter(([, re]) => re.test(c)).map(([name]) => name);
  // Upper-case "SIP" is the product. Lower-case "sip" could be a sip of chai.
  if (/(?<![A-Za-z])SIPs?(?![A-Za-z])/.test(raw) || /(?<![A-Za-z])S\.I\.P\.?(?![A-Za-z])/.test(raw)) {
    if (!hits.includes("sip")) hits.push("sip");
  }
  return hits;
}

/** Banned social terms the text contains. */
export function bannedHits(text: string): string[] {
  return [...new Set(normalizeText(text).match(BANNED) ?? [])];
}

export function isUnsafe(text: string): boolean {
  return denyHits(text).length > 0 || bannedHits(text).length > 0;
}

const INSTRUMENT = wordRe(
  `${FUND_KINDS}|mf|sips?|etfs?|shares|stocks?|equity|equities|demat|crypto|bitcoin|fds?|fixed deposit|ppf|nps|elss|ulip|gold bonds?|sgb|share market|stock market|share(?=\\s+(?:market|bazaar|${TRADE_VERB}|price|lu|lun|le|lena))|(?:${BRANDS})(?:\\s+\\p{L}+){0,2}\\s+shares?|${TICKERS}|शेयर|शेयर्स|स्टॉक|एसआईपी|ईटीएफ|एफडी|क्रिप्टो`,
);
const ASK = wordRe(
  `kaunsa|konsa|kaun sa|kon sa|kaunse|konse|kaun se|kaunsi|konsi|which|what (?:fund|stock|share|sip|etf)|best|top|recommend|suggest|advice|advise|name|naam|batao|bata|kisme|kis mein|kis me|kahan|kaha|kidhar|where|lun|loon|lu|le lu|lena|leni|lelu|karu|karun|karoon|kar du|kar dun|${TRADE_VERB}|invest\\p{L}*|lagau|lagaun|daalu|dalu|daal du|dal du|should|chahiye|sahi|accha|achha|good|कौन|कौनसा|कौन सा|बताओ|बताइए|लूं|लेना|करूं|करू|${"खरीद\\p{L}*|बेच\\p{L}*"}|चाहिए|कहां|किसमें|सही`,
);
const SELECT = "kaunsa|konsa|kaun sa|kon sa|kaunse|konse|kaun se|which|what|best|top|recommend|suggest|name|naam|kisme|kis mein|कौन|कौनसा|कौन सा|किसमें";
const GENERIC_FUND = wordRe(`(?:${SELECT})(?:\\s+\\p{L}+){0,3}\\s+(?:funds?|फंड)|(?:funds?|फंड)(?:\\s+\\p{L}+){0,2}\\s+(?:${SELECT}|lun|loon|lu|le lu|kharid\\p{L}*|khareed\\p{L}*|buy)`);
const BRAND_TRADE = wordRe(`(?:${BRANDS})(?:\\s+(?:ke|ka|ki|ko|mein|me|में|के|का))?\\s+(?:${TRADE_VERB})`);
const INVEST_ASK = wordRe("invest\\p{L}*|nivesh|निवेश");
const PARK_MONEY = wordRe("(?:paisa|paise|bonus|savings|पैसा|पैसे|बोनस)(?:\\s+\\p{L}+){0,4}\\s+(?:kahan|kidhar|kisme|where|कहां|किसमें)(?:\\s+\\p{L}+){0,3}\\s+(?:lagau|lagaun|daalu|dalu|daal du|put|invest|लगाऊं|डालूं)|where(?:\\s+\\p{L}+){0,3}\\s+(?:invest|put)");

/** Naming these is enough: nobody logs an everyday expense against them. */
const ALWAYS_ASK = wordRe("nifty|sensex|s&p 500|s and p 500|cryptocurrency|crypto|bitcoin|ethereum|dogecoin|बिटकॉइन|क्रिप्टो|ipo|stock tips?|zerodha|groww|upstox|parag parikh|ppfas|mirae|nippon|axis bluechip|ਮਿਉਚੁਅਲ");
const INDEX_ASK = wordRe("(?:best|which|top|kaunsa|konsa|kaun sa)(?:\\s+\\p{L}+){0,2}\\s+index|index(?:\\s+\\p{L}+){0,2}\\s+(?:kaunsa|konsa|lun|lu|loon|lena)");
/** "Gold chain 20k ka liya" is a purchase. The asking verb is what makes it advice. */
const GOLD_ASK = wordRe("(?:gold|sona|सोना|गोल्ड)(?:\\s+\\p{L}+){0,3}\\s+(?:daalu|dalu|lagau|lagaun|lun|loon|lena hai|kharidu|kharidun|invest\\p{L}*)");
const SCHEME_ASK = wordRe("(?:fds?)\\s+(?:better|best|sahi|kaha|kahan)|(?:kaun si|kaunsi|konsi|which)\\s+scheme|scheme\\s+(?:sahi|better|best)");

function isAsk(clause: string): boolean {
  const c = canonical(clause);
  if (ALWAYS_ASK.test(c) || INDEX_ASK.test(c) || GOLD_ASK.test(c) || SCHEME_ASK.test(c)) return true;
  if (GENERIC_FUND.test(c) || BRAND_TRADE.test(c) || PARK_MONEY.test(c)) return true;
  if (INVEST_ASK.test(c) && ASK.test(c)) return true;
  return INSTRUMENT.test(c) && ASK.test(c);
}

const SELECTING = wordRe(SELECT);
const CLAUSE_SPLIT = /[,;\n।?!]+|\.(?=\s|$)/u;

/** The phrase that asks for a specific security, as the user said it. Null if nothing does. */
export function findSecurityAsk(text: string): string | null {
  const clauses = text.split(CLAUSE_SPLIT).map((c) => c.trim()).filter(Boolean);
  for (const c of clauses) if (isAsk(c)) return c;
  // "mutual fund, kaunsa lun": a selecting word in the next clause. A plain "batao" there is a different question.
  for (let i = 0; i + 1 < clauses.length; i++) {
    if (INSTRUMENT.test(canonical(clauses[i])) && SELECTING.test(canonical(clauses[i + 1]))) return `${clauses[i]}, ${clauses[i + 1]}`;
  }
  return null;
}

/** Refuses a request for a specific security, even inside a longer ramble. The caller adds the modelled scenario. */
export function guardrailCheck(text: string): { refused: boolean; message: string | null } {
  if (findSecurityAsk(text) === null) return { refused: false, message: null };
  return {
    refused: true,
    message: say(speakerLang(text), {
      hi: "किसी share या fund का नाम यहां नहीं मिलेगा। आप अपना assumed rate बताएं, तो savings का scenario model करके दिखा सकते हैं।",
      hinglish: "Kisi share ya fund ka naam yahan nahi milega. Apna assumed rate bolo, toh savings ka scenario model karke dikha sakte hain.",
      en: "This app doesn't name shares or funds. Give an assumed rate and it can model a savings scenario instead.",
    }),
  };
}
