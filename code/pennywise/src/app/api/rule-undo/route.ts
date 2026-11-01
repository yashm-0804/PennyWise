import { undoRule } from "@/ledger";
import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { ruleId } = await req.json();
    undoRule(db(), String(ruleId));
    return Response.json({ state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
