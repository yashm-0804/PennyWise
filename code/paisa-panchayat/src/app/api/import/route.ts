import { ImportRequest } from "@/contract/schemas";
import { makeImportTxns } from "@/ingest";
import { getState, postImportedTxn } from "@/ledger";
import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";

const importTxns = makeImportTxns({ postImportedTxn, getState });

export async function POST(req: Request) {
  try {
    const { kind, text, base64, password } = ImportRequest.parse(await req.json());
    const bytes = base64 ? new Uint8Array(Buffer.from(base64, "base64")) : undefined;
    const result = await importTxns(db(), kind, { text, bytes, password });
    return Response.json({ ...result, state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
