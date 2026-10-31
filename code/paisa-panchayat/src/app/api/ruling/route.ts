import { RulingRequest } from "@/contract/schemas";
import { ruling } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { panchayatId, text, apply, ops } = RulingRequest.parse(await req.json());
    return Response.json(await ruling(panchayatId, text, apply, ops));
  } catch (err) {
    return fail(err);
  }
}
