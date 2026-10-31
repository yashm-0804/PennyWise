import { answerMunshi } from "@/insights";
import { db } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    return Response.json(await answerMunshi(db(), String(text ?? "")));
  } catch (err) {
    return fail(err);
  }
}
