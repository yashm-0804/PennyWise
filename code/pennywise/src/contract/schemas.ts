import { z } from "zod";

/** Money is integer paise everywhere except Router output, which is rupees as spoken. Months are "YYYY-MM". */
export const Paise = z.number().int();
export const Month = z.string().regex(/^\d{4}-\d{2}$/);
export const CATEGORIES = [
  "rent", "groceries", "dining", "transport", "utilities", "shopping", "entertainment",
  "subscriptions", "health", "education", "travel", "family", "household_help", "emi", "other",
] as const;
export const Category = z.enum(CATEGORIES);
export const Account = z.enum(["bank", "cash", "card"]);

/** Router output: one flat item per fact in the dictation. Rupees as a number, plus the words it came from. */
export const ITEM_TYPES = [
  "expense", "income", "withdrawal", "lend", "borrow", "repay_in", "repay_out", "emi", "card_bill",
  "goal_create", "goal_update", "earmark", "profile_update", "correction", "whatif", "ruling",
  "question", "investment_ask", "unknown",
] as const;
export const RouterItem = z.object({
  type: z.enum(ITEM_TYPES),
  source_quote: z.string().describe("The exact phrase from the dictation this item came from"),
  amount_rupees: z.number().nullable().describe("Amount in rupees, null if none was said"),
  amount_text: z.string().nullable().describe("The words or digits the amount came from"),
  read_as: z.string().nullable().describe("A repaired word or unit, such as 'hired → hiked' or '5 → ₹5,000'"),
  person: z.string().nullable(),
  payee: z.string().nullable(),
  category: Category.nullable(),
  account: Account.nullable(),
  goal: z.string().nullable(),
  month: z.string().nullable().describe("YYYY-MM if a date was said"),
  reason: z.string().nullable().describe("Why, in the speaker's words"),
  field: z.enum(["monthly_income", "fixed_costs", "emergency_fund", "expected_bonus"]).nullable(),
  pattern: z.string().nullable().describe("For correction: payee text to match"),
  question_intent: z.enum(["goal_progress", "person_balance", "month_spend", "other"]).nullable(),
});
export const RouterResult = z.object({ items: z.array(RouterItem) });

export const CheckStatus = z.enum(["ok", "ask", "block"]);
export const CheckedItem = RouterItem.extend({
  amount: Paise.nullable(),
  status: CheckStatus,
  messages: z.array(z.string()),
});
export const Route = z.enum(["entries", "panchayat", "ruling", "buggy", "refusal"]);
export const DictateResponse = z.object({
  utteranceId: z.string(),
  raw_text: z.string(),
  route: Route,
  items: z.array(CheckedItem),
  llm_source: z.enum(["gemini", "cache", "fake", "template"]),
});

export const ConfirmRequest = z.object({ utteranceId: z.string(), items: z.array(CheckedItem) });

/** Closed list of plan actions. There is no invest action, by design. */
export const PlanAction = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("use_surplus"), amount: Paise }),
  z.object({ kind: z.literal("draw_emergency"), amount: Paise }),
  z.object({ kind: z.literal("delay_goal"), goalId: z.string(), toMonth: Month }),
  z.object({ kind: z.literal("reduce_contribution"), goalId: z.string(), amount: Paise, months: z.number().int() }),
  z.object({ kind: z.literal("reduce_budget"), category: Category, percent: z.number(), months: z.number().int() }),
  z.object({ kind: z.literal("defer_expense"), toMonth: Month }),
  z.object({ kind: z.literal("emi"), months: z.number().int(), annualRatePercent: z.number() }),
]);
export const GoalImpact = z.object({
  goalId: z.string(),
  goalName: z.string(),
  beforeMonth: Month,
  afterMonth: Month,
  deltaMonths: z.number().int(),
  amountGiven: Paise,
});
export const Plan = z.object({
  id: z.string(),
  title: z.string(),
  actions: z.array(PlanAction),
  impacts: z.array(GoalImpact),
  assumptions: z.array(z.string()),
});
export const Trigger = z.object({
  kind: z.enum(["expense", "whatif"]),
  label: z.string(),
  amount: Paise,
  quote: z.string(),
  hypothetical: z.boolean(),
});
/** What one goal agent is allowed to know. Numbers reach prose only through placeholders. */
export const FactSheet = z.object({
  goalId: z.string(),
  goalName: z.string(),
  trigger: Trigger,
  plans: z.array(z.object({ planId: z.string(), title: z.string(), impact: GoalImpact.nullable() })),
  placeholders: z.record(z.string(), z.string()).describe("name → display value, filled in by code"),
  reasonQuote: z.string().nullable(),
  precedentQuote: z.string().nullable(),
});
export const AgentReply = z.object({
  stances: z.array(z.object({ planId: z.string(), stance: z.enum(["defend", "concede", "oppose"]) })),
  line: z.string().describe("Under 14 words, plain Hinglish, uses only {placeholders} for numbers and quotes"),
});
export const Voice = z.object({
  goalId: z.string(),
  goalName: z.string(),
  stances: AgentReply.shape.stances,
  line: z.string(),
  source: z.enum(["gemini", "cache", "fake", "template"]),
});
export const Panchayat = z.object({
  id: z.string(),
  trigger: Trigger,
  plans: z.array(Plan),
  voices: z.array(Voice),
  createdAt: z.string(),
});

/** Closed list of ruling operations. */
export const Condition = z.object({
  field: z.literal("bonus"),
  cmp: z.enum(["lt", "gte"]),
  amount: Paise,
  then: z.object({ goalId: z.string(), toMonth: Month }),
  quote: z.string(),
});
export const RulingOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("choose_plan"), planId: z.string() }),
  z.object({ op: z.literal("move_goal"), goalId: z.string(), toMonth: Month }),
  z.object({ op: z.literal("hold_goal"), goalId: z.string(), until: z.string() }),
  z.object({ op: z.literal("add_condition"), condition: Condition }),
]);
export const RulingParse = z.object({
  ops: z.array(RulingOp),
  questions: z.array(z.string()).describe("Asked when the ruling is ambiguous"),
});
export const GoalDiff = z.object({
  goalId: z.string(),
  goalName: z.string(),
  beforeMonth: Month,
  afterMonth: Month,
});
export const RulingRequest = z.object({
  panchayatId: z.string(),
  text: z.string(),
  apply: z.boolean().default(false),
  ops: z.array(RulingOp).optional(),
});
export const RulingResponse = z.object({
  rulingId: z.string().nullable(),
  ops: z.array(RulingOp),
  questions: z.array(z.string()),
  diff: z.array(GoalDiff),
  applied: z.boolean(),
  precedentCited: z.string().nullable(),
});

export const PriceCheck = z.object({
  goalId: z.string(),
  variant: z.string(),
  price: Paise,
  sourceUrl: z.string(),
  checkedAt: z.string(),
  label: z.string().describe("Such as 'Apple India list price'"),
  cached: z.boolean(),
});
export const GoalView = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["commodity", "date", "budget", "emergency"]),
  target: Paise,
  earmarked: Paise,
  monthlyContribution: Paise,
  targetMonth: Month,
  projectedMonth: Month,
  reasonQuote: z.string().nullable(),
  priceUrl: z.string().nullable(),
  variant: z.string().nullable(),
  price: PriceCheck.nullable().optional(),
});
export const LedgerRow = z.object({
  eventId: z.string(),
  date: z.string(),
  kind: z.string(),
  label: z.string(),
  amount: Paise,
  account: z.string().nullable(),
  category: z.string().nullable(),
  source: z.enum(["dictation", "sms", "csv", "pdf", "seed", "simulated"]),
  sourceQuote: z.string().nullable(),
  countsAsSpend: z.boolean(),
  reversed: z.boolean(),
  flag: z.string().nullable().optional().describe("Such as a 'same as this?' candidate: a spoken row that looks like an imported one"),
});
export const PersonBalance = z.object({ person: z.string(), owesMe: Paise, iOwe: Paise });
export const RuleView = z.object({
  id: z.string(),
  pattern: z.string(),
  category: Category,
  minAmount: Paise.nullable(),
  maxAmount: Paise.nullable(),
  reasonQuote: z.string().nullable(),
  appliedCount: z.number().int(),
});
export const Notice = z.object({
  id: z.string(),
  kind: z.enum(["price_change", "possibly_unused", "drift", "condition_fired", "rule_applied", "heavy_expense"]),
  title: z.string(),
  body: z.string(),
  goalId: z.string().nullable(),
  createdAt: z.string(),
  simulated: z.boolean().optional(),
});
export const MonthlyReview = z.object({
  month: Month,
  income: Paise,
  spend: Paise,
  saved: Paise,
  byCategory: z.array(z.object({ category: z.string(), amount: Paise })),
  highlights: z.array(z.string()),
  prose: z.string(),
  source: z.enum(["gemini", "cache", "fake", "template"]),
});
export const AppState = z.object({
  simMonth: Month,
  syntheticData: z.literal(true),
  profile: z.object({
    monthlyIncome: Paise,
    fixedCosts: Paise,
    emergencyFund: Paise,
    expectedBonus: Paise.nullable(),
    monthlySurplus: Paise,
    monthSpend: Paise,
    livingBudget: Paise.optional(),
    goalContributions: Paise.optional(),
  }),
  cash: z.object({ balance: Paise, unexplained: Paise, flag: z.string().nullable().optional().describe("Set when the wallet is negative") }),
  rows: z.array(LedgerRow),
  people: z.array(PersonBalance),
  emis: z.array(z.object({ name: z.string(), monthly: Paise, instalmentsLeft: z.number().int() })),
  goals: z.array(GoalView),
  rules: z.array(RuleView),
  notices: z.array(Notice),
  review: MonthlyReview.nullable(),
  panchayats: z.array(z.object({ id: z.string(), label: z.string(), rulingQuote: z.string().nullable(), createdAt: z.string() })),
});

export const BuggyRequest = z.object({ text: z.string() });
export const BuggyResponse = z.object({
  answer: z.string(),
  intent: z.enum(["goal_progress", "person_balance", "month_spend", "other", "refused"]),
  price: PriceCheck.nullable(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  scenario: z.string().nullable().describe("Modelled instead of naming a security"),
  source: z.enum(["gemini", "cache", "fake", "template"]),
});
export const ImportRequest = z.object({
  kind: z.enum(["sms", "csv", "pdf"]),
  text: z.string().optional(),
  base64: z.string().optional(),
  password: z.string().optional(),
});
export const RawTxn = z.object({
  date: z.string(),
  amount: Paise.describe("Positive = money out, negative = money in"),
  narration: z.string(),
  payee: z.string().nullable(),
  reference: z.string().nullable(),
  vpa: z.string().nullable().optional().describe("UPI id when the source shows one"),
  account: Account,
  source: z.enum(["sms", "csv", "pdf", "simulated"]),
});
export const ImportResponse = z.object({
  added: z.number().int(),
  duplicates: z.number().int(),
  unparsed: z.array(z.string()),
  needsReview: z.array(RawTxn),
});
export const NextMonthResponse = z.object({
  month: Month,
  simulated: z.literal(true),
  rulesApplied: z.array(z.object({ rule: z.string(), count: z.number().int() })),
  notices: z.array(Notice),
  review: MonthlyReview,
});

export type TRouterItem = z.infer<typeof RouterItem>;
export type TCheckedItem = z.infer<typeof CheckedItem>;
export type TDictateResponse = z.infer<typeof DictateResponse>;
export type TPlan = z.infer<typeof Plan>;
export type TPlanAction = z.infer<typeof PlanAction>;
export type TTrigger = z.infer<typeof Trigger>;
export type TFactSheet = z.infer<typeof FactSheet>;
export type TAgentReply = z.infer<typeof AgentReply>;
export type TVoice = z.infer<typeof Voice>;
export type TPanchayat = z.infer<typeof Panchayat>;
export type TRulingOp = z.infer<typeof RulingOp>;
export type TRulingParse = z.infer<typeof RulingParse>;
export type TRulingResponse = z.infer<typeof RulingResponse>;
export type TGoalDiff = z.infer<typeof GoalDiff>;
export type TGoalView = z.infer<typeof GoalView>;
export type TAppState = z.infer<typeof AppState>;
export type TNotice = z.infer<typeof Notice>;
export type TMonthlyReview = z.infer<typeof MonthlyReview>;
export type TPriceCheck = z.infer<typeof PriceCheck>;
export type TBuggyResponse = z.infer<typeof BuggyResponse>;
export type TRawTxn = z.infer<typeof RawTxn>;
export type TImportResponse = z.infer<typeof ImportResponse>;
export type TNextMonthResponse = z.infer<typeof NextMonthResponse>;
