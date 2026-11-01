import { describe, expect, it } from "vitest";
import { deltaLabel, inr, inrDigits, month, monthFromIndex, monthIndex, monthsBetween, parseRupees, shortDate } from "./format";

describe("inr", () => {
  it("uses Indian digit grouping from paise", () => {
    expect(inr(12490000)).toBe("₹1,24,900");
    expect(inr(7000000)).toBe("₹70,000");
    expect(inr(1000000000)).toBe("₹1,00,00,000");
    expect(inr(0)).toBe("₹0");
  });
  it("rounds to whole rupees, and a minus for negatives", () => {
    expect(inr(39950)).toBe("₹400");
    expect(inr(-50000)).toBe("−₹500");
    expect(inrDigits(12490000)).toBe("1,24,900");
  });
});

describe("parseRupees", () => {
  it("reads typed amounts into paise", () => {
    expect(parseRupees("1,24,900")).toBe(12490000);
    expect(parseRupees("₹ 5000")).toBe(500000);
    expect(parseRupees("399.5")).toBe(39950);
  });
  it("rejects junk", () => {
    expect(parseRupees("")).toBeNull();
    expect(parseRupees("abc")).toBeNull();
    expect(parseRupees("-5")).toBeNull();
  });
});

describe("months", () => {
  it("formats like Jun 2027", () => {
    expect(month("2027-06")).toBe("Jun 2027");
    expect(month("2027-12")).toBe("Dec 2027");
  });
  it("counts across year ends", () => {
    expect(monthsBetween("2027-11", "2028-02")).toBe(3);
    expect(monthFromIndex(monthIndex("2027-12") + 1)).toBe("2028-01");
  });
  it("labels deltas", () => {
    expect(deltaLabel(2)).toBe("+2 mo");
    expect(deltaLabel(-1)).toBe("−1 mo");
    expect(deltaLabel(0)).toBe("no change");
  });
  it("short dates", () => {
    expect(shortDate("2026-10-08")).toBe("8 Oct");
  });
});
