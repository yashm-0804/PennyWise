# Build report: ingest (build/ingest)

2026-10-31 · Commits: 909211f, ab12eea

Tests: `npx vitest run` → 6 files, 94 tests passed. `npx eslint src/ingest` clean. `tsc --noEmit` shows no errors in src/ingest (`src/app/layout.tsx` `LayoutProps` error was already there, outside this section). No real Gemini calls were made.

## BE-7 Ingestion (SMS, CSV, PDF, dedupe, samples) · Status: done, on synthetic data only
- Used: zod, pdfjs-dist 6.4.299 legacy build. Parsers are my own; no GPL or AGPL code was read or copied. pypdf was used once from a scratch venv to encrypt the test PDF; it isn't a project dependency.
- Decisions:
  - **SMS:** 5 anchored templates (3 UPI debit, 2 card spend). Layouts come from the research note's unverified hints. Anything else goes to `unparsed`, including OTPs, promotions, pre-debit notices, declined spends and all credit SMS.
  - **CSV:** own quote-tolerant reader. Unquoted commas in amounts (`1,250.00`, `1,00,000.00`) and narrations are repaired; if the repair doesn't yield clean amounts, the row goes to `unparsed`. Numeric dates are always day first. Amounts use string arithmetic for exact paise.
  - **PDF:** columns come from the header's x-positions, lines from y-grouping, and furniture is filtered out.
  - **Password support is done and tested,** using `seed/samples/statement-locked.pdf`, password `demo1234`. A missing or wrong password, or a non-PDF, returns an `unparsed` message rather than throwing.
  - **Dedupe:** same amount is always required, so a refund reusing a reference stays separate. Two different references are never duplicates, so two same-day ₹5,000 payments both count. Otherwise it falls back to amount, date and account; within one source the narration must match too. Each ledger row absorbs at most one incoming txn. Only live imported rows count, not dictated, seed or undone ones.
  - **Credits** never get a spending category. Those not explained by salary, bonus, interest, refund, reversal or cashback wording go to `needsReview`.
  - A null from `postImportedTxn` counts under `duplicates`, not `added`.
- Known limits:
  - A wrap in the middle of a word in the name part of a narration can't be told from a wrap at a space. On the first render, Chrome's fill wrapping gave "Zo mato". I changed the fixture to allow breaks after `/` (`<wbr>`), so it no longer does this. A real PDF that wraps mid-name would still show the stray space in `payee`.
  - The PDF parser handles this one layout only, and expects right-aligned amounts.
  - Imports aren't wrapped in a transaction. A failure midway leaves earlier rows posted, and re-running is safe because they come back as duplicates.
- Files: `src/ingest/{index,util,sms,csv,rows,pdf,dedupe,import}.ts`, tests `src/ingest/{sms,csv,pdf,import}.test.ts`, `seed/samples/{sms.txt,statement.csv,statement.pdf,statement-locked.pdf,statement.html,make-pdf.mjs}`, `src/contract/schemas.ts` (one line).
- Sample totals with the Rahul rule, importing SMS, then CSV, then PDF: SMS added 5, unparsed 5; CSV added 13, duplicates 1 (ref 628100000106, Rahul ₹5,000, also in the SMS), unparsed 0; PDF added 20, unparsed 0. Total 38 rows. CSV covers 1 to 15 October and PDF 16 to 31 October.
- Verified by: `npx vitest run` → passing. Includes a two-page PDF whose rows reconcile to the statement's own opening and closing balances, re-import idempotence for CSV and PDF, and the locked PDF. A dump of every sample row was checked by eye, which is how the "Zo mato" bug was found.

## BE-8 Categorization · Status: done; model step tested only through the fake
- Used: `llmJson` from `src/lib/llm.ts`, with a labelled `// MOCK` fake.
- Decisions:
  - **Order:** rules, then merchant dictionary, then at most one model batch per `categorize` call, so one per import. No call if nothing is left.
  - **Rules:** case-insensitive literal text (not regex) on payee, VPA or narration, starting at a word start, so "rent" doesn't match "Torrent". Both amount limits are inclusive. First match in array order wins. Blank patterns and categories outside the enum are skipped.
  - **People:** a UPI row with no business word in payee or VPA is treated as a person and never sent to the model, so it stays null. A merchant caught by this gets asked about rather than mislabelled. This also saves quota and keeps names away from the model.
  - **Model output:** enum or null only. Unknown ids and repeat answers are ignored. "other" from the model becomes null. Any model failure leaves the rows null and the import still succeeds.
  - **Injection:** narrations are stripped of control characters and angle brackets, truncated, JSON-encoded and placed inside `<<<ROWS ... ROWS>>>`. Recognised instruction-like text is held back from the model and goes to `needsReview`.
- **Limit on the brief's wording:** "can never change anything but its own category" holds fully for everything except categories of other model-labelled rows. Amount, date and all other fields are never read back from the model, and rule or dictionary rows never reach it. But the model reads one batch together, so an injection my screen doesn't recognise could skew the category of another row in that batch, to an enum value only. One batch per import means this can't be closed without per-row calls. Don't claim more than this on video.
- **Unverified:** the real Gemini path, including whether the nullable enum schema is accepted. `toApiSchema` output was not sent to the API.
- Files: `src/ingest/categorize.ts`, `src/ingest/categorize.test.ts`.
- Verified by: `npx vitest run` → injection row stays null with fields unchanged; other rows are identical with and without it; its text is absent from the model input; delimiter breakout is blocked; a hostile model answer (non-enum, or extra fields) has no effect; ₹300 Rahul doesn't match the rent rule.

## Contract change
- `src/contract/schemas.ts`, `RawTxn`: added `vpa: z.string().nullable().optional()`. The brief asks for the VPA and `RawTxn` had nowhere to carry it, because zod strips unknown keys. It's optional, so existing callers still compile. Merge alongside core's edits.

## Integration needed
- `src/ledger` `postImportedTxn`: **store `txn.narration` as `sourceQuote`.** `KhataRow` has no reference field, so dedupe against the ledger reads the reference from that quote. The contract fixture has an imported row with `sourceQuote: null`. If the ledger does that, matching falls back to amount, date and account, so a later import could drop a genuine same-day, same-amount payment with a different reference (one per stored row).
- `src/ledger` `getState`: a row's `account` must be `"bank"` or `"card"`, and money-in rows need a negative amount or a `kind` containing income, credit, repay_in or refund. Otherwise money-in dedupe can miss.
- `/api/import` route: `import { makeImportTxns } from "@/ingest"`, then `const importTxns = makeImportTxns(ledger)`. Pass PDF bytes as `payload.bytes`.
- `/api/import` and `src/insights` `runNextMonth`: `state.rules` order decides which rule wins, so return it in the order you want. `matchesPattern` is exported so `addRule`'s `applied` count can use the same matching.
- Coach and agents: `needsReview` holds raw narration and payee, including the injection text. Any prompt using them must keep them delimited, as untrusted data.
- Golden test and seed: importing all three samples adds the 38 rows above to spend and income, including ₹85,000 of salary, which may clash with seed figures.

## Blockers
None.

## Suggested items
- Try the model step once with a real key before the takes, using `statement.csv`, which sends exactly one row (Chaayos Cafe).
- Test the SMS templates against real messages if the user is willing to check a few by eye. Coverage of real formats is currently unknown.
