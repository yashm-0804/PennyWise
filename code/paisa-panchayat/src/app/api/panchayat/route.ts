import { whatIf } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { text, utteranceId } = await req.json();
    return Response.json(await whatIf(String(text ?? ""), utteranceId));
  } catch (err) {
    return fail(err);
  }
}
