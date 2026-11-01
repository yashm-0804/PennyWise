import { describe, expect, it } from "vitest";
import { looksLikeQuestion } from "./question";

describe("looksLikeQuestion", () => {
  it.each([
    "Whom have I lent money to", "where did I spend most this month", "how much EMI do I have to pay", "Maine kisko udhar diya hai",
    "Is mahine sabse zyada kahan kharch hua", "Mera EMI kitna hai", "मैंने किसको पैसे दिए", "Am I okay?",
  ])("asks: %s", (t) => expect(looksLikeQuestion(t)).toBe(true));

  it.each([
    "What if I cut dining by 30%?", "Agar laptop 70 hazaar ka liya toh", "Rohit ko 2000 udhar diye", "Swiggy pe 450 gaye",
    "Rahul ko jo jaata hai woh rent hai", "Goa moves to June, and if the bonus is under 50 thousand, July", "",
  ])("states: %s", (t) => expect(looksLikeQuestion(t)).toBe(false));
});
