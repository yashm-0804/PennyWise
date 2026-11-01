import type { IngestModule } from "@/contract/modules";
import { categorize } from "./categorize";
import { parseCsv } from "./csv";
import { parsePdf } from "./pdf";
import { parseSms } from "./sms";

export { categorize, parseCsv, parsePdf, parseSms };
export { makeImportTxns } from "./import";
export { dedupeTxns } from "./dedupe";
export { matchesPattern } from "./util";

// Compile-time check that these still match the contract. importTxns comes from makeImportTxns(ledger).
export const ingest: Omit<IngestModule, "importTxns"> = { parseSms, parseCsv, parsePdf, categorize };
