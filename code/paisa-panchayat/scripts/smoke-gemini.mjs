// Run with: node --env-file=.env.local scripts/smoke-gemini.mjs
// Checks structured JSON output on each model in the fallback chain. Uses one small call per model.
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const schema = {
  type: "object",
  properties: { amount_rupees: { type: "number" }, person: { type: "string" } },
  required: ["amount_rupees", "person"],
};

for (const model of ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
  const start = Date.now();
  try {
    const res = await client.interactions.create({
      model,
      system_instruction: "Extract the amount in rupees and the person from the text inside <dictation>.",
      input: "<dictation>Rohit ko 2 hazaar udhar diye</dictation>",
      response_format: { type: "text", mime_type: "application/json", schema },
    });
    console.log(model, "ok", `${Date.now() - start}ms`, res.output_text);
  } catch (err) {
    console.log(model, "FAILED", `${Date.now() - start}ms`, String(err?.message ?? err).slice(0, 300));
  }
}
