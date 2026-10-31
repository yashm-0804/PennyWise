import type { TRawTxn } from "@/contract/schemas";
import { cleanReference, parseAmountPaise, parseDateIso, parseUpiNarration } from "./util";

/** Statement lines that are neither a transaction nor worth showing the user as a parse failure. */
export const FURNITURE = /\b(?:opening balance|closing balance|brought forward|carried forward|end of (?:synthetic )?statement|synthetic statement|page \d+ of \d+)\b/i;

/** Turns one statement row's text cells into a txn, or null if any cell can't be trusted. Credits become negative. */
export function buildStatementTxn(
  cells: { date: string; narration: string; debit: string; credit: string; reference: string },
  source: "csv" | "pdf",
): TRawTxn | null {
  const date = parseDateIso(cells.date);
  const narration = cells.narration.replace(/\s+/g, " ").trim();
  const debit = cells.debit.trim() ? parseAmountPaise(cells.debit) : 0;
  const credit = cells.credit.trim() ? parseAmountPaise(cells.credit) : 0;
  if (!date || !narration || debit === null || credit === null) return null;
  if ((debit > 0) === (credit > 0)) return null; // neither side, or both: ambiguous
  const upi = parseUpiNarration(narration);
  return {
    date,
    amount: debit > 0 ? debit : -credit,
    narration,
    payee: upi?.name ?? upi?.vpa ?? null,
    vpa: upi?.vpa ?? null,
    reference: cleanReference(cells.reference) ?? upi?.reference ?? null,
    account: "bank",
    source,
  };
}
