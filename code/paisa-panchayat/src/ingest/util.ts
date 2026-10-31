/** Shared parsing helpers. Everything here treats its input as untrusted text. */

export const VPA_RE = /[a-z0-9][\w.+-]*@[a-z0-9][\w.-]*/i;
const VPA_ONLY_RE = /^[a-z0-9][\w.+-]*@[a-z0-9][\w.-]*$/i;

/** Rupee text to integer paise, using string arithmetic so 1.15 can't become 114. Null if it isn't a clean amount. */
export function parseAmountPaise(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const s = raw.replace(/₹|\b(?:rs\.?|inr)|\b(?:dr|cr)\b\.?/gi, "").replace(/\s+/g, "");
  if (!/^(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.replace(/,/g, "").split(".");
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, "0") || 0);
  return Number.isSafeInteger(paise) ? paise : null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Indian statement dates to YYYY-MM-DD. Numeric dates are always day first. Null if it isn't a real date. */
export function parseDateIso(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = raw.trim().replace(/[.,;]+$/, "");
  let y: number, m: number, d: number;
  let match: RegExpMatchArray | null;
  if ((match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{4}|\d{2})$/))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})[/\- ]?([a-z]{3,9})[/\-, ]*(\d{4}|\d{2})$/i))) {
    d = Number(match[1]);
    m = MONTHS.indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    y = Number(match[3]);
  } else return null;
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (m < 1 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Placeholders like "-", "N/A" or "000" are not references: treating them as one would collapse unrelated rows. */
export function cleanReference(raw: string | undefined | null): string | null {
  const s = (raw ?? "").trim();
  if (!s || /^(?:n\/?a|nil|none|null)$/i.test(s) || !/[a-z0-9]/i.test(s) || /^0+$/.test(s)) return null;
  return s;
}

/** `UPI/<ref>/<vpa>/<name>`, also accepting `UPI/<ref>/<name>/<vpa>` and a missing name. Null if not a UPI narration. */
export function parseUpiNarration(narration: string): { reference: string | null; vpa: string | null; name: string | null } | null {
  const parts = narration.trim().split("/").map((p) => p.trim());
  if (parts.length < 3 || parts[0].toUpperCase() !== "UPI") return null;
  const rest = parts.slice(2).filter(Boolean);
  const vpaAt = rest.findIndex((p) => VPA_ONLY_RE.test(p));
  const vpa = vpaAt >= 0 ? rest[vpaAt].toLowerCase() : null;
  const name = rest.filter((_, i) => i !== vpaAt).join(" ").trim() || null;
  return { reference: /^\d+$/.test(parts[1]) ? parts[1] : null, vpa, name };
}

/** Best-effort reference from stored text (a narration or an SMS). Used only when comparing with ledger rows. */
export function extractReference(text: string | null | undefined): string | null {
  if (!text) return null;
  const upi = parseUpiNarration(text);
  if (upi?.reference) return upi.reference;
  return text.match(/\b(?:ref(?:erence)?(?:\s*no\.?)?|refno|utr|upi)\b[\s:.#-]*(\d{6,})/i)?.[1] ?? null;
}

/** Case-insensitive literal match that must start at a word start: "rent" doesn't match "Torrent" or "current". */
export function matchesPattern(haystack: string, pattern: string): boolean {
  const h = haystack.toLowerCase();
  const p = pattern.trim().toLowerCase();
  if (!p) return false;
  for (let i = h.indexOf(p); i >= 0; i = h.indexOf(p, i + 1)) {
    if (i === 0 || !/[a-z0-9]/.test(h[i - 1])) return true;
  }
  return false;
}
