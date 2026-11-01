import { describe, expect, it } from "vitest";
import { dictateFixture, panchayatFixture, rulingFixture, stateFixture } from "@/contract/fixtures";
import { actionLabel, canConfirm, chosenPlanId, editAmount, goalNames, goalRows, newEventIds, opNotes, simulatedMonths, stepForRoute, whoField } from "./flow";

const [ok, , , ask] = dictateFixture.items;
const blocked = { ...ok, status: "block" as const, messages: ["Amount not in what you said"] };

describe("routing", () => {
  it("sends each route where the flow says", () => {
    expect(stepForRoute("entries")).toBe("confirm");
    expect(stepForRoute("panchayat")).toBe("panchayat");
    expect(stepForRoute("buggy")).toBe("buggy");
    expect(stepForRoute("refusal")).toBe("buggy");
    expect(stepForRoute("ruling")).toBe("no-open-panchayat");
  });
});

describe("confirm card", () => {
  it("blocks while a row is blocked, and on an empty card", () => {
    expect(canConfirm([ok, ask])).toBe(true);
    expect(canConfirm([ok, blocked])).toBe(false);
    expect(canConfirm([])).toBe(false);
  });
  it("editing a blocked row downgrades it to ask, and keeps the amount consistent", () => {
    const edited = editAmount(blocked, 500000);
    expect(edited).toMatchObject({ amount: 500000, amount_rupees: 5000, status: "ask" });
    expect(edited.messages).toContain("Changed by you");
    expect(canConfirm([edited])).toBe(true);
    expect(editAmount(ok, 100).status).toBe("ok");
  });
  it("edits the right name field", () => {
    expect(whoField({ ...ok, type: "lend" })).toBe("person");
    expect(whoField({ ...ok, type: "expense" })).toBe("payee");
    expect(whoField({ ...ok, type: "withdrawal" })).toBeNull();
  });
});

describe("panchayat", () => {
  it("has one row per goal touched, in plan order", () => {
    const rows = goalRows(panchayatFixture, []);
    expect(rows.map((r) => r.goalName)).toEqual(["Goa", "Flat", "Emergency Fund", "iPhone 17"]);
    expect(rows[0].beforeMonth).toBe("2027-04");
  });
  it("adds a row when the ruling moves a goal no plan touched", () => {
    const rows = goalRows(panchayatFixture, [{ goalId: "g-new", goalName: "Car", beforeMonth: "2028-01", afterMonth: "2028-03" }]);
    expect(rows.at(-1)?.goalName).toBe("Car");
  });
  it("describes actions and ruling conditions in words, with ₹ and months", () => {
    const names = goalNames(stateFixture);
    expect(actionLabel({ kind: "use_surplus", amount: 2400000 }, names)).toBe("₹24,000 from surplus");
    expect(actionLabel({ kind: "delay_goal", goalId: "g-goa", toMonth: "2027-06" }, names)).toBe("Goa to Jun 2027");
    expect(opNotes(rulingFixture.ops, names)).toEqual(["If bonus under ₹50,000: Goa to Jul 2027"]);
    expect(chosenPlanId(rulingFixture.ops)).toBe("A");
  });
});

describe("state helpers", () => {
  it("finds events a confirm added", () => {
    const after = { ...stateFixture, rows: [...stateFixture.rows, { ...stateFixture.rows[0], eventId: "new1" }] };
    expect(newEventIds(stateFixture, after)).toEqual(["new1"]);
  });
  it("knows which months are simulated", () => {
    expect(simulatedMonths(stateFixture, ["2026-11"]).has("2026-11")).toBe(true);
    expect(simulatedMonths(stateFixture, []).size).toBe(0);
    const row = { ...stateFixture.rows[0], source: "simulated" as const, date: "2026-12-02" };
    expect(simulatedMonths({ ...stateFixture, rows: [row] }, []).has("2026-12")).toBe(true);
  });
});
