// Run with: node --env-file=.env.local scripts/smoke-key2.mjs
// Spends one small call on the second key's main model. Never prints a key.
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_2, httpOptions: { retryOptions: { attempts: 1 } } });
const model = process.env.MODEL_MAIN ?? "gemini-2.5-flash";
const start = Date.now();
try {
  const res = await client.interactions.create({
    model,
    input: "Rohit ko 2 hazaar udhar diye. Amount in rupees?",
    response_format: { type: "text", mime_type: "application/json", schema: { type: "object", properties: { amount_rupees: { type: "number" } }, required: ["amount_rupees"] } },
  });
  console.log(model, "ok", `${Date.now() - start}ms`, res.output_text);
} catch (err) {
  console.log(model, "FAILED", String(err?.message ?? err).slice(0, 180).replaceAll(process.env.GEMINI_API_KEY_2, "<key>"));
}
