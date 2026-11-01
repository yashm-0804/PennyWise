/** Pure month and money helpers. No database access, so the ledger can use them too. */

/** Shown when a goal with money still to find has no contribution at all. */
export const NEVER_MONTH = "2099-12";

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

export function maxMonth(a: string, b: string): string {
  return a >= b ? a : b;
}

/** The date engine: the month the goal is fully funded, from what is earmarked and the monthly contribution. */
export function projectMonth(simMonth: string, target: number, earmarked: number, contribution: number): string {
  const remaining = target - earmarked;
  if (remaining <= 0) return simMonth;
  if (contribution <= 0) return NEVER_MONTH;
  return addMonths(simMonth, Math.ceil(remaining / contribution));
}

/** Percent to one decimal place: 41,450 of 99,900 is 41.5. */
export function progressPercent(earmarked: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round((earmarked / price) * 1000) / 10;
}

/** Paise to rupees with Indian digit grouping: 7000000 is "₹70,000". */
export function formatInr(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const rupees = String(Math.round(Math.abs(paise) / 100));
  const last3 = rupees.slice(-3);
  const rest = rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}₹${rest ? `${rest},` : ""}${last3}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
