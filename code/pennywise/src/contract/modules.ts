/**
 * Interfaces between builders. API routes (owned by the main session) call only these.
 * Each builder implements its part in its own directory and exports exactly these names.
 */
import type { DatabaseSync } from "node:sqlite";
import type {
  TAgentReply, TAppState, TCheckedItem, TFactSheet, TGoalDiff, TImportResponse, TMonthlyReview,
  TBuggyResponse, TNextMonthResponse, TNotice, TPanchayat, TPlan, TPriceCheck, TRawTxn, TRouterItem,
  TRulingOp, TRulingParse, TTrigger, TVoice,
} from "./schemas";

/** src/ledger (builder: core). All persistence lives here. */
export interface LedgerModule {
  initSchema(db: DatabaseSync): void;
  /** Posts a confirmed item as balanced postings. Returns the event id, or null for non-ledger items. */
  applyItem(db: DatabaseSync, item: TCheckedItem, source: "dictation" | "seed", date?: string): string | null;
  /** Withdrawal override: treat a withdrawal as spend now instead of a transfer to the cash wallet. */
  setWithdrawalTreatment(db: DatabaseSync, eventId: string, treatment: "transfer" | "spend"): void;
  postImportedTxn(db: DatabaseSync, txn: TRawTxn, category: string | null): string | null;
  undoEvent(db: DatabaseSync, eventId: string): void;
  getState(db: DatabaseSync): TAppState;
  spendForMonth(db: DatabaseSync, month: string): number;
  savePanchayat(db: DatabaseSync, p: TPanchayat): void;
  getPanchayat(db: DatabaseSync, id: string): TPanchayat | null;
  addRule(db: DatabaseSync, rule: { pattern: string; category: string; minAmount: number | null; maxAmount: number | null; reasonQuote: string | null }): { ruleId: string; applied: number };
  addNotice(db: DatabaseSync, n: Omit<TNotice, "id" | "createdAt">): TNotice;
  setSimMonth(db: DatabaseSync, month: string): void;
  logUtterance(db: DatabaseSync, id: string, text: string, parsed: unknown): void;
}

/** src/engine (builder: core). Pure calculation plus applying rulings. */
export interface EngineModule {
  generatePlans(state: TAppState, trigger: TTrigger): TPlan[];
  /** Goals a plan actually hurts, at most 3. Unaffected goals stay silent. */
  affectedGoals(state: TAppState, plans: TPlan[]): string[];
  buildFactSheets(state: TAppState, trigger: TTrigger, plans: TPlan[], precedent: string | null): TFactSheet[];
  previewRuling(state: TAppState, panchayat: TPanchayat, ops: TRulingOp[]): TGoalDiff[];
  applyRuling(db: DatabaseSync, panchayat: TPanchayat, text: string, ops: TRulingOp[]): string;
  /** The most relevant earlier ruling quote, cited as precedent. */
  findPrecedent(db: DatabaseSync, trigger: TTrigger): string | null;
  /** Checks stored ruling conditions against a bonus amount. Returns notices for those that fired. */
  fireConditions(db: DatabaseSync, bonus: number | null): TNotice[];
  /** Whether a confirmed expense is heavy enough to convene the panchayat. */
  isHeavy(state: TAppState, amount: number): boolean;
}

/** src/agents (builder: agents). No database access: everything comes in as arguments. */
export interface AgentsModule {
  routeUtterance(text: string, context: { goals: string[]; people: string[]; simMonth: string }): Promise<{ items: TRouterItem[]; source: "gemini" | "cache" | "fake" | "template" }>;
  checkItems(items: TRouterItem[], text: string, context: { categoryMedians: Record<string, number>; cashBalance: number; people: { person: string; owesMe: number; iOwe: number }[] }): TCheckedItem[];
  runGoalAgents(sheets: TFactSheet[]): Promise<TVoice[]>;
  /** Rejects digits, number words, the investment deny-list and banned social terms. */
  validateLine(line: string, sheet: TFactSheet): { ok: boolean; reasons: string[] };
  fillPlaceholders(reply: TAgentReply, sheet: TFactSheet): string;
  parseRuling(text: string, panchayat: TPanchayat, goals: { id: string; name: string }[]): Promise<TRulingParse>;
  /** Refusal plus a modelled scenario when the text asks for a specific security. */
  guardrailCheck(text: string): { refused: boolean; message: string | null };
  /** Passes generated prose through the same deny-list, retrying once, then uses the fallback. */
  writeProse(role: "review" | "buggy", facts: Record<string, string>, fallback: string): Promise<{ text: string; source: "gemini" | "cache" | "fake" | "template" }>;
}

/** src/ingest (builder: ingest). */
export interface IngestModule {
  parseSms(text: string): { txns: TRawTxn[]; unparsed: string[] };
  parseCsv(text: string): { txns: TRawTxn[]; unparsed: string[] };
  parsePdf(bytes: Uint8Array, password?: string): Promise<{ txns: TRawTxn[]; unparsed: string[] }>;
  /** Rules in code first, then Gemini with the allowed category list. Narrations are untrusted. */
  categorize(txns: TRawTxn[], rules: { pattern: string; category: string; minAmount: number | null; maxAmount: number | null }[]): Promise<{ txn: TRawTxn; category: string | null; ruleId: string | null }[]>;
  importTxns(db: DatabaseSync, kind: "sms" | "csv" | "pdf", payload: { text?: string; bytes?: Uint8Array; password?: string }): Promise<TImportResponse>;
}

/** src/insights (builder: insights). */
export interface InsightsModule {
  detectRecurring(db: DatabaseSync): { payee: string; monthly: number; lastSeen: string; status: "stable" | "changed" | "possibly_unused" }[];
  driftNudges(db: DatabaseSync): TNotice[];
  monthlyReview(db: DatabaseSync, month: string): Promise<TMonthlyReview>;
  /** Simulates the next month from seed/next-month.json: imports it, applies rules, fires alerts and conditions. */
  runNextMonth(db: DatabaseSync): Promise<TNextMonthResponse>;
  readApplePrice(goalId: string, variant: string): Promise<TPriceCheck>;
  answerBuggy(db: DatabaseSync, text: string): Promise<TBuggyResponse>;
}

/** seed/ (builder: core). */
export interface SeedModule {
  seedDemo(db: DatabaseSync): void;
}
