import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import type { LedgerModule } from "@/contract/modules";
import { AppState, type TCheckedItem, type TRawTxn } from "@/contract/schemas";
import * as ledger from "./index";
import {
  addRule, applyItem, getState, initSchema, openEmi, postImportedTxn, postSplitExpense, setSimMonth, setWithdrawalTreatment, spendForMonth, undoEvent,
} from "./index";

const contract: LedgerModule = ledger;
const rs = (n: number) => n * 100;
const M = "2026-10";
const D = "2026-10-10";
let db: DatabaseSync;

function item(type: TCheckedItem["type"], rupees: number | null, extra: Partial<TCheckedItem> = {}): TCheckedItem {
  return {
    type, source_quote: "q", amount_rupees: rupees, amount_text: null, read_as: null, person: null, payee: null, category: null, account: null,
    goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rupees == null ? null : rs(rupees), status: "ok", messages: [], ...extra,
  };
}
const put = (type: TCheckedItem["type"], rupees: number, extra: Partial<TCheckedItem> = {}) => applyItem(db, item(type, rupees, extra), "dictation", D);
const txn = (extra: Partial<TRawTxn> = {}): TRawTxn => ({ date: D, amount: rs(2000), narration: "UPI/SHOP", payee: "Shop", reference: null, account: "bank", source: "sms", ...extra });
const incomeOf = () => (db.prepare("SELECT COALESCE(SUM(p.amount), 0) s FROM postings p JOIN accounts a ON a.id = p.account_id WHERE a.kind = 'income'").get() as { s: number }).s;
const person = (name: string) => getState(db).people.find((p) => p.person === name);
function addGoa() {
  db.prepare("INSERT INTO goals (id, name, type, target, monthly_contribution, target_month, created_at) VALUES ('g-goa', 'Goa', 'date', ?, ?, '2027-04', '2026-07-01')").run(rs(40000), rs(5000));
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  initSchema(db);
});

describe("the 11 ledger fixtures", () => {
  it("1: ATM 10,000 then 10,000 cash to a plumber counts once", () => {
    put("withdrawal", 10000);
    put("expense", 10000, { payee: "Plumber", category: "household_help", account: "cash" });
    expect(spendForMonth(db, M)).toBe(rs(10000));
    expect(getState(db).cash.balance).toBe(0);
  });

  it("2: ATM 10,000 with 6,000 logged leaves 4,000 not yet explained, not auto-spent", () => {
    put("withdrawal", 10000);
    put("expense", 6000, { category: "household_help", account: "cash" });
    expect(spendForMonth(db, M)).toBe(rs(6000));
    expect(getState(db).cash).toMatchObject({ balance: rs(4000), unexplained: rs(4000), flag: null });
  });

  it("3: cash spend with no withdrawal goes negative and is flagged", () => {
    put("expense", 1500, { category: "dining", account: "cash" });
    const { cash } = getState(db);
    expect(cash.balance).toBe(-rs(1500));
    expect(cash.unexplained).toBe(0);
    expect(cash.flag).toContain("₹1,500");
  });

  it("4: card purchase and its bill count once", () => {
    put("expense", 5000, { category: "shopping", account: "card" });
    put("card_bill", 5000);
    expect(spendForMonth(db, M)).toBe(rs(5000));
  });

  it("5: lend 2,000, 1,500 repaid: no spend, no income, Rohit owes 500", () => {
    put("lend", 2000, { person: "Rohit" });
    put("repay_in", 1500, { person: "rohit" });
    expect(spendForMonth(db, M)).toBe(0);
    expect(incomeOf()).toBe(0);
    expect(person("Rohit")).toMatchObject({ owesMe: rs(500), iOwe: 0 });
  });

  it("6: borrow 5,000 and repay: no income, no spend, Amit settled", () => {
    put("borrow", 5000, { person: "Amit" });
    expect(person("Amit")?.iOwe).toBe(rs(5000));
    put("repay_out", 5000, { person: "Amit" });
    expect(incomeOf()).toBe(0);
    expect(spendForMonth(db, M)).toBe(0);
    expect(person("Amit")).toMatchObject({ owesMe: 0, iOwe: 0 });
  });

  it("7: dinner 3,000 with friends owing 2,000: spend 1,000, lent 2,000", () => {
    postSplitExpense(db, { total: rs(3000), owed: rs(2000), person: "Friends", category: "dining", label: "Dinner", date: D });
    expect(spendForMonth(db, M)).toBe(rs(1000));
    expect(person("Friends")?.owesMe).toBe(rs(2000));
  });

  it("8: EMI over 12 instalments counts monthly and never the full price", () => {
    openEmi(db, { name: "iPhone", monthly: rs(7000), instalments: 12, principal: rs(84000), date: "2026-10-01" });
    expect(spendForMonth(db, M)).toBe(0);
    expect(getState(db).emis).toEqual([{ name: "iPhone", monthly: rs(7000), instalmentsLeft: 12 }]);
    const months = ["2026-10", "2026-11", "2026-12", ...Array.from({ length: 9 }, (_, i) => `2027-0${i + 1}`)];
    for (const month of months) applyItem(db, item("emi", 7000, { payee: "iPhone" }), "dictation", `${month}-05`);
    for (const month of months) expect(spendForMonth(db, month)).toBe(rs(7000));
    expect(getState(db).emis[0].instalmentsLeft).toBe(0);
  });

  it("9: the same txn in SMS and CSV is one row", () => {
    expect(postImportedTxn(db, txn({ reference: "R1" }), "shopping")).not.toBeNull();
    expect(postImportedTxn(db, txn({ reference: "R1", source: "csv" }), "shopping")).toBeNull();
    expect(postImportedTxn(db, txn({ source: "csv" }), "shopping")).toBeNull();
    expect(spendForMonth(db, M)).toBe(rs(2000));
    expect(getState(db).rows).toHaveLength(1);
  });

  it("9a: an SMS with no reference, then the CSV row with one, is one row", () => {
    expect(postImportedTxn(db, txn(), "shopping")).not.toBeNull();
    expect(postImportedTxn(db, txn({ reference: "R1", source: "csv" }), "shopping")).toBeNull();
    expect(getState(db).rows).toHaveLength(1);
  });

  it("9b: two different references on one day stay two rows", () => {
    postImportedTxn(db, txn({ reference: "R1" }), "shopping");
    expect(postImportedTxn(db, txn({ reference: "R2" }), "shopping")).not.toBeNull();
    expect(spendForMonth(db, M)).toBe(rs(4000));
  });

  it("10: spoken 2,000 and imported 2,000 stay two rows, both flagged", () => {
    put("expense", 2000, { payee: "Shop", category: "shopping" });
    postImportedTxn(db, txn({ date: "2026-10-11", reference: "R1" }), "shopping");
    const { rows } = getState(db);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.flag?.startsWith("Same as this?"))).toBe(true);
    expect(spendForMonth(db, M)).toBe(rs(4000));
  });

  it("11: earmark 5,000 to Goa is no spend", () => {
    addGoa();
    const id = put("earmark", 5000, { goal: "Goa" })!;
    expect(spendForMonth(db, M)).toBe(0);
    expect(getState(db).goals[0].earmarked).toBe(rs(5000));
    undoEvent(db, id);
    expect(getState(db).goals[0].earmarked).toBe(0);
  });
});

describe("undo, overrides, imports and state", () => {
  it("every event's postings sum to zero", () => {
    put("withdrawal", 10000);
    put("expense", 500, { category: "dining", account: "cash" });
    put("lend", 100, { person: "Rohit" });
    const bad = db.prepare("SELECT event_id FROM postings GROUP BY event_id HAVING SUM(amount) != 0").all();
    expect(bad).toEqual([]);
  });

  it("undo is a reversal event, and a second undo does nothing", () => {
    const id = put("expense", 500, { category: "dining" })!;
    undoEvent(db, id);
    undoEvent(db, id);
    expect(spendForMonth(db, M)).toBe(0);
    const reversals = db.prepare("SELECT id FROM events WHERE reversal_of = ?").all(id);
    expect(reversals).toHaveLength(1);
    expect(getState(db).rows[0]).toMatchObject({ reversed: true, countsAsSpend: false });
  });

  it("BE-2: spend treatment counts only cash not yet explained, and can be switched back", () => {
    const id = put("withdrawal", 10000)!;
    put("expense", 6000, { category: "household_help", account: "cash" });
    setWithdrawalTreatment(db, id, "spend");
    setWithdrawalTreatment(db, id, "spend");
    expect(spendForMonth(db, M)).toBe(rs(10000));
    let state = getState(db);
    expect(state.cash).toMatchObject({ balance: 0, unexplained: 0 });
    expect(state.rows.find((r) => r.eventId === id)?.countsAsSpend).toBe(true);
    setWithdrawalTreatment(db, id, "transfer");
    expect(spendForMonth(db, M)).toBe(rs(6000));
    state = getState(db);
    expect(state.cash.unexplained).toBe(rs(4000));
    expect(state.rows.find((r) => r.eventId === id)?.countsAsSpend).toBe(false);
  });

  it("undoing a withdrawal treated as spend removes both", () => {
    const id = put("withdrawal", 10000)!;
    setWithdrawalTreatment(db, id, "spend");
    undoEvent(db, id);
    expect(spendForMonth(db, M)).toBe(0);
    expect(getState(db).cash.balance).toBe(0);
  });

  it("imported ATM, card bill and salary aren't spend", () => {
    postImportedTxn(db, txn({ narration: "ATM WDL HDFC", reference: "A" }), null);
    postImportedTxn(db, txn({ narration: "CC BILL PAYMENT", reference: "B", amount: rs(1000) }), null);
    postImportedTxn(db, txn({ narration: "SALARY CREDIT", reference: "C", amount: -rs(85000) }), null);
    expect(spendForMonth(db, M)).toBe(0);
    expect(getState(db).cash.balance).toBe(rs(2000));
  });

  it("a rule recategorises past rows without changing spend, and counts them", () => {
    put("expense", 5000, { payee: "rahul.k@okaxis", category: "other" });
    const { applied } = addRule(db, { pattern: "RAHUL.K@okaxis", category: "rent", minAmount: rs(4000), maxAmount: rs(7000), reasonQuote: "Rahul ko jo jaata hai woh rent hai" });
    expect(applied).toBe(1);
    expect(spendForMonth(db, M)).toBe(rs(5000));
    const state = getState(db);
    expect(state.rows[0].category).toBe("rent");
    expect(state.rules[0].appliedCount).toBe(1);
  });

  it("imported rows keep their narration and account, money in is income, and rules match narration", () => {
    postImportedTxn(db, txn({ narration: "UPI/rahul.k@okaxis/SENT", payee: "Rahul K", amount: rs(5000), reference: "A", account: "card" }), null);
    postImportedTxn(db, txn({ narration: "SALARY CREDIT", payee: null, amount: -rs(85000), reference: "B" }), null);
    const before = getState(db).rows;
    expect(before.find((r) => r.kind === "income")).toMatchObject({ account: "bank", sourceQuote: "SALARY CREDIT" });
    expect(before.find((r) => r.kind === "expense")).toMatchObject({ account: "card", sourceQuote: "UPI/rahul.k@okaxis/SENT" });
    const { applied } = addRule(db, { pattern: "rahul.k@okaxis", category: "rent", minAmount: null, maxAmount: null, reasonQuote: null });
    expect(applied).toBe(1);
    expect(getState(db).rows.find((r) => r.kind === "expense")?.category).toBe("rent");
  });

  it("moving the clock pays contributions in, so the projected date holds", () => {
    addGoa();
    const before = getState(db).goals[0].projectedMonth;
    setSimMonth(db, "2026-11");
    setSimMonth(db, "2026-11");
    const goa = getState(db).goals[0];
    expect(goa.earmarked).toBe(rs(5000));
    expect(goa.projectedMonth).toBe(before);
  });

  it("goal and profile items apply and undo", () => {
    const goalEvent = applyItem(db, item("goal_create", 20000, { goal: "Bali", month: "2027-10", reason: "Honeymoon" }), "dictation", D)!;
    expect(getState(db).goals[0]).toMatchObject({ name: "Bali", target: rs(20000) });
    undoEvent(db, goalEvent);
    expect(getState(db).goals).toEqual([]);
    const profileEvent = applyItem(db, item("profile_update", 50000, { field: "expected_bonus" }), "dictation", D)!;
    expect(getState(db).profile.expectedBonus).toBe(rs(50000));
    undoEvent(db, profileEvent);
    expect(getState(db).profile.expectedBonus).toBeNull();
  });

  it("getState is a valid AppState, and non-ledger items return null", () => {
    expect(applyItem(db, item("question", null), "dictation")).toBeNull();
    put("expense", 500, { category: "dining" });
    expect(() => AppState.parse(getState(db))).not.toThrow();
    expect(contract.getState).toBe(getState);
  });
});
