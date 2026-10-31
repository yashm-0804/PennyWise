import { describe, expect, it } from "vitest";
import { guardrailCheck } from "./safety";

describe("stress round guardrail gaps", () => {
  it.each([
    "which is the best index", "best index batao", "index kaunsa lun", "put bonus in Nifty", "Gold mein paisa daalu", "digital gold lena hai kya",
    "बिटकॉइन खरीदूं", "cryptocurrency lun", "dogecoin", "Zerodha pe daal du", "PPFAS flexi cap lun", "Parag Parikh lun", "Nippon lun", "Axis Bluechip",
    "S&P 500 mein daalu", "SBI FD better hai kya", "kaun si scheme sahi hai", "IPO mein apply karu", "stock tip do", "ਮਿਉਚੁਅਲ ਫੰਡ ਕਿਹੜਾ", "Nifty 50 ka kya haal hai",
  ])("refuses %s", (text) => {
    expect(guardrailCheck(text).refused).toBe(true);
  });

  it.each(["Gold chain 20k ka liya", "Swiggy pe 450 gaye", "Goa ke liye 40k chahiye", "Emergency Fund kitna hai"])("doesn't refuse %s", (text) => {
    expect(guardrailCheck(text).refused).toBe(false);
  });
});
