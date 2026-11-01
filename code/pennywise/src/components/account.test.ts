import { describe, expect, it } from "vitest";
import { firstName } from "./account";

describe("firstName", () => {
  it("greets by first name", () => {
    expect(firstName("Yash Mehta")).toBe("Yash");
    expect(firstName("  Yash  ")).toBe("Yash");
    expect(firstName("यश मेहता")).toBe("यश");
  });
});
