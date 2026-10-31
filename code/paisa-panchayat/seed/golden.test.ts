/** BE-6: pins every demo number from the seed. The video script uses what this test prints. */
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { dictateFixture } from "../src/contract/fixtures";
import type { EngineModule, SeedModule } from "../src/contract/modules";
import { AppState, Panchayat, RawTxn, type TPanchayat, type TRulingOp, type TTrigger } from "../src/contract/schemas";
import * as engine from "../src/engine";
import {
  affectedGoals, applyRuling, buildFactSheets, findPrecedent, fireConditions, formatInr, generatePlans, isHeavy, previewRuling, progressPercent,
} from "../src/engine";
import { applyItem, getState, postImportedTxn, savePanchayat, setSimMonth, spendForMonth, undoEvent } from "../src/ledger";
import * as seed from "./index";
import { nextMonth, seedDemo } from "./index";

const engineContract: EngineModule = engine;
const seedContract: SeedModule = seed;
const rs = (n: number) => n * 100;
const trigger: TTrigger = { kind: "expense", label: "Laptop", amount: rs(70000), quote: "Laptop died, new one is 70 thousand, need it this month", hypothetical: true };
const RULING = "Goa moves to June, and if the bonus is under 50 thousand, July";
const OPS: TRulingOp[] = [
  { op: "choose_plan", planId: "A" },
  { op: "move_goal", goalId: "g-goa", toMonth: "2027-06" },
  { op: "add_condition", condition: { field: "bonus", cmp: "lt", amount: rs(50000), then: { goalId: "g-goa", toMonth: "2027-07" }, quote: "if the bonus is under 50 thousand, July" } },
];

let db: DatabaseSync;
const goal = (id: string) => getState(db).goals.find((g) => g.id === id)!;
const dates = () => Object.fromEntries(getState(db).goals.map((g) => [g.id, g.projectedMonth]));

function convene(t: TTrigger = trigger, id = "p1"): TPanchayat {
  const p: TPanchayat = { id, trigger: t, plans: generatePlans(getState(db), t), voices: [], createdAt: "2026-10-28T10:00:00Z" };
  savePanchayat(db, p);
  return p;
}

function importNextMonth(): void {
  for (const raw of nextMonth.txns) postImportedTxn(db, RawTxn.parse(raw), null);
  setSimMonth(db, nextMonth.month);
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  seedDemo(db);
});

describe("seed", () => {
  it("is valid, labelled synthetic, and reseeds to the same numbers", () => {
    const state = getState(db);
    expect(() => AppState.parse(state)).not.toThrow();
    expect(state).toMatchObject({ simMonth: "2026-10", syntheticData: true });
    expect(state.profile).toMatchObject({ monthlyIncome: rs(85000), fixedCosts: rs(33848), emergencyFund: rs(240000), expectedBonus: rs(60000), monthlySurplus: rs(4152) });
    expect(dates()).toEqual({ "g-emergency": "2028-08", "g-flat": "2029-02", "g-goa": "2027-04", "g-iphone": "2027-12" });
    expect(state.cash).toMatchObject({ balance: 0, unexplained: 0 });
    expect(state.profile.monthSpend).toBe(rs(45367));
    expect(state.emis).toEqual([{ name: "Bike EMI", monthly: rs(8400), instalmentsLeft: 15 }]);
    const spend = spendForMonth(db, "2026-10");
    seedDemo(db);
    expect(spendForMonth(db, "2026-10")).toBe(spend);
    expect(getState(db).goals).toHaveLength(4);
  });

  it("has the rows the later beats need", () => {
    const { rows } = getState(db);
    for (const month of ["2026-08", "2026-09", "2026-10"]) {
      const of = (label: string) => rows.filter((r) => r.label === label && r.date.startsWith(month));
      expect(of("rahul.k@okaxis")[0]).toMatchObject({ amount: rs(5000), category: "other" });
      expect(of("Netflix")).toHaveLength(1);
      expect(of("Hotstar")[0].amount).toBe(rs(299));
      expect(of("Cult Gym")).toHaveLength(1);
    }
    const dining = (month: string) => rows.filter((r) => r.category === "dining" && r.date.startsWith(month)).reduce((s, r) => s + r.amount, 0);
    expect(new Set([dining("2026-08"), dining("2026-09"), dining("2026-10")]).size).toBe(3);
    const iphone = goal("g-iphone");
    expect(iphone).toMatchObject({ type: "commodity", variant: "iPhone 17 256GB", target: rs(82900), earmarked: rs(41450), priceUrl: "https://www.apple.com/in/shop/buy-iphone/iphone-17" });
    const created = db.prepare("SELECT created_at c FROM goals WHERE id = 'g-iphone'").get() as { c: string };
    expect(created.c.startsWith("2026-07")).toBe(true);
  });

  it("next-month.json has the November beats", () => {
    const txns = nextMonth.txns.map((t) => RawTxn.parse(t));
    expect(nextMonth.bonus).toBe(rs(42000));
    expect(txns.find((t) => t.payee === "rahul.k@okaxis")?.amount).toBe(rs(5000));
    expect(txns.find((t) => t.payee === "Hotstar")?.amount).toBe(rs(399));
    expect(txns.some((t) => t.payee === "Cult Gym")).toBe(true);
    const dining = ["Swiggy", "Zomato", "Toit", "Truffles"];
    const novDining = txns.filter((t) => dining.includes(t.payee ?? "")).reduce((s, t) => s + t.amount, 0);
    const octDining = getState(db).rows.filter((r) => r.category === "dining" && r.date.startsWith("2026-10")).reduce((s, r) => s + r.amount, 0);
    expect(novDining).toBeGreaterThan(octDining * 2);
    expect(txns.every((t) => t.date.startsWith("2026-11") && t.source === "simulated")).toBe(true);
  });
});

describe("beat 2: the panchayat", () => {
  it("Laptop ₹70,000 is heavy; a ₹5,000 plumber isn't", () => {
    const state = getState(db);
    expect(isHeavy(state, rs(70000))).toBe(true);
    expect(isHeavy(state, rs(5000))).toBe(false);
  });

  it("gives 3 diverse plans, one of which moves Goa to June", () => {
    const plans = generatePlans(getState(db), trigger);
    expect(plans.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(plans.map((p) => p.actions.at(-1)!.kind)).toEqual(["delay_goal", "draw_emergency", "reduce_contribution"]);
    expect(plans[0].impacts.map((i) => [i.goalId, i.afterMonth, i.deltaMonths, i.amountGiven])).toEqual([
      ["g-goa", "2027-06", 2, rs(10000)], ["g-flat", "2029-08", 6, rs(55848)],
    ]);
    expect(plans[1].impacts.map((i) => [i.goalId, i.afterMonth, i.deltaMonths, i.amountGiven])).toEqual([["g-emergency", "2029-09", 13, rs(65848)]]);
    expect(plans[2].impacts.map((i) => [i.goalId, i.afterMonth, i.deltaMonths])).toEqual([["g-iphone", "2028-09", 9]]);
    expect(plans.every((p) => p.assumptions.length > 0)).toBe(true);
    expect(plans[2].assumptions[0]).toContain("14%");
    expect(JSON.stringify(plans)).not.toMatch(/invest/i);
  });

  it("only affected goals speak, at most 3, each seeing only its own numbers", () => {
    const state = getState(db);
    const plans = generatePlans(state, trigger);
    expect(affectedGoals(state, plans)).toEqual(["g-goa", "g-flat", "g-emergency"]);
    const sheets = buildFactSheets(state, trigger, plans, "Earlier ruling");
    expect(sheets).toHaveLength(3);
    const flat = sheets.find((s) => s.goalId === "g-flat")!;
    expect(flat.placeholders).toMatchObject({ flat_delay_months: "6 mahine", plan_a_after_month: "August 2029", precedent_quote: "Earlier ruling" });
    expect(flat.placeholders.reason_quote).toBe(goal("g-flat").reasonQuote);
    expect(flat.plans.filter((p) => p.impact).map((p) => p.planId)).toEqual(["A"]);
    expect(flat.plans.flatMap((p) => (p.impact ? [p.impact.goalId] : []))).toEqual(["g-flat"]);
    expect(JSON.stringify(flat.placeholders)).not.toContain("₹10,000");
    expect(Object.keys(flat.placeholders).some((k) => k.startsWith("goa_") || k.startsWith("emergency_"))).toBe(false);
    expect(sheets.find((s) => s.goalId === "g-emergency")!.placeholders).toMatchObject({ goal_cover_months: "4.1", goal_cover_months_after: "3.0" });
  });

  it("the what-if persists nothing until ruled", () => {
    const before = JSON.stringify(getState(db));
    const p = convene();
    previewRuling(getState(db), p, OPS);
    const after = getState(db);
    expect(JSON.stringify({ ...after, panchayats: [] })).toBe(JSON.stringify({ ...JSON.parse(before), panchayats: [] }));
  });

  it("the ruling posts the expense once, moves the dates, and matches its preview", () => {
    const spend = spendForMonth(db, "2026-10");
    const p = convene();
    expect(spendForMonth(db, "2026-10")).toBe(spend);
    const diff = previewRuling(getState(db), p, OPS);
    expect(diff.map((d) => [d.goalId, d.beforeMonth, d.afterMonth])).toEqual([["g-flat", "2029-02", "2029-08"], ["g-goa", "2027-04", "2027-06"]]);
    const id = applyRuling(db, p, RULING, OPS);
    expect(applyRuling(db, p, RULING, OPS)).toBe(id);
    expect(spendForMonth(db, "2026-10")).toBe(spend + rs(70000));
    expect(dates()).toMatchObject({ "g-goa": "2027-06", "g-flat": "2029-08", "g-emergency": "2028-08", "g-iphone": "2027-12" });
    expect(goal("g-goa")).toMatchObject({ targetMonth: "2027-06", earmarked: rs(2000) });
    expect(goal("g-iphone").earmarked).toBe(rs(41450));
    expect(getState(db).panchayats[0]).toMatchObject({ label: "Laptop ₹70,000", rulingQuote: RULING });
    expect(() => Panchayat.parse(p)).not.toThrow();
  });

  it("Plan B and Plan C rule differently, and an EMI never counts the full price", () => {
    const spend = spendForMonth(db, "2026-10");
    applyRuling(db, convene(trigger, "b"), "Emergency se le lo", [{ op: "choose_plan", planId: "B" }]);
    expect(dates()["g-emergency"]).toBe("2029-09");
    expect(dates()["g-goa"]).toBe("2027-04");
    expect(getState(db).profile.emergencyFund).toBe(rs(174152));

    seedDemo(db);
    applyRuling(db, convene(trigger, "c"), "EMI kar lo", [{ op: "choose_plan", planId: "C" }]);
    const state = getState(db);
    const instalment = state.emis.find((e) => e.name === "Laptop")!;
    expect(instalment).toMatchObject({ monthly: rs(6286), instalmentsLeft: 11 });
    expect(spendForMonth(db, "2026-10")).toBe(spend + instalment.monthly);
    expect(dates()["g-iphone"]).toBe("2028-09");
    expect(state.profile.monthlySurplus).toBe(0);
  });

  it("a later panchayat cites the earlier ruling as precedent", () => {
    expect(findPrecedent(db, trigger)).toBeNull();
    applyRuling(db, convene(), RULING, OPS);
    expect(findPrecedent(db, { ...trigger, label: "Phone repair", amount: rs(30000) })).toBe(RULING);
  });

  it("an unknown plan or goal changes nothing", () => {
    const spend = spendForMonth(db, "2026-10");
    const p = convene();
    expect(() => applyRuling(db, p, "x", [{ op: "choose_plan", planId: "Z" }])).toThrow();
    expect(() => applyRuling(db, p, "x", [{ op: "choose_plan", planId: "A" }, { op: "move_goal", goalId: "g-none", toMonth: "2027-06" }])).toThrow();
    expect(spendForMonth(db, "2026-10")).toBe(spend);
    expect(goal("g-goa").earmarked).toBe(rs(12000));
    expect(getState(db).panchayats[0].rulingQuote).toBeNull();
  });
});

describe("beat 5: the bonus fires the ruling's condition", () => {
  it("₹42,000 moves Goa to July, once, and the date holds after the month turns", () => {
    applyRuling(db, convene(), RULING, OPS);
    importNextMonth();
    expect(dates()["g-goa"]).toBe("2027-06");
    const notices = fireConditions(db, nextMonth.bonus);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({ kind: "condition_fired", goalId: "g-goa" });
    expect(notices[0].body).toBe("Bonus was ₹42,000, under ₹50,000, so Goa moves to July 2027.");
    expect(dates()["g-goa"]).toBe("2027-07");
    expect(fireConditions(db, nextMonth.bonus)).toEqual([]);
    expect(getState(db).notices[0].id).toBe(notices[0].id);
  });

  it("₹60,000 leaves Goa in June and closes the condition", () => {
    applyRuling(db, convene(), RULING, OPS);
    expect(fireConditions(db, null)).toEqual([]);
    expect(fireConditions(db, rs(60000))).toEqual([]);
    expect(fireConditions(db, rs(42000))).toEqual([]);
    expect(dates()["g-goa"]).toBe("2027-06");
  });

  it("re-importing November adds nothing", () => {
    for (const raw of nextMonth.txns) postImportedTxn(db, RawTxn.parse(raw), null);
    const spend = spendForMonth(db, "2026-11");
    for (const raw of nextMonth.txns) expect(postImportedTxn(db, RawTxn.parse(raw), null)).toBeNull();
    expect(spendForMonth(db, "2026-11")).toBe(spend);
    expect(getState(db).emis[0].instalmentsLeft).toBe(14);
  });
});

describe("beat 3: the ATM dictation", () => {
  it("counts ₹10,000 withdrawn once, ₹5,000 spend, Rohit owing ₹2,000, and the EMI on top", () => {
    const [atm, plumber, rohit, emi] = dictateFixture.items;
    const spend = spendForMonth(db, "2026-10");
    const ids = [atm, plumber, rohit].map((i) => applyItem(db, i, "dictation"));
    let state = getState(db);
    expect(spendForMonth(db, "2026-10") - spend).toBe(rs(5000));
    expect(state.rows.filter((r) => r.kind === "withdrawal" && r.source === "dictation").map((r) => [r.amount, r.countsAsSpend])).toEqual([[rs(10000), false]]);
    expect(state.people.find((p) => p.person === "Rohit")).toMatchObject({ owesMe: rs(2000) });
    expect(state.cash).toMatchObject({ balance: rs(3000), unexplained: rs(3000) });

    applyItem(db, emi, "dictation");
    state = getState(db);
    expect(spendForMonth(db, "2026-10") - spend).toBe(rs(13400));
    expect(state.emis[0].instalmentsLeft).toBe(14);

    ids.forEach((id) => undoEvent(db, id!));
    expect(spendForMonth(db, "2026-10") - spend).toBe(rs(8400));
    expect(getState(db).cash.balance).toBe(0);
  });
});

describe("beat 4: the iPhone price", () => {
  it("₹41,450 is 50% of ₹82,900 and 41.5% of ₹99,900", () => {
    const { earmarked, target } = goal("g-iphone");
    expect(formatInr(earmarked)).toBe("₹41,450");
    expect(progressPercent(earmarked, target)).toBe(50);
    expect(progressPercent(earmarked, rs(99900))).toBe(41.5);
  });
});

it("every contract name is exported", () => {
  expect(engineContract.generatePlans).toBe(generatePlans);
  expect(seedContract.seedDemo).toBe(seedDemo);
});
