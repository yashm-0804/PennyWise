import { runNextMonth } from "@/insights";
import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";

export async function POST() {
  try {
    const result = await runNextMonth(db());
    return Response.json({ ...result, state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
