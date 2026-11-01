import { db, fullState } from "@/server/app";
import { fail } from "@/server/http";
import { seedDemo } from "../../../../seed";

export async function POST() {
  try {
    seedDemo(db());
    return Response.json({ state: fullState() });
  } catch (err) {
    return fail(err);
  }
}
