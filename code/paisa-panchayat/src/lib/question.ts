/** Hindi and English question words, in Latin and Devanagari. */
const QUESTION = /(?<![\p{L}\p{M}])(?:who|whom|whose|what|which|where|when|why|how|kaun|kaunsa|kaunse|kisko|kise|kis|kisne|kitna|kitne|kitni|kahan|kaha|kab|kya|kyun|kyu|kaise|batao|bata|कौन|किसको|किसे|किस|कितना|कितने|कितनी|कहां|कहाँ|कब|क्या|क्यों|कैसे|बताओ|बता)(?![\p{L}\p{M}])/iu;
const NOT_A_QUESTION = /what\s*if|suppose|maan lo|(?<![\p{L}\p{M}])agar(?![\p{L}\p{M}])|मान लो|अगर/iu;

/** True when the speaker is asking about their money, so it can go straight to Buggy without spending a router call. */
export function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || NOT_A_QUESTION.test(t)) return false;
  return t.endsWith("?") || t.endsWith("।?") || QUESTION.test(t);
}
