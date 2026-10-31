import type { TAppState, TRawTxn } from "@/contract/schemas";
import { extractReference } from "./util";

type Row = TAppState["rows"][number];
type Key = Pick<TRawTxn, "amount" | "date" | "account"> & { reference: string | null; source: string; narration: string | null };

const normRef = (r: string) => r.trim().toUpperCase();

/**
 * Same amount is always required, so a refund reusing its payment's reference stays a separate row.
 * Two different references are never the same txn, even on the same day: two ₹5,000 payments to one person are real.
 * Without two references it falls back to amount, date and account. Inside a single source the narration must also
 * match, since that source has already told the two rows apart.
 */
export function isSameTxn(a: Key, b: Key): boolean {
  if (a.amount !== b.amount) return false;
  if (a.reference && b.reference) return normRef(a.reference) === normRef(b.reference);
  if (a.date !== b.date || a.account !== b.account) return false;
  if (a.source === b.source && a.narration !== null && b.narration !== null) return a.narration === b.narration;
  return true;
}

const IMPORTED = new Set(["sms", "csv", "pdf", "simulated"]);

function hasToken(text: string, token: string): boolean {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:$|[^a-z0-9])`, "i").test(text);
}

/**
 * Ledger rows carry no reference field, so it is read from the stored quote. Only imported, live rows count: a
 * dictated entry isn't an import (spoken-vs-import matching is S4), and an undone import may be imported again.
 */
function ledgerKeys(rows: Row[]): (Key & { quote: string })[] {
  return rows
    .filter((r) => IMPORTED.has(r.source) && !r.reversed && !/revers|undo/i.test(r.kind))
    .map((r) => {
      const quote = r.sourceQuote ?? "";
      const moneyIn = r.amount < 0 || /income|credit|repay_in|refund/i.test(r.kind);
      return {
        amount: moneyIn ? -Math.abs(r.amount) : r.amount,
        date: r.date,
        account: (r.account ?? "") as Key["account"],
        reference: extractReference(quote),
        source: r.source,
        narration: r.sourceQuote,
        quote,
      };
    });
}

/**
 * Drops repeats within `txns` and against existing ledger rows. Each ledger row absorbs one incoming txn at most, so
 * if a row lost its reference, a second genuine same-day payment still gets through.
 */
export function dedupeTxns(txns: TRawTxn[], rows: Row[] = []): { unique: TRawTxn[]; duplicates: number } {
  const ledger = ledgerKeys(rows);
  const used = new Set<number>();
  const unique: TRawTxn[] = [];
  for (const t of txns) {
    if (unique.some((u) => isSameTxn(t, u))) continue;
    const hit = ledger.findIndex((row, i) => !used.has(i) && (
      (t.reference && t.amount === row.amount && hasToken(row.quote, t.reference)) || isSameTxn(t, row)
    ));
    if (hit >= 0) used.add(hit);
    else unique.push(t);
  }
  return { unique, duplicates: txns.length - unique.length };
}
