# Build report: insights (build/insights)

2026-10-31 · Commit: 32aad1d · Files: code/.worktrees/insights/src/insights/{index,recurring,drift,review,price,munshi,nextMonth}.ts, insights.test.ts

Verified by: `npx vitest run` → 407 passed (11 new in src/insights), `tsc --noEmit` clean for insights. Fake LLM mode only; no real Gemini calls.

## BE-9 runNextMonth · done
- Used: seed/next-month.json, categorize (@/ingest), postImportedTxn, setSimMonth, fireConditions, ruleMatches (@/ledger/post).
- Decisions: labelling order is user rules (code), then the payee's earlier category from the ledger (code), then one categorize batch for the rest. So at most 2 model calls (categorize + review prose). rulesApplied is `"pattern → category"` with a count, and a rule_applied notice is added. Result stored in profile key `next_month_result`; a second call returns it and posts nothing.
- Verified by: tests "fires the condition at 42,000, moves Goa to Jul 2027..." (Goa = 2027-07), "Rahul rule fires once with a rule and not without", "second run posts nothing" (event and notice counts unchanged).

## detectRecurring · done
- Decisions: 3 or more months, one charge per month, earlier amounts equal. "changed" if the latest differs. "possibly_unused" only for gym-like payees with no other spend in that category. Notice wording: "Cult Gym: possibly unused. No related activity found. Still using it?"
- Verified by: Hotstar changed (299 to 399), Cult Gym possibly_unused, Netflix stable.

## BE-10 driftNudges · done
- Decisions: category spend vs average of earlier months; over if above 125% and at least ₹1,000. rent/emi/other/utilities/household_help excluded. The goal "hurt most" is the one where the overspend is the largest share of its remaining gap; title "Notice from <goal>". Body has ₹ figures and the computed slip. Max 2 notices.
- Verified by: nextMonth test: drift title "Notice from Goa"; seed months give none.

## BE-11 monthlyReview · done
- Decisions: income = income-account postings, spend = spendForMonth, byCategory from expense postings (sums to spend), 2 to 4 highlights, prose via writeProse("review"), saved with saveReview. Fallback is Hinglish.
- Verified by: tests on byCategory sum, saved = income - spend, highlight count; getState().review filled.

## BE-12 readApplePrice · done
- Decisions: real HTML inspected with curl. Products look like `{"sku":"MG6L4",...,"price":{"fullPrice":99900.00},"category":"iphone","name":"iPhone 17 256GB Mist Blue"}`. Parse picks by name (exactly the variant, so Pro, Air and 512GB never match) and requires the number to occur in the page. lowPrice is ignored. Fetch is injectable. Signature has an optional third argument `{db, fetchHtml}`; without `db` nothing is stored or cached.
- Verified by: snippet tests: 256GB gives 99900, 512GB 119900, Air null; live read stored, then failure returns cached: true; with none stored it throws "tell the price".

## AI-8 answerMunshi · done
- Decisions: guardrailCheck first; refused gives intent "refused", no model call, scenario "₹10,000 a month at an assumed 6%... about ₹1,23,356". Intents by keyword (goal names plus iPhone/आईफोन aliases, people, kharch/खर्च). iPhone goal is re-based on the live price: 50% at ₹82,900 and 41.5% at ₹99,900, with price up/down/unchanged worded. Fallback is Hinglish. "other" gives "Yeh aapki file mein nahi hai..." with no model call. Signature has optional third arg `{fetchHtml}`.
- Verified by: tests for refusal, Devanagari sentence re-base (down and flat cases), spend, other.

## Integration needed
- API routes: call `readApplePrice(goalId, variant, { db })` (not the 2-arg form) so prices are stored and cached. `answerMunshi(db, text)` and `runNextMonth(db)` need no extras.
- Import from `@/insights`.

## Unverified
- Real Gemini and real Apple fetch in tests (injected). Real-mode call count (at most 2) is by construction, not measured. The drift pick of Goa rests on the fake-mode run; the history-based labelling makes it model-independent.
