import { setWithdrawalTreatment } from "@/ledger";
import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { eventId, treatment } = await req.json();
    setWithdrawalTreatment(db(), String(eventId), treatment === "spend" ? "spend" : "transfer");
    return Response.json({ state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
