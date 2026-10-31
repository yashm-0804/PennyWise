import { undoRulingForEvent } from "@/engine";
import { undoEvent } from "@/ledger";
import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!undoRulingForEvent(db(), String(eventId))) undoEvent(db(), String(eventId));
    return Response.json({ state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
