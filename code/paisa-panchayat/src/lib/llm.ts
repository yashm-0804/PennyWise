import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export type LlmSource = "gemini" | "cache" | "fake";
export interface LlmRequest<T> {
  role: string;
  /** Instructions. Untrusted text must arrive in `input`, inside delimiters, never here. */
  system: string;
  input: string;
  schema: z.ZodType<T>;
  /** MOCK: the result used in fake mode, so builds don't spend free-tier quota. */
  fake: () => T;
}

/** Survives server restarts, because free-tier quota is too small to re-spend on retakes. */
const CACHE_PATH = "data/llm-cache.json";
function readCache(): Record<string, unknown> {
  return existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
}
function writeCache(key: string, value: unknown) {
  mkdirSync("data", { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify({ ...readCache(), [key]: value }));
}
const chain = () => [...new Set([process.env.MODEL_MAIN ?? "gemini-2.5-flash", "gemini-2.5-flash-lite"])];

/** A key and model pair that hit its daily limit stays skipped until the server restarts, so it doesn't add seconds to every call. */
const g = globalThis as unknown as { __ppSpent?: Set<string> };
const spent = () => (g.__ppSpent ??= new Set());
const ATTEMPT_TIMEOUT_MS = 30_000;
const geminiKeys = () => [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter((k): k is string => Boolean(k));

/** Stronger model first: try it on every key before dropping to the next model. Attempts are named by key number, never by the key. */
export function attemptOrder(keyCount: number, models: string[], isSpent: (id: string) => boolean): { keyIndex: number; model: string; id: string }[] {
  return models.flatMap((model) =>
    Array.from({ length: keyCount }, (_, keyIndex) => ({ keyIndex, model, id: `key${keyIndex + 1}:${model}` }))).filter((a) => !isSpent(a.id));
}

/** Fake unless LLM_MODE=real and a key is present. */
export function isFake(): boolean {
  return process.env.LLM_MODE !== "real" || !process.env.GEMINI_API_KEY;
}

function logCall(role: string, model: string, outcome: string) {
  mkdirSync("data", { recursive: true });
  appendFileSync("data/llm-calls.log", `${new Date().toISOString()} ${role} ${model} ${outcome}\n`);
}

/** Strips JSON Schema keywords the API doesn't need. The result is still validated with zod. */
export function toApiSchema<T>(schema: z.ZodType<T>): unknown {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema, { unrepresentable: "any" }) as Record<string, unknown>;
  return rest;
}

export async function llmJson<T>(req: LlmRequest<T>): Promise<{ data: T; source: LlmSource; model: string }> {
  if (isFake()) return { data: req.schema.parse(req.fake()), source: "fake", model: "fake" };

  const key = createHash("sha256").update(`${req.role}\n${req.system}\n${req.input}`).digest("hex");
  if (process.env.LLM_CACHE === "1") {
    const hit = readCache()[key];
    if (hit !== undefined) {
      logCall(req.role, "cache", "hit");
      return { data: req.schema.parse(hit), source: "cache", model: "cache" };
    }
  }

  const keys = geminiKeys();
  let lastError: unknown;
  for (const { keyIndex, model, id } of attemptOrder(keys.length, chain(), (a) => spent().has(a))) {
    // One attempt each, with SDK retries off: a refusal then costs under a second, not 38. The next key or model takes over.
    const client = new GoogleGenAI({ apiKey: keys[keyIndex] });
    try {
      const interaction = await client.interactions.create({
        model,
        system_instruction: req.system,
        input: req.input,
        response_format: { type: "text", mime_type: "application/json", schema: toApiSchema(req.schema) },
      } as never, { maxRetries: 0, timeout: ATTEMPT_TIMEOUT_MS });
      const text = (interaction as unknown as { output_text: string }).output_text;
      const data = req.schema.parse(JSON.parse(text));
      writeCache(key, data);
      logCall(req.role, id, "ok");
      return { data, source: "gemini", model };
    } catch (err) {
      lastError = err;
      if (/per day/i.test(String(err))) spent().add(id);
      logCall(req.role, id, `error ${String(err).slice(0, 120).replace(/\n/g, " ")}`);
    }
  }
  throw lastError ?? new Error("Every Gemini model has hit its daily limit.");
}
