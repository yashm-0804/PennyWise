import { fullState } from "@/server/app";
import { fail } from "@/server/http";

export async function GET() {
  try {
    return Response.json(fullState());
  } catch (err) {
    return fail(err);
  }
}
