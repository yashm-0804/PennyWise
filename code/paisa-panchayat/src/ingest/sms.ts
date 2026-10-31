import type { TRawTxn } from "@/contract/schemas";
import { parseAmountPaise, parseDateIso, VPA_RE } from "./util";

/**
 * Hand-written templates. They were tested only against the synthetic messages in sms.test.ts, which approximate
 * unverified bank layouts. Anything that doesn't match goes to `unparsed`, so nothing is guessed.
 */
const CUR = String.raw`(?:Rs\.?|INR|₹)\s*`;
const AMT = String.raw`([\d,]+(?:\.\d{1,2})?)`;
const DATE = String.raw`(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}[- ]?[A-Za-z]{3}[- ]?\d{2,4})`;

interface Template {
  name: string;
  account: "bank" | "card";
  re: RegExp;
  /** Capture-group positions. */
  groups: { amount: number; date: number; party: number; ref?: number };
}

const TEMPLATES: Template[] = [
  {
    name: "upi-sent",
    account: "bank",
    re: new RegExp(String.raw`^Sent\s+${CUR}${AMT}\s+From\s+.+?\s+To\s+(.+?)\s+On\s+${DATE}[.,]?\s+Ref(?:\s*No\.?)?[:\s]+(\w+)`, "i"),
    groups: { amount: 1, party: 2, date: 3, ref: 4 },
  },
  {
    name: "upi-acct-debited",
    account: "bank",
    re: new RegExp(String.raw`^(?:Acct|A/C)\s+\S+\s+debited\s+(?:with|for)\s+${CUR}${AMT}\s+on\s+${DATE}[;,.]?\s+(.+?)\s+credited[.;,]?\s+UPI[:\s]+(\d+)`, "i"),
    groups: { amount: 1, date: 2, party: 3, ref: 4 },
  },
  {
    name: "upi-dear-user",
    account: "bank",
    re: new RegExp(String.raw`^Dear UPI user,?\s+A/C\s+\S+\s+debited by\s+${AMT}\s+on date\s+${DATE}\s+trf to\s+(.+?)\s+Ref\s*no\.?[:\s]*(\d+)`, "i"),
    groups: { amount: 1, date: 2, party: 3, ref: 4 },
  },
  {
    name: "card-spent-at",
    account: "card",
    re: new RegExp(String.raw`^Spent\s+${CUR}${AMT}\s+on\s+.*?Card\s+\S+\s+at\s+(.+?)\s+on\s+${DATE}`, "i"),
    groups: { amount: 1, party: 2, date: 3 },
  },
  {
    name: "card-amount-spent",
    account: "card",
    re: new RegExp(String.raw`^${CUR}${AMT}\s+spent\s+on\s+.*?Card\s+\S+\s+on\s+${DATE}\s+at\s+(.+?)(?:\.\s|\.?$|\s+Avl\b)`, "i"),
    groups: { amount: 1, date: 2, party: 3 },
  },
];

/** A safety line such as "Never share OTP" appears on real spends, so it mustn't make a message look like an OTP. */
function isOtp(msg: string): boolean {
  const withoutWarnings = msg.replace(/\b(?:never|do not|don'?t|not to)\s+share\s+(?:your\s+)?(?:otp|cvv|pin)\b/gi, "");
  return /\b(?:otp|one[- ]time password|verification code)\b/i.test(withoutWarnings);
}

/** Money that hasn't moved, even if the wording otherwise resembles a debit. */
const NOT_COMPLETED = /\b(?:will be|declined|failed|unsuccessful|reversed|requested|due on)\b/i;

/** Pasted text has one message per line, except that some layouts break before these words. */
function splitMessages(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (out.length && /^(?:from|to|on|ref(?:no)?|not you)\b/i.test(line)) out[out.length - 1] += ` ${line}`;
    else out.push(line);
  }
  return out;
}

function splitParty(party: string): { payee: string | null; vpa: string | null } {
  const cleaned = party.trim().replace(/[.,;]+$/, "");
  const vpa = cleaned.match(VPA_RE)?.[0].toLowerCase() ?? null;
  const name = (vpa ? cleaned.replace(VPA_RE, "") : cleaned).replace(/\bVPA\b/gi, "").replace(/[()]/g, "").replace(/\s+/g, " ").trim();
  return { payee: name || vpa, vpa };
}

export function parseSms(text: string): { txns: TRawTxn[]; unparsed: string[] } {
  const txns: TRawTxn[] = [];
  const unparsed: string[] = [];
  for (const msg of splitMessages(text)) {
    const body = msg.replace(/^[A-Z]{2}-[A-Z0-9]{5,8}(?:-[A-Z])?:\s*/, "");
    const txn = isOtp(body) || NOT_COMPLETED.test(body) ? null : parseOne(body);
    if (txn) txns.push(txn);
    else unparsed.push(msg);
  }
  return { txns, unparsed };
}

function parseOne(body: string): TRawTxn | null {
  for (const t of TEMPLATES) {
    const m = body.match(t.re);
    if (!m) continue;
    const amount = parseAmountPaise(m[t.groups.amount]);
    const date = parseDateIso(m[t.groups.date]);
    if (!amount || !date) return null;
    const { payee, vpa } = splitParty(m[t.groups.party]);
    return {
      date, amount, narration: body, payee, vpa,
      reference: t.groups.ref ? m[t.groups.ref] : null,
      account: t.account, source: "sms",
    };
  }
  return null;
}
