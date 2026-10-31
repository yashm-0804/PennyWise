import { describe, expect, it } from "vitest";
import { stateFixture } from "@/contract/fixtures";
import { cashReason, goalReason, leftReason, ringReason, rowReason, spareReason } from "./reasons";

const withProfile = (p: Partial<typeof stateFixture.profile>) => ({ ...stateFixture, profile: { ...stateFixture.profile, ...p } });

describe("reasons", () => {
  it("explains a negative Left with the sum and its biggest cost", () => {
    const state = { ...withProfile({ monthlyIncome: 8500000, monthSpend: 11581700 }), rows: [{ ...stateFixture.rows[1], label: "Laptop", amount: 7000000, date: "2026-10-28", countsAsSpend: true }] };
    const text = leftReason(state);
    expect(text).toContain("₹85,000 income − ₹1,15,817 spent");
    expect(text).toContain("₹30,817 more than came in");
    expect(text).toContain("Laptop, ₹70,000");
    expect(ringReason(state)).toContain("0%");
  });

  it("explains a positive Left without calling it negative", () => {
    expect(leftReason(withProfile({ monthlyIncome: 8500000, monthSpend: 4536700 }))).not.toContain("negative");
  });

  it("explains a negative surplus and negative cash", () => {
    expect(spareReason(withProfile({ monthlySurplus: -100 }))).toContain("negative");
    expect(cashReason({ ...stateFixture, cash: { balance: -50000, unexplained: 0 } })).toContain("Negative");
  });

  it("says why a row does or doesn't count as spending", () => {
    expect(rowReason(stateFixture.rows[0])).toContain("Not spending");
    expect(rowReason(stateFixture.rows[2])).toContain("isn't spending");
    expect(rowReason({ ...stateFixture.rows[1], reversed: true })).toContain("undid");
  });

  it("explains a goal's date", () => {
    expect(goalReason(stateFixture.goals[3])).toContain("₹41,450 saved of ₹82,900");
  });
});
