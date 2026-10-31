const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const grouping = new Intl.NumberFormat("en-IN");

/** Paise to ₹ with Indian digit grouping: 12490000 → ₹1,24,900. Rounded to whole rupees, because paise are unreadable on video. */
export function inr(paise: number): string {
  const abs = Math.abs(paise);
  return `${paise < 0 ? "−" : ""}₹${grouping.format(Math.round(abs / 100))}`;
}

/** Digits only, for the editable amount field: 12490000 → 1,24,900. */
export function inrDigits(paise: number): string {
  return inr(paise).replace(/[₹−]/g, "");
}

/** Reads what someone typed into a rupee field. Returns paise, or null if it isn't a usable amount. */
export function parseRupees(input: string): number | null {
  const clean = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** "2027-06" → "Jun 2027". */
export function month(m: string): string {
  const [y, mm] = m.split("-");
  const name = MONTHS[Number(mm) - 1];
  return name ? `${name} ${y}` : m;
}

export function monthIndex(m: string): number {
  const [y, mm] = m.split("-").map(Number);
  return y * 12 + (mm - 1);
}

export function monthFromIndex(i: number): string {
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): number {
  return monthIndex(to) - monthIndex(from);
}

/** "+2 mo", "−1 mo", or "no change". */
export function deltaLabel(n: number): string {
  if (n === 0) return "no change";
  return `${n > 0 ? "+" : "−"}${Math.abs(n)} mo`;
}

/** "2026-10-28" → "28 Oct". */
export function shortDate(iso: string): string {
  const [, mm, dd] = iso.slice(0, 10).split("-");
  const name = MONTHS[Number(mm) - 1];
  return name && dd ? `${Number(dd)} ${name}` : iso;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** "household_help" → "Household help". */
export function humanize(s: string): string {
  if (s === "emi") return "EMI";
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Shortened link text: "apple.com/in/shop/buy-iphone/iphone-17". */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
