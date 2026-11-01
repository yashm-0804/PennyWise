import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { postImportedTxn } from "@/ledger";
import { seedDemo } from "../../seed";
import { detectRecurring } from "./recurring";

describe("possibly unused", () => {
  it("B-1: a pharmacy bill in the same category doesn't hide an unused gym", () => {
    const db = new DatabaseSync(":memory:");
    seedDemo(db);
    postImportedTxn(db, { date: "2026-10-20", amount: 120000, narration: "Apollo Pharmacy Koramangala", payee: "Apollo Pharmacy", reference: "b1", account: "bank", source: "csv" }, "health");
    expect(detectRecurring(db).find((r) => r.payee.includes("Gym"))?.status).toBe("possibly_unused");
  });

  it("another fitness payment counts as use", () => {
    const db = new DatabaseSync(":memory:");
    seedDemo(db);
    postImportedTxn(db, { date: "2026-10-20", amount: 50000, narration: "Fitness class drop-in", payee: "Fitness Studio", reference: "b2", account: "bank", source: "csv" }, "health");
    expect(detectRecurring(db).find((r) => r.payee.includes("Gym"))?.status).toBe("stable");
  });
});
