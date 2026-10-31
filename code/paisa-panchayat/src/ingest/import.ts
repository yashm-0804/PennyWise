import type { DatabaseSync } from "node:sqlite";
import type { IngestModule, LedgerModule } from "@/contract/modules";
import type { TImportResponse, TRawTxn } from "@/contract/schemas";
import { categorize } from "./categorize";
import { parseCsv } from "./csv";
import { dedupeTxns } from "./dedupe";
import { parsePdf } from "./pdf";
import { parseSms } from "./sms";

/** Money in that explains itself. Other credits (a person paying back, say) go to the coach to ask about. */
const EXPLAINED_CREDIT = /\b(?:salary|sal|bonus|interest|refund|reversal|cashback)\b/i;

function needsReview(txn: TRawTxn, category: string | null): boolean {
  if (category !== null) return false;
  return txn.amount > 0 || !EXPLAINED_CREDIT.test(txn.narration);
}

async function parse(kind: "sms" | "csv" | "pdf", payload: { text?: string; bytes?: Uint8Array; password?: string }) {
  if (kind === "pdf") {
    if (!payload.bytes?.length) return { txns: [], unparsed: ["No PDF file was provided."] };
    return parsePdf(payload.bytes, payload.password);
  }
  if (!payload.text?.trim()) return { txns: [], unparsed: ["No text was provided."] };
  return kind === "sms" ? parseSms(payload.text) : parseCsv(payload.text);
}

/**
 * Builds `importTxns` around the ledger. Re-running after a mid-import failure is safe, because rows already posted
 * come back as duplicates. A null from postImportedTxn means the ledger declined the row, so it isn't counted as added.
 */
export function makeImportTxns(ledger: Pick<LedgerModule, "postImportedTxn" | "getState">): IngestModule["importTxns"] {
  return async function importTxns(db: DatabaseSync, kind, payload): Promise<TImportResponse> {
    const { txns, unparsed } = await parse(kind, payload);
    const state = ledger.getState(db);
    const { unique, duplicates } = dedupeTxns(txns, state.rows);
    const categorized = await categorize(unique, state.rules);
    let added = 0;
    let declined = 0;
    const review: TRawTxn[] = [];
    for (const { txn, category } of categorized) {
      if (ledger.postImportedTxn(db, txn, category) === null) { declined++; continue; }
      added++;
      if (needsReview(txn, category)) review.push(txn);
    }
    return { added, duplicates: duplicates + declined, unparsed, needsReview: review };
  };
}
