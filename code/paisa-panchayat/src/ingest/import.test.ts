import { readFileSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { ImportResponse, type TAppState, type TRawTxn } from "@/contract/schemas";
import { stateFixture } from "@/contract/fixtures";
import { dedupeTxns } from "./dedupe";
import { makeImportTxns } from "./import";

const db = {} as DatabaseSync;

/** MOCK: a small in-memory ledger. `keepQuote: false` imitates a ledger that doesn't keep the narration. */
function fakeLedger(opts: { keepQuote?: boolean; rules?: TAppState["rules"]; declined?: (t: TRawTxn) => boolean } = {}) {
  const posted: { txn: TRawTxn; category: string | null }[] = [];
  const rows: TAppState["rows"] = [];
  return {
    posted, rows,
    postImportedTxn(_db: DatabaseSync, txn: TRawTxn, category: string | null) {
      if (opts.declined?.(txn)) return null;
      posted.push({ txn, category });
      rows.push({
        eventId: `e${rows.length}`, date: txn.date, kind: txn.amount < 0 ? "income" : "expense", label: txn.payee ?? txn.narration,
        amount: Math.abs(txn.amount), account: txn.account, category, source: txn.source as "csv",
        sourceQuote: opts.keepQuote === false ? null : txn.narration, countsAsSpend: txn.amount > 0, reversed: false,
      });
      return `e${rows.length}`;
    },
    getState(): TAppState {
      return { ...stateFixture, rows, rules: opts.rules ?? [], notices: [], review: null };
    },
  };
}
const read = (f: string) => readFileSync(`seed/samples/${f}`, "utf8");
const pdf = () => new Uint8Array(readFileSync("seed/samples/statement.pdf"));
const RAHUL: TAppState["rules"] = [{ id: "r1", pattern: "rahul.k@okaxis", category: "rent", minAmount: 400000, maxAmount: 700000, reasonQuote: "Rahul ko jo jaata hai woh rent hai", appliedCount: 0 }];

describe("importTxns on the samples", () => {
  it("imports SMS, then CSV (one cross-source duplicate), then PDF, matching ImportResponse", async () => {
    const ledger = fakeLedger({ rules: RAHUL });
    const importTxns = makeImportTxns(ledger);
    const sms = ImportResponse.parse(await importTxns(db, "sms", { text: read("sms.txt") }));
    expect([sms.added, sms.duplicates, sms.unparsed.length]).toEqual([5, 0, 5]);
    const csv = ImportResponse.parse(await importTxns(db, "csv", { text: read("statement.csv") }));
    expect([csv.added, csv.duplicates, csv.unparsed.length]).toEqual([13, 1, 0]);
    const statement = ImportResponse.parse(await importTxns(db, "pdf", { bytes: pdf() }));
    expect([statement.added, statement.duplicates, statement.unparsed.length]).toEqual([20, 0, 0]);
    expect(ledger.posted).toHaveLength(38);
  });

  it("categorizes the samples and returns the unexplained rows for review", async () => {
    const ledger = fakeLedger({ rules: RAHUL });
    const importTxns = makeImportTxns(ledger);
    const csv = await importTxns(db, "csv", { text: read("statement.csv") });
    const cat = (ref: string) => ledger.posted.find((p) => p.txn.reference === ref)?.category;
    expect(cat("628100000101")).toBe("rent");
    expect(cat("628100000102")).toBe("rent");
    expect(cat("628100000103")).toBe("dining");
    expect(cat("628100000104")).toBe("subscriptions");
    expect(cat("628100000105")).toBe("transport");
    expect(cat("628100000109")).toBe("subscriptions");
    expect(cat("628100000111")).toBe("dining"); // the model step, through the MOCK
    expect(csv.needsReview.map((t) => t.reference)).toEqual(["99", "628100000108", "628100000110", "628100000112"]);
    expect(ledger.posted.find((p) => p.txn.reference === "99")).toMatchObject({ category: null, txn: { amount: 199900 } });
    expect(cat("NEFT261001001")).toBeNull();
    expect(csv.needsReview.some((t) => t.reference === "NEFT261001001")).toBe(false);
  });

  it("is idempotent: importing a file again adds nothing", async () => {
    const importTxns = makeImportTxns(fakeLedger());
    await importTxns(db, "csv", { text: read("statement.csv") });
    expect(await importTxns(db, "csv", { text: read("statement.csv") })).toMatchObject({ added: 0, duplicates: 14 });
    await importTxns(db, "pdf", { bytes: pdf() });
    expect(await importTxns(db, "pdf", { bytes: pdf() })).toMatchObject({ added: 0, duplicates: 20 });
  });

  it("is still idempotent if the ledger keeps no narration", async () => {
    const importTxns = makeImportTxns(fakeLedger({ keepQuote: false }));
    await importTxns(db, "csv", { text: read("statement.csv") });
    expect(await importTxns(db, "csv", { text: read("statement.csv") })).toMatchObject({ added: 0, duplicates: 14 });
  });

  it("doesn't count a row the ledger declines as added or ask about it", async () => {
    const importTxns = makeImportTxns(fakeLedger({ declined: (t) => t.vpa === "priya.m@oksbi" }));
    const res = await importTxns(db, "csv", { text: read("statement.csv") });
    expect(res.added).toBe(13);
    expect(res.needsReview.some((t) => t.vpa === "priya.m@oksbi")).toBe(false);
  });

  it("reports empty payloads, a bad PDF and a locked PDF without throwing or posting", async () => {
    const ledger = fakeLedger();
    const importTxns = makeImportTxns(ledger);
    for (const res of [
      await importTxns(db, "sms", {}),
      await importTxns(db, "csv", { text: "  " }),
      await importTxns(db, "pdf", {}),
      await importTxns(db, "pdf", { bytes: new TextEncoder().encode("nope") }),
      await importTxns(db, "pdf", { bytes: new Uint8Array(readFileSync("seed/samples/statement-locked.pdf")) }),
    ]) {
      expect(res.added).toBe(0);
      expect(res.unparsed).toHaveLength(1);
    }
    expect(ledger.posted).toEqual([]);
  });
});

describe("dedupe", () => {
  const t = (over: Partial<TRawTxn>): TRawTxn => ({
    date: "2026-10-05", amount: 500000, narration: "x", payee: null, reference: null, account: "bank", source: "csv", ...over,
  });
  const row = (over: Partial<TAppState["rows"][number]>): TAppState["rows"][number] => ({
    eventId: "e", date: "2026-10-05", kind: "expense", label: "x", amount: 500000, account: "bank", category: null,
    source: "sms", sourceQuote: null, countsAsSpend: true, reversed: false, ...over,
  });

  it("keeps two same-day, same-amount payments with different references", () => {
    expect(dedupeTxns([t({ reference: "A" }), t({ reference: "B" })]).unique).toHaveLength(2);
  });
  it("matches on reference across sources even if the dates differ", () => {
    expect(dedupeTxns([t({ reference: "A", source: "csv" }), t({ reference: "a", source: "sms", date: "2026-10-06" })]).duplicates).toBe(1);
  });
  it("keeps a refund that reuses the payment's reference", () => {
    expect(dedupeTxns([t({ reference: "A" }), t({ reference: "A", amount: -500000 })]).unique).toHaveLength(2);
  });
  it("falls back to amount, date and account across sources when a reference is missing", () => {
    expect(dedupeTxns([t({ source: "sms", narration: "a" }), t({ source: "csv", reference: "R", narration: "b" })]).duplicates).toBe(1);
    expect(dedupeTxns([t({ source: "sms" }), t({ source: "csv", account: "card" })]).duplicates).toBe(0);
    expect(dedupeTxns([t({ source: "sms" }), t({ source: "csv", date: "2026-10-06" })]).duplicates).toBe(0);
  });
  it("within one source, needs the narration to match as well when references are missing", () => {
    expect(dedupeTxns([t({ narration: "CHAI A" }), t({ narration: "CHAI B" })]).duplicates).toBe(0);
    expect(dedupeTxns([t({ narration: "CHAI A" }), t({ narration: "CHAI A" })]).duplicates).toBe(1);
  });
  it("reads a ledger row's reference from its quote, for each source's wording", () => {
    for (const sourceQuote of ["UPI/628/rahul@ok/Rahul", "Sent Rs.1 From A To B On 1/1/26 Ref 628000", "Acct X debited with INR 1 on 1-Jan-26; B credited. UPI:628000"]) {
      const reference = sourceQuote.startsWith("UPI") ? "628" : "628000";
      expect(dedupeTxns([t({ reference })], [row({ sourceQuote })]).duplicates).toBe(1);
      expect(dedupeTxns([t({ reference: "999999" })], [row({ sourceQuote })]).unique).toHaveLength(1);
    }
  });
  it("lets one ledger row absorb only one incoming txn when it has no quote", () => {
    expect(dedupeTxns([t({ reference: "A" }), t({ reference: "B" })], [row({})]).unique.map((x) => x.reference)).toEqual(["B"]);
  });
  it("ignores dictated and seed rows, and undone imports", () => {
    expect(dedupeTxns([t({})], [row({ source: "dictation" }), row({ source: "seed" }), row({ reversed: true })]).unique).toHaveLength(1);
  });
  it("tells money in from money out on a ledger row without a reference", () => {
    expect(dedupeTxns([t({ amount: -500000 })], [row({ kind: "expense" })]).unique).toHaveLength(1);
    expect(dedupeTxns([t({ amount: -500000 })], [row({ kind: "income" })]).duplicates).toBe(1);
  });
});
