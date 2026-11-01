import { answerBuggy } from "@/insights";
import { db } from "@/server/app";
import { fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    return Response.json(await answerBuggy(db(), String(text ?? "")));
  } catch (err) {
    return fail(err);
  }
}
