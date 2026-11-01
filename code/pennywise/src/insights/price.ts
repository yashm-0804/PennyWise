import type { DatabaseSync } from "node:sqlite";
import type { TPriceCheck } from "@/contract/schemas";

export const APPLE_URL = "https://www.apple.com/in/shop/buy-iphone/iphone-17";
const LABEL = "Apple India list price";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type FetchHtml = (url: string) => Promise<string>;
export const defaultFetch: FetchHtml = async (url) => {
  const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en-IN" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Apple page returned ${res.status}`);
  return res.text();
};

/**
 * The page holds product objects like {"sku":"MG6L4",...,"price":{"fullPrice":99900.00},"category":"iphone","name":"iPhone 17 256GB Mist Blue"}.
 * Pick by name (model plus capacity, so Pro, Air and 512GB never match), and require the number to occur literally in the page.
 * Returns paise, or null when no unambiguous price is found.
 */
export function parseApplePrice(html: string, variant: string): number | null {
  const want = variant.trim().replace(/\s+/g, " ").toLowerCase();
  const re = /"price":\{"fullPrice":(\d+(?:\.\d+)?)\}[^{}]*?"name":"([^"]+)"/g;
  const counts = new Map<string, number>();
  for (const m of html.matchAll(re)) {
    const name = m[2].toLowerCase();
    if (name === want || name.startsWith(`${want} `)) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  if (counts.size !== 1) return null; // none, or colours disagree
  const [literal] = [...counts.keys()];
  if (!html.includes(literal)) return null;
  const rupees = Number(literal);
  return Number.isFinite(rupees) && rupees > 0 ? Math.round(rupees * 100) : null;
}

export interface PriceOpts { db?: DatabaseSync; fetchHtml?: FetchHtml; now?: () => Date }

/** Live price, stored; on any failure the last stored value with cached: true; with none, a clear error. */
export async function readApplePrice(goalId: string, variant: string, opts: PriceOpts = {}): Promise<TPriceCheck> {
  const { db, fetchHtml = defaultFetch, now = () => new Date() } = opts;
  try {
    const price = parseApplePrice(await fetchHtml(APPLE_URL), variant);
    if (price == null) throw new Error(`No price for ${variant} found on the page`);
    const checkedAt = now().toISOString();
    db?.prepare("INSERT INTO price_checks (goal_id, variant, price, source_url, label, checked_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(goalId, variant, price, APPLE_URL, LABEL, checkedAt);
    return { goalId, variant, price, sourceUrl: APPLE_URL, checkedAt, label: LABEL, cached: false };
  } catch (err) {
    const last = db?.prepare("SELECT * FROM price_checks WHERE goal_id = ? AND variant = ? ORDER BY id DESC LIMIT 1").get(goalId, variant) as
      { price: number; source_url: string; label: string; checked_at: string } | undefined;
    if (last) return { goalId, variant, price: last.price, sourceUrl: last.source_url, checkedAt: last.checked_at, label: last.label, cached: true };
    throw new Error(`Could not read the ${variant} price and none is stored. Ask the user to tell the price. (${String(err).slice(0, 100)})`);
  }
}
