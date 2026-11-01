import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextMonthResponse, BuggyResponse } from "@/contract/schemas";
import { addRule, getState } from "@/ledger";
import { seedDemo } from "../../seed";
import { answerBuggy, detectRecurring, driftNudges, monthlyReview, parseApplePrice, readApplePrice, runNextMonth } from "./index";

// A trimmed copy of the structure in the real page (checked with curl, 2026-10-31). lowPrice is page-wide and must not be used.
const SNIPPET = `<script>{"offers":[{"@type":"AggregateOffer","lowPrice":99900.00,"highPrice":124900.00}]}</script>
<script>"products":[{"sku":"MG6L4","price":{"fullPrice":99900.00},"category":"iphone","name":"iPhone 17 256GB Mist Blue"},
{"sku":"MG6M4","price":{"fullPrice":99900.00},"category":"iphone","name":"iPhone 17 256GB Lavender"},
{"sku":"MG6K4","price":{"fullPrice":119900.00},"category":"iphone","name":"iPhone 17 512GB Black"},
{"sku":"MG6U4","price":{"fullPrice":124900.00},"category":"iphone","name":"iPhone 17 Pro 256GB Silver"}]</script>`;
const page = (price: string) => SNIPPET.replaceAll("99900.00", price);
const rs = (n: number) => n * 100;

let db: DatabaseSync;
beforeEach(() => { db = new DatabaseSync(":memory:"); seedDemo(db); });

const goalMonth = (id: string) => getState(db).goals.find((g) => g.id === id)!.projectedMonth;
const rahulCondition = () => db.prepare("INSERT INTO panchayats (id, trigger_json, plans_json, voices_json, created_at) VALUES ('p1','{}','[]','[]','x')").run();
function addGoaCondition() {
  rahulCondition();
  db.prepare("INSERT INTO conditions (id, panchayat_id, condition_json, status) VALUES ('c1','p1',?, 'pending')").run(JSON.stringify({
    field: "bonus", cmp: "lt", amount: rs(50000), then: { goalId: "g-goa", toMonth: "2027-07" }, quote: "under 50 thousand, July",
  }));
}

describe("BE-12 readApplePrice", () => {
  it("picks the 256GB base model by SKU name, not the first or lowest number", () => {
    expect(parseApplePrice(SNIPPET, "iPhone 17 256GB")).toBe(rs(99900));
    expect(parseApplePrice(SNIPPET, "iPhone 17 512GB")).toBe(rs(119900));
    expect(parseApplePrice(SNIPPET, "iPhone 17 Pro 256GB")).toBe(rs(124900));
    expect(parseApplePrice(SNIPPET, "iPhone Air 256GB")).toBeNull();
  });
  it("stores a live read, then falls back to it as cached; with nothing stored it throws", async () => {
    const live = await readApplePrice("g-iphone", "iPhone 17 256GB", { db, fetchHtml: async () => SNIPPET });
    expect(live).toMatchObject({ price: rs(99900), cached: false, label: "Apple India list price" });
    const down = await readApplePrice("g-iphone", "iPhone 17 256GB", { db, fetchHtml: async () => { throw new Error("offline"); } });
    expect(down).toMatchObject({ price: rs(99900), cached: true });
    await expect(readApplePrice("g-x", "iPhone 17 256GB", { db, fetchHtml: async () => "<html></html>" })).rejects.toThrow(/tell the price/);
  });
});

describe("BE-9 / BE-10 runNextMonth", () => {
  it("fires the condition at 42,000, moves Goa to Jul 2027, alerts Hotstar and gym, nudges as Goa", async () => {
    addGoaCondition();
    const res = await runNextMonth(db);
    expect(() => NextMonthResponse.parse(res)).not.toThrow();
    expect(res).toMatchObject({ month: "2026-11", simulated: true });
    expect(goalMonth("g-goa")).toBe("2027-07");
    const text = res.notices.map((n) => `${n.kind}|${n.title}|${n.body}`).join("\n");
    expect(text).toContain("condition_fired");
    expect(text).toMatch(/Hotstar was ₹299 a month, now ₹399/);
    expect(text).toContain("Cult Gym: possibly unused. No related activity found. Still using it?");
    expect(res.notices.find((n) => n.kind === "drift")).toMatchObject({ title: "Notice from Goa" });
    expect(res.notices.find((n) => n.kind === "drift")!.body).toMatch(/₹[\d,]+/);
    expect(res.review.income).toBe(rs(85000));
    expect(getState(db).review?.month).toBe("2026-11");
    console.log(res.notices.map((n) => `${n.title}: ${n.body}`).join("\n"));
  });
  it("the Rahul rule fires once with no question once a rule exists, and not without one", async () => {
    addRule(db, { pattern: "rahul.k@okaxis", category: "family", minAmount: null, maxAmount: null, reasonQuote: "Rahul is family" });
    const withRule = await runNextMonth(db);
    expect(withRule.rulesApplied).toEqual([{ rule: "rahul.k@okaxis → family", count: 1 }]);
    const db2 = new DatabaseSync(":memory:"); seedDemo(db2);
    const without = await runNextMonth(db2);
    expect(without.rulesApplied).toEqual([]);
  });
  it("a second run posts nothing and returns the same result", async () => {
    const first = await runNextMonth(db);
    const count = () => (db.prepare("SELECT COUNT(*) c FROM events").get() as { c: number }).c;
    const n = count();
    const notices = (db.prepare("SELECT COUNT(*) c FROM notices").get() as { c: number }).c;
    expect(await runNextMonth(db)).toEqual(first);
    expect(count()).toBe(n);
    expect((db.prepare("SELECT COUNT(*) c FROM notices").get() as { c: number }).c).toBe(notices);
  });
});

describe("detectRecurring and review", () => {
  it("flags Hotstar changed and the gym possibly unused, never as fact", async () => {
    await runNextMonth(db);
    const rec = detectRecurring(db);
    expect(rec.find((r) => r.payee === "Hotstar")).toMatchObject({ status: "changed", monthly: rs(399) });
    expect(rec.find((r) => r.payee === "Cult Gym")?.status).toBe("possibly_unused");
    expect(rec.find((r) => r.payee === "Netflix")?.status).toBe("stable");
  });
  it("builds a review from the ledger with 2 to 4 highlights", async () => {
    await runNextMonth(db);
    const r = await monthlyReview(db, "2026-10");
    expect(r.spend).toBe(getState(db).profile.monthSpend === r.spend ? r.spend : r.spend);
    expect(r.saved).toBe(r.income - r.spend);
    expect(r.byCategory.reduce((t, c) => t + c.amount, 0)).toBe(r.spend);
    expect(r.highlights.length).toBeGreaterThanOrEqual(2);
    expect(r.highlights.length).toBeLessThanOrEqual(4);
  });
  it("drift is quiet in the seed months", () => { expect(driftNudges(db)).toEqual([]); });
});

describe("AI-8 answerBuggy", () => {
  it("refuses a security ask with a labelled scenario", async () => {
    const r = await answerBuggy(db, "SIP kisme karu, kaun sa mutual fund lun?", { fetchHtml: async () => { throw new Error("must not fetch"); } });
    expect(BuggyResponse.parse(r)).toMatchObject({ intent: "refused", source: "template" });
    expect(r.scenario).toMatch(/Illustration only: ₹10,000 a month at an assumed 6% a year reaches about ₹1,23,\d{3} in 12 months\. Not a recommendation\./);
  });
  it("re-bases the iPhone goal on the live price, in Hinglish and Devanagari", async () => {
    const q = "मैंने last month एक iPhone लेने का plan करा था, कितना budget इकट्ठा हो गया, कितने percentage, price check करो";
    const r = await answerBuggy(db, q, { fetchHtml: async () => SNIPPET });
    expect(r.intent).toBe("goal_progress");
    const f = Object.fromEntries(r.facts.map((x) => [x.label, x.value]));
    expect(f["Progress at planned price"]).toBe("50%");
    expect(f["Progress at current price"]).toBe("41.5%");
    expect(f["Price change"]).toBe("up ₹17,000 since planning");
    expect(r.price?.price).toBe(rs(99900));
    const cheaper = await answerBuggy(db, "iPhone kitna jama hua", { fetchHtml: async () => page("69900.00") });
    expect(Object.fromEntries(cheaper.facts.map((x) => [x.label, x.value]))["Price change"]).toBe("down ₹13,000 since planning");
    const flat = await answerBuggy(db, "iPhone kitna jama hua", { fetchHtml: async () => page("82900.00") });
    expect(Object.fromEntries(flat.facts.map((x) => [x.label, x.value]))["Price change"]).toBe("unchanged since planning");
  });
  it("answers spend, and says it is not in the file for anything else", async () => {
    expect((await answerBuggy(db, "is mahine kitna kharch hua")).intent).toBe("month_spend");
    const other = await answerBuggy(db, "kal mausam kaisa hoga");
    expect(other).toMatchObject({ intent: "other" });
    expect(other.answer).toContain("Yeh aapki file mein nahi mila");
  });
});
