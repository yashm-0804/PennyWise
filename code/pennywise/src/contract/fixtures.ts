/** MOCK: illustrative responses for every API route, so the UI can be built before the backend. Not demo numbers. */
import type {
  TAppState, TDictateResponse, TImportResponse, TBuggyResponse, TNextMonthResponse, TPanchayat, TRulingResponse,
} from "./schemas";

const rs = (n: number) => n * 100;

const review = {
  month: "2026-10", income: rs(85000), spend: rs(52400), saved: rs(32600),
  byCategory: [{ category: "rent", amount: rs(24000) }, { category: "dining", amount: rs(9200) }, { category: "groceries", amount: rs(7400) }],
  highlights: ["Dining ran above plan", "Hotstar price went up"],
  prose: "October mein khana bahar thoda zyada raha. Goa ka plan track par hai.",
  source: "fake" as const,
};

export const stateFixture: TAppState = {
  simMonth: "2026-10",
  syntheticData: true,
  profile: { monthlyIncome: rs(85000), fixedCosts: rs(38400), emergencyFund: rs(180000), expectedBonus: rs(60000), monthlySurplus: rs(24000), monthSpend: rs(52400) },
  cash: { balance: rs(5000), unexplained: rs(5000) },
  rows: [
    { eventId: "e1", date: "2026-10-28", kind: "withdrawal", label: "ATM withdrawal", amount: rs(10000), account: "bank", category: null, source: "dictation", sourceQuote: "ATM se 10 hazaar nikale", countsAsSpend: false, reversed: false },
    { eventId: "e2", date: "2026-10-28", kind: "expense", label: "Plumber", amount: rs(5000), account: "cash", category: "household_help", source: "dictation", sourceQuote: "5 hazaar plumber ko", countsAsSpend: true, reversed: false },
    { eventId: "e3", date: "2026-10-28", kind: "lend", label: "Lent to Rohit", amount: rs(2000), account: "cash", category: null, source: "dictation", sourceQuote: "Rohit ko 2000 udhar diye", countsAsSpend: false, reversed: false },
    { eventId: "e4", date: "2026-10-05", kind: "expense", label: "Swiggy", amount: rs(640), account: "bank", category: "dining", source: "csv", sourceQuote: null, countsAsSpend: true, reversed: false },
  ],
  people: [{ person: "Rohit", owesMe: rs(2000), iOwe: 0 }, { person: "Amit", owesMe: 0, iOwe: rs(5000) }],
  emis: [{ name: "Bike EMI", monthly: rs(8400), instalmentsLeft: 14 }],
  goals: [
    { id: "g-emergency", name: "Emergency Fund", type: "emergency", target: rs(300000), earmarked: rs(180000), monthlyContribution: rs(6000), targetMonth: "2027-12", projectedMonth: "2028-06", reasonQuote: "Job gayi toh chhe mahine chalna chahiye", priceUrl: null, variant: null },
    { id: "g-flat", name: "Flat", type: "date", target: rs(400000), earmarked: rs(120000), monthlyContribution: rs(10000), targetMonth: "2029-03", projectedMonth: "2029-02", reasonQuote: "Deposit ke liye, apna ghar chahiye", priceUrl: null, variant: null },
    { id: "g-goa", name: "Goa", type: "date", target: rs(40000), earmarked: rs(12000), monthlyContribution: rs(5000), targetMonth: "2027-04", projectedMonth: "2027-04", reasonQuote: "College ke doston ke saath", priceUrl: null, variant: null },
    { id: "g-iphone", name: "iPhone 17", type: "commodity", target: rs(82900), earmarked: rs(41450), monthlyContribution: rs(3000), targetMonth: "2027-08", projectedMonth: "2027-12", reasonQuote: "Purana phone mar raha hai", priceUrl: "https://www.apple.com/in/shop/buy-iphone/iphone-17", variant: "iPhone 17 256GB" },
  ],
  rules: [{ id: "r1", pattern: "rahul.k@okaxis", category: "rent", minAmount: rs(4000), maxAmount: rs(7000), reasonQuote: "Rahul ko jo jaata hai woh rent hai", appliedCount: 7 }],
  notices: [{ id: "n1", kind: "price_change", title: "Hotstar went up", body: "₹299 to ₹399 this month.", goalId: null, createdAt: "2026-10-28T10:00:00Z" }],
  review,
  panchayats: [{ id: "p0", label: "Laptop ₹70,000", rulingQuote: "Goa moves to June", createdAt: "2026-10-28T10:00:00Z" }],
};

export const dictateFixture: TDictateResponse = {
  utteranceId: "u1",
  raw_text: "ATM se 10 hazaar nikale, 5 hazaar plumber ko, Rohit ko 2000 udhar diye, EMI bhi kat gayi 8400",
  route: "entries",
  llm_source: "fake",
  items: [
    { type: "withdrawal", source_quote: "ATM se 10 hazaar nikale", amount_rupees: 10000, amount_text: "10 hazaar", read_as: null, person: null, payee: null, category: null, account: "bank", goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rs(10000), status: "ok", messages: [] },
    { type: "expense", source_quote: "5 hazaar plumber ko", amount_rupees: 5000, amount_text: "5 hazaar", read_as: null, person: null, payee: "Plumber", category: "household_help", account: "cash", goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rs(5000), status: "ok", messages: [] },
    { type: "lend", source_quote: "Rohit ko 2000 udhar diye", amount_rupees: 2000, amount_text: "2000", read_as: null, person: "Rohit", payee: null, category: null, account: "cash", goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rs(2000), status: "ok", messages: [] },
    { type: "emi", source_quote: "EMI bhi kat gayi 8400", amount_rupees: 8400, amount_text: "8400", read_as: null, person: null, payee: "Bike EMI", category: "emi", account: "bank", goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rs(8400), status: "ask", messages: ["Is this the Bike EMI?"] },
  ],
};

export const panchayatFixture: TPanchayat = {
  id: "p1",
  createdAt: "2026-10-31T10:00:00Z",
  trigger: { kind: "expense", label: "Laptop", amount: rs(70000), quote: "Laptop died, new one is 70 thousand", hypothetical: true },
  plans: [
    { id: "A", title: "Delay Goa, trim Flat", actions: [{ kind: "use_surplus", amount: rs(24000) }, { kind: "delay_goal", goalId: "g-goa", toMonth: "2027-06" }], impacts: [{ goalId: "g-goa", goalName: "Goa", beforeMonth: "2027-04", afterMonth: "2027-06", deltaMonths: 2, amountGiven: rs(5000) }, { goalId: "g-flat", goalName: "Flat", beforeMonth: "2029-02", afterMonth: "2029-06", deltaMonths: 4, amountGiven: rs(5000) }], assumptions: [] },
    { id: "B", title: "Draw on Emergency Fund", actions: [{ kind: "draw_emergency", amount: rs(46000) }], impacts: [{ goalId: "g-emergency", goalName: "Emergency Fund", beforeMonth: "2028-06", afterMonth: "2029-02", deltaMonths: 8, amountGiven: rs(46000) }], assumptions: [] },
    { id: "C", title: "EMI over 12 months", actions: [{ kind: "emi", months: 12, annualRatePercent: 14 }], impacts: [{ goalId: "g-iphone", goalName: "iPhone 17", beforeMonth: "2027-12", afterMonth: "2028-05", deltaMonths: 5, amountGiven: rs(3000) }], assumptions: ["Assumes 14% a year; say your actual rate to change this"] },
  ],
  voices: [
    { goalId: "g-emergency", goalName: "Emergency Fund", stances: [{ planId: "B", stance: "oppose" }], line: "2.1 months of cover. Not this month.", source: "fake" },
    { goalId: "g-goa", goalName: "Goa", stances: [{ planId: "A", stance: "concede" }], line: "I'll give up ₹5,000 if Flat does too.", source: "fake" },
    { goalId: "g-flat", goalName: "Flat", stances: [{ planId: "A", stance: "oppose" }], line: "You said “Deposit ke liye”. That costs me 4 months.", source: "fake" },
  ],
};

export const rulingFixture: TRulingResponse = {
  rulingId: "rul1",
  ops: [
    { op: "choose_plan", planId: "A" },
    { op: "move_goal", goalId: "g-goa", toMonth: "2027-06" },
    { op: "add_condition", condition: { field: "bonus", cmp: "lt", amount: rs(50000), then: { goalId: "g-goa", toMonth: "2027-07" }, quote: "if the bonus is under 50 thousand, July" } },
  ],
  questions: [],
  diff: [
    { goalId: "g-goa", goalName: "Goa", beforeMonth: "2027-04", afterMonth: "2027-06" },
    { goalId: "g-flat", goalName: "Flat", beforeMonth: "2029-02", afterMonth: "2029-06" },
  ],
  applied: false,
  precedentCited: null,
};

export const buggyFixture: TBuggyResponse = {
  answer: "₹41,450 jama hai. Planned price par 50%, aaj ki list price par 41.5%.",
  intent: "goal_progress",
  price: { goalId: "g-iphone", variant: "iPhone 17 256GB", price: rs(99900), sourceUrl: "https://www.apple.com/in/shop/buy-iphone/iphone-17", checkedAt: "2026-10-31T10:00:00Z", label: "Apple India list price", cached: false },
  facts: [{ label: "Saved", value: "₹41,450" }, { label: "Against planned ₹82,900", value: "50%" }, { label: "Against ₹99,900 today", value: "41.5%" }],
  scenario: null,
  source: "fake",
};

export const refusalFixture: TBuggyResponse = {
  answer: "Main kisi fund ya share ka naam nahi bata sakta. Savings rate ka scenario dikha sakta hoon.",
  intent: "refused",
  price: null,
  facts: [],
  scenario: "Illustration only: ₹10,000 a month at an assumed 6% a year reaches about ₹1.24 lakh in 12 months. Not a recommendation.",
  source: "template",
};

export const importFixture: TImportResponse = { added: 12, duplicates: 1, unparsed: ["Your OTP is 123456"], needsReview: [] };

export const nextMonthFixture: TNextMonthResponse = {
  month: "2026-11",
  simulated: true,
  rulesApplied: [{ rule: "rahul.k@okaxis → rent", count: 1 }],
  notices: [
    { id: "n2", kind: "price_change", title: "Hotstar went up", body: "₹299 to ₹399.", goalId: null, createdAt: "2026-11-01T10:00:00Z" },
    { id: "n3", kind: "possibly_unused", title: "Gym: possibly unused", body: "No related activity found. Still using it?", goalId: null, createdAt: "2026-11-01T10:00:00Z" },
    { id: "n4", kind: "drift", title: "Notice from Goa", body: "Dining is ₹4,000 over plan. That pushes me back.", goalId: "g-goa", createdAt: "2026-11-01T10:00:00Z" },
    { id: "n5", kind: "condition_fired", title: "Your ruling applied", body: "Bonus was ₹42,000, under ₹50,000, so Goa moves to July.", goalId: "g-goa", createdAt: "2026-11-01T10:00:00Z" },
  ],
  review: { ...review, month: "2026-11" },
};
