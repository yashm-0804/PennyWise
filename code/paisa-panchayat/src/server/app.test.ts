import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { TCheckedItem } from "@/contract/schemas";
import { undoRulingForEvent } from "@/engine";
import { undoEvent, undoRule } from "@/ledger";
import { seedDemo } from "../../seed";

process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "pp-")), "test.db");
process.env.LLM_MODE = "fake";
const { confirm, db, dictate, fullState, ruling, whatIf } = await import("./app");

const expense = (label: string, rupees: number): TCheckedItem => ({
  type: "expense", source_quote: label, amount_rupees: rupees, amount_text: String(rupees), read_as: null, person: null, payee: label,
  category: "shopping", account: "bank", goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null,
  amount: rupees * 100, status: "ok", messages: [],
});
const goal = (id: string) => fullState().goals.find((g) => g.id === id)!;
const choose = (planId: string) => [{ op: "choose_plan" as const, planId }];

beforeEach(() => seedDemo(db()));

describe("rulings and undo", () => {
  it("B-12: undoing the laptop undoes the whole ruling, and it can be ruled again", async () => {
    const before = fullState();
    const { panchayat } = await confirm("a", [expense("Laptop", 70000)]);
    const applied = await ruling(panchayat!.id, "Plan A", true, choose("A"));
    expect(goal("g-goa").projectedMonth).toBe("2027-06");
    const row = applied.state.rows.find((r) => r.label === "Laptop")!;
    expect(undoRulingForEvent(db(), row.eventId)).toBe(true);
    const after = fullState();
    expect(after.profile.monthSpend).toBe(before.profile.monthSpend);
    expect(after.goals.map((g) => [g.id, g.earmarked, g.projectedMonth])).toEqual(before.goals.map((g) => [g.id, g.earmarked, g.projectedMonth]));
    expect((await ruling(panchayat!.id, "Plan B", true, choose("B"))).applied).toBe(true);
  });

  it("B-14: undoing an EMI ruling restores fixed costs, surplus and the goal's contribution", async () => {
    const before = fullState();
    const { panchayat } = await confirm("a", [expense("Laptop", 70000)]);
    const applied = await ruling(panchayat!.id, "Plan C", true, choose("C"));
    expect(applied.state.profile.fixedCosts).toBeGreaterThan(before.profile.fixedCosts);
    const row = applied.state.rows.find((r) => r.label.includes("Laptop"))!;
    undoRulingForEvent(db(), row.eventId);
    const after = fullState();
    expect(after.profile.fixedCosts).toBe(before.profile.fixedCosts);
    expect(after.profile.monthlySurplus).toBe(before.profile.monthlySurplus);
    expect(goal("g-iphone").projectedMonth).toBe(before.goals.find((g) => g.id === "g-iphone")!.projectedMonth);
    expect(after.emis).toEqual(before.emis);
  });

  it("B-15: two heavy expenses said together both go to the panchayat", async () => {
    const spend = fullState().profile.monthSpend;
    const { panchayat, state } = await confirm("a", [expense("Laptop", 70000), expense("Phone", 90000)]);
    expect(panchayat!.trigger.label).toBe("Laptop + Phone");
    expect(panchayat!.trigger.amount).toBe(16000000);
    expect(state.profile.monthSpend).toBe(spend);
  });

  it("B-16: a second ruling can't take the emergency fund below its floor", async () => {
    const first = await confirm("a", [expense("Laptop", 70000)]);
    const second = await confirm("b", [expense("Phone", 70000)]);
    await ruling(first.panchayat!.id, "Plan B", true, choose("B"));
    await expect(ruling(second.panchayat!.id, "Plan B", true, choose("B"))).rejects.toThrow(/below its floor/);
    expect(goal("g-emergency").earmarked).toBe(17415200);
  });
});

describe("what-ifs move no money", () => {
  it("B-13 and B-17: a ruling on a what-if changes nothing", async () => {
    const before = fullState();
    for (const text of ["what if I cut dining by 30%", "what if I buy a laptop for 70000"]) {
      const said = await dictate(text);
      const p = await whatIf(text, said.utteranceId);
      await ruling(p.id, "Plan A", true, choose("A"));
    }
    const after = fullState();
    expect(after.goals.map((g) => [g.earmarked, g.projectedMonth])).toEqual(before.goals.map((g) => [g.earmarked, g.projectedMonth]));
    expect(after.profile.monthSpend).toBe(before.profile.monthSpend);
  });

  it("B-18: a percent rise pushes goals later, a percent cut brings them earlier", async () => {
    const said = await dictate("what if I cut dining by 30%");
    const cut = await whatIf("cut", said.utteranceId);
    expect(cut.plans[0].impacts[0].deltaMonths).toBeLessThan(0);
    const rising = await dictate("what if dining goes up 20%");
    const up = await whatIf("up", rising.utteranceId);
    expect(up.plans[0].impacts[0].deltaMonths).toBeGreaterThan(0);
  });
});

describe("safety of repeated and odd input", () => {
  it("B-23: confirming the same dictation twice posts once", async () => {
    const said = await dictate("ATM se 10 hazaar nikale, 5 hazaar plumber ko");
    const once = await confirm(said.utteranceId, said.items);
    const twice = await confirm(said.utteranceId, said.items);
    expect(twice.state.rows.length).toBe(once.state.rows.length);
    expect(twice.state.profile.monthSpend).toBe(once.state.profile.monthSpend);
  });

  it("very long dictation is refused quickly with a readable reason", async () => {
    await expect(dictate("1,".repeat(50000))).rejects.toThrow(/too long/);
  });

  it("an empty ruling can't be applied", async () => {
    const { panchayat } = await confirm("a", [expense("Laptop", 70000)]);
    await expect(ruling(panchayat!.id, "", true, [])).rejects.toThrow(/doesn't decide/);
  });

  it("B-19: undoing a rule restores what it changed", async () => {
    const said = await dictate("Rahul ko jo jaata hai woh rent hai");
    const before = fullState().rows.map((r) => [r.eventId, r.category]);
    const { state } = await confirm(said.utteranceId, said.items);
    expect(state.rules).toHaveLength(1);
    undoRule(db(), state.rules[0].id);
    const after = fullState();
    expect(after.rules).toHaveLength(0);
    expect(after.rows.map((r) => [r.eventId, r.category])).toEqual(before);
  });

  it("undoing an ordinary row still works", async () => {
    const said = await dictate("Rohit ko 2000 udhar diye");
    const { state } = await confirm(said.utteranceId, said.items);
    const row = state.rows.find((r) => r.kind === "lend")!;
    expect(undoRulingForEvent(db(), row.eventId)).toBe(false);
    undoEvent(db(), row.eventId);
    expect(fullState().people.find((p) => p.person === "Rohit")?.owesMe ?? 0).toBe(0);
  });
});
