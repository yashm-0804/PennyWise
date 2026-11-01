/** Synthetic demo data only: no real person, account or transaction. Reseeding wipes the database first. */
import type { DatabaseSync } from "node:sqlite";
import type { TCheckedItem } from "../src/contract/schemas";
import { addEarmark, addRecurring, applyItem, openEmi, resetDb, setProfileValue } from "../src/ledger";
import { postEvent } from "../src/ledger/post";
import nextMonthJson from "./next-month.json";

export const nextMonth = nextMonthJson;

const rs = (n: number) => n * 100;

export const SEED = {
  monthlyIncome: rs(85000),
  /** Rent 18,000 + Rahul 5,000 + Bike EMI 8,400 + Netflix 649 + Hotstar 299 + gym 1,500. */
  fixedCosts: rs(33848),
  /** Groceries, dining, transport, utilities and small shopping. */
  livingBudget: rs(24000),
  expectedBonus: rs(60000),
  openingBank: rs(480000),
};

const GOALS = [
  { id: "g-emergency", name: "Emergency Fund", type: "emergency", target: rs(348000), earmark: rs(240000), contribution: rs(5000), targetMonth: "2028-08", createdAt: "2026-07-02", reason: "Job gayi toh chhe mahine chalna chahiye", variant: null, priceUrl: null },
  { id: "g-flat", name: "Flat", type: "date", target: rs(400000), earmark: rs(120000), contribution: rs(10000), targetMonth: "2029-02", createdAt: "2026-07-02", reason: "Deposit ke liye, apna ghar chahiye", variant: null, priceUrl: null },
  { id: "g-goa", name: "Goa", type: "date", target: rs(40000), earmark: rs(12000), contribution: rs(5000), targetMonth: "2027-04", createdAt: "2026-07-10", reason: "Doston se aakhri trip ka promise hai", variant: null, priceUrl: null },
  { id: "g-iphone", name: "iPhone 17", type: "commodity", target: rs(82900), earmark: rs(41450), contribution: rs(3000), targetMonth: "2027-08", createdAt: "2026-07-20", reason: "Purana phone mar raha hai", variant: "iPhone 17 256GB", priceUrl: "https://www.apple.com/in/shop/buy-iphone/iphone-17" },
] as const;

function item(type: TCheckedItem["type"], rupees: number, extra: Partial<TCheckedItem> = {}): TCheckedItem {
  return {
    type, source_quote: "", amount_rupees: rupees, amount_text: null, read_as: null, person: null, payee: null, category: null, account: "bank",
    goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rs(rupees), status: "ok", messages: [], ...extra,
  };
}

type Line = [day: number, payee: string, rupees: number, category: NonNullable<TCheckedItem["category"]>, account?: "bank" | "cash" | "card"];

/** The same every month. Rahul stays "other" until the user says what it is, on camera. */
const FIXED: Line[] = [
  [3, "Cult Gym", 1500, "health"],
  [5, "Landlord", 18000, "rent"],
  [7, "rahul.k@okaxis", 5000, "other"],
  [12, "Netflix", 649, "subscriptions"],
  [15, "Hotstar", 299, "subscriptions"],
];

const VARIABLE: Record<string, Line[]> = {
  "2026-08": [
    [2, "DMart", 3180, "groceries"], [16, "Blinkit", 2240, "groceries"], [26, "Blinkit", 2110, "groceries"],
    [4, "Swiggy", 640, "dining"], [9, "Zomato", 1120, "dining"], [17, "Toit", 1850, "dining"], [24, "Swiggy", 590, "dining"],
    [6, "Uber", 780, "transport"], [14, "Indian Oil", 2200, "transport"], [22, "Uber", 460, "transport"],
    [8, "BESCOM", 1860, "utilities"], [10, "Airtel", 999, "utilities"],
    [20, "Decathlon", 2400, "shopping", "card"],
    [11, "Chai and auto", 1200, "transport", "cash"], [18, "Sabzi mandi", 1800, "groceries", "cash"],
  ],
  "2026-09": [
    [1, "DMart", 3420, "groceries"], [13, "Blinkit", 1980, "groceries"], [27, "Blinkit", 2360, "groceries"],
    [5, "Zomato", 980, "dining"], [12, "Swiggy", 720, "dining"], [19, "Truffles", 2340, "dining"], [21, "Zomato", 1310, "dining"],
    [3, "Uber", 620, "transport"], [14, "Indian Oil", 2350, "transport"], [25, "Uber", 910, "transport"],
    [8, "BESCOM", 1740, "utilities"], [10, "Airtel", 999, "utilities"],
    [23, "Myntra", 1650, "shopping"],
  ],
  "2026-10": [
    [2, "DMart", 3050, "groceries"], [14, "Blinkit", 2470, "groceries"], [26, "Blinkit", 1890, "groceries"],
    [4, "Swiggy", 860, "dining"], [10, "Toit", 2150, "dining"], [18, "Zomato", 760, "dining"], [24, "Swiggy", 1030, "dining"],
    [6, "Uber", 540, "transport"], [14, "Indian Oil", 2280, "transport"], [22, "Uber", 690, "transport"],
    [8, "BESCOM", 1910, "utilities"], [10, "Airtel", 999, "utilities"],
    [20, "Amazon", 1290, "shopping"],
  ],
};

function seedMonth(db: DatabaseSync, month: string): void {
  const date = (day: number) => `${month}-${String(day).padStart(2, "0")}`;
  applyItem(db, item("income", 85000, { payee: "Salary, Acme Tech" }), "seed", date(1));
  for (const [day, payee, rupees, category, account] of [...FIXED, ...VARIABLE[month]]) {
    applyItem(db, item("expense", rupees, { payee, category, account: account ?? "bank" }), "seed", date(day));
  }
  // October's Bike EMI is left out on purpose: beat 3 dictates it, and posting it here would count it twice.
  if (month !== "2026-10") applyItem(db, item("emi", 8400, { payee: "Bike EMI", category: "emi" }), "seed", date(25));
  if (month === "2026-08") applyItem(db, item("withdrawal", 3000), "seed", date(10));
  if (month === "2026-09") applyItem(db, item("card_bill", 2400), "seed", date(5));
}

export function seedDemo(db: DatabaseSync): void {
  resetDb(db);
  setProfileValue(db, "data_label", "Synthetic data");
  setProfileValue(db, "monthly_income", String(SEED.monthlyIncome));
  setProfileValue(db, "fixed_costs", String(SEED.fixedCosts));
  setProfileValue(db, "living_budget", String(SEED.livingBudget));
  setProfileValue(db, "expected_bonus", String(SEED.expectedBonus));

  postEvent(db, {
    kind: "opening", date: "2026-07-31", source: "seed", label: "Opening bank balance (synthetic)", amount: SEED.openingBank, account: "bank",
    postings: [["bank", SEED.openingBank], ["opening", -SEED.openingBank]],
  });

  for (const g of GOALS) {
    db.prepare(`INSERT INTO goals (id, name, type, target, monthly_contribution, target_month, reason_quote, variant, price_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(g.id, g.name, g.type, g.target, g.contribution, g.targetMonth, g.reason, g.variant, g.priceUrl, g.createdAt);
    addEarmark(db, g.id, g.earmark, "Saved so far (synthetic)", null, g.createdAt);
  }

  openEmi(db, { name: "Bike EMI", monthly: rs(8400), instalments: 24, paidBefore: 7, principal: rs(201600), date: "2026-01-25", source: "seed" });
  addRecurring(db, { name: "Netflix", kind: "subscription", monthly: rs(649), started: "2026-08" });
  addRecurring(db, { name: "Hotstar", kind: "subscription", monthly: rs(299), started: "2026-08" });
  addRecurring(db, { name: "Cult Gym", kind: "subscription", monthly: rs(1500), started: "2026-08" });

  for (const month of ["2026-08", "2026-09", "2026-10"]) seedMonth(db, month);
}
