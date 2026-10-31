import { describe, expect, it } from "vitest";
import { parseAmount, parseAmounts } from "../numbers";
import { IPHONE_SENTENCE } from "./helpers";

describe("number parser", () => {
  it.each([
    ["8400", 8400], ["₹70,000", 70000], ["1,00,000", 100000], ["Rs. 500", 500], ["500 rupaye", 500],
    ["5k", 5000], ["70K", 70000], ["2L", 200000], ["1.5 lakh", 150000], ["10 hazaar", 10000], ["10 hazar", 10000],
    ["2 lakh", 200000], ["70 thousand", 70000], ["seventy thousand", 70000], ["twenty five thousand", 25000],
    ["paanch hazaar", 5000], ["do hazaar", 2000], ["ek lakh", 100000], ["saath hazaar", 60000], ["do sau pachas", 250],
    ["paanch hazaar paanch sau", 5500], ["2 lakh 50 hazaar", 250000], ["dedh lakh", 150000], ["dhai hazaar", 2500],
    ["saade teen hazaar", 3500], ["sawa lakh", 125000], ["paune do lakh", 175000], ["a lakh", 100000],
    ["पाँच हज़ार", 5000], ["पांच हजार", 5000], ["दस हज़ार", 10000], ["दो लाख", 200000], ["सत्तर हज़ार", 70000],
    ["५०००", 5000], ["१० हज़ार", 10000], ["७०,०००", 70000], ["डेढ़ लाख", 150000],
  ])("%s → %d", (text, rupees) => expect(parseAmount(text)).toBe(rupees));

  it.each([
    "kar do", "ek baat suno", "Rohit ke saath gaya", "tera kya hai", "new one is here", "iPhone 17 chahiye", "T20 dekha",
    "30% kam", "12 mahine", "3 months", "31 October", "256GB", "17th ko", "एक iPhone", "कर दो",
  ])("%s holds no money amount", (text) => expect(parseAmounts(text)).toEqual([]));

  it("reads several amounts and marks bare ones", () => {
    const a = parseAmounts("10 hazaar nikale, 5 plumber ko");
    expect(a.map((x) => [x.value, x.bare, x.unit])).toEqual([[10000, false, 1000], [5, true, null]]);
    expect(parseAmounts("10 hazaar 5 plumber ko").map((x) => x.value)).toEqual([10000, 5]);
    expect(parseAmounts("iPhone 17 70 hazaar ka hai").map((x) => x.value)).toEqual([70000]);
    expect(parseAmounts("Rohit ko 500 rupaye").map((x) => x.bare)).toEqual([false]);
  });

  it("finds no amount in the user's real iPhone sentence", () => {
    expect(parseAmounts(IPHONE_SENTENCE)).toEqual([]);
  });
});
