import { ConfirmRequest } from "@/contract/schemas";
import { confirm } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { utteranceId, items } = ConfirmRequest.parse(await req.json());
    return Response.json(await confirm(utteranceId, items));
  } catch (err) {
    return fail(err);
  }
}
