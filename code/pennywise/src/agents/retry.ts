import { llmJson, type LlmRequest, type LlmSource } from "@/lib/llm";
import { delimit } from "./text";

/**
 * One call, one retry if the check rejects it. Returns null when the caller should use its template.
 * The retry's input names the reasons, so it also gets a different LLM_CACHE key instead of the same bad answer.
 * If llmJson throws, its whole model chain has already failed, so this doesn't spend more quota retrying.
 */
export async function generateChecked<T>(
  req: LlmRequest<T>,
  check: (data: T) => string[],
): Promise<{ data: T; source: LlmSource } | null> {
  let input = req.input;
  for (let attempt = 0; attempt < 2; attempt++) {
    let result: { data: T; source: LlmSource };
    try {
      result = await llmJson({ ...req, input });
    } catch {
      return null;
    }
    const reasons = check(result.data);
    if (reasons.length === 0) return result;
    input = `${req.input}\n\nYour previous answer was rejected by code. Write a new one that fixes these:\n${delimit("rejection_reasons", reasons.join("\n"))}`;
  }
  return null;
}
