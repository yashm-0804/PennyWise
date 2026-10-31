# Build report: core (build/core)

2026-10-31 16:12 · Commits: 969714a, bba1fe6

All items below are verified by one run: `npx vitest run` → 3 files, 48 tests passed. That covers `src/ledger/ledger.test.ts`, `seed/golden.test.ts` and the existing contract test. No real Gemini calls. `npx eslint src/ledger src/engine seed` is clean. `npx tsc --noEmit` reports only `src/app/layout.tsx(20,50) LayoutProps`, which isn't in my files (it is a type `next` generates).

## Pinned demo numbers (asserted in seed/golden.test.ts)

**Seed:** income ₹85,000 · fixed costs ₹33,848 · monthly surplus ₹4,152 · emergency fund ₹2,40,000 · expected bonus ₹60,000 · simMonth 2026-10 · spend Aug ₹57,277, Sep ₹55,227, Oct ₹45,367 (Oct has no Bike EMI until beat 3 dictates it; Aug and Sep are from a one-off printout, not asserted).

| Goal | Target | Earmarked | Contribution | Projected |
|---|---|---|---|---|
| Emergency Fund | ₹3,48,000 | ₹2,40,000 | ₹5,000 | Aug 2028 |
| Flat | ₹4,00,000 | ₹1,20,000 | ₹10,000 | Feb 2029 |
| Goa | ₹40,000 | ₹12,000 | ₹5,000 | Apr 2027 |
| iPhone 17 | ₹82,900 | ₹41,450 | ₹3,000 | Dec 2027 |

**Beat 2, Laptop ₹70,000:** heavy. Three plans, and the voices are Goa, Flat and Emergency Fund (iPhone 17 is hurt by Plan C but stays silent because of the cap of 3).

| Plan | Title | Effect |
|---|---|---|
| A | Surplus, then Goa and Flat give way | Goa Apr 2027 → Jun 2027 (+2, gives ₹10,000); Flat Feb 2029 → Aug 2029 (+6, gives ₹55,848) |
| B | Surplus, then draw on Emergency Fund | Aug 2028 → Sep 2029 (+13, gives ₹65,848); fund ₹1,74,152; cover 4.1 → 3.0 months; floor ₹1,73,544 |
| C | EMI over 12 months | ₹6,286 a month at an assumed 14%; iPhone 17 Dec 2027 → Sep 2028 (+9, gives ₹25,608) |

**The script should say that Flat also moves 6 months.** The ruling "Goa moves to June" with Plan A also shows Flat moving to Aug 2029 in the diff. After the ruling, Oct spend is ₹1,15,367 and Goa's earmark is ₹2,000. iPhone stays ₹41,450.

**Beat 3, ATM dictation:** ₹10,000 withdrawn counts once, ₹5,000 spend, Rohit owes ₹2,000, cash wallet and "not yet explained" both ₹3,000. EMI ₹8,400 takes the total added to ₹13,400, and Bike EMI goes from 15 to 14 instalments left.

**Beat 4:** ₹41,450 is 50% of ₹82,900 and 41.5% of ₹99,900. **This holds only until "Import next month".** The month turning pays contributions in, so iPhone then shows ₹44,450. Keep beat 4 before beat 5, as the storyline has it.

**Beat 5:** a ₹42,000 bonus gives the notice "Bonus was ₹42,000, under ₹50,000, so Goa moves to July 2027." Goa is then Jul 2027, and it fires once only. A ₹60,000 bonus leaves Goa in June and closes the condition.

## DB-1 Schema · Status: done
- Used: `node:sqlite`, Node 26.8.2.
- Decisions: all 14 tables listed, all money in integer paise, posting sign is debit positive. `events` carries label, amount, category, reference and meta so rows need no extra joins. `goals` adds `floor_month` and `reduction_*`. `profile` is key-value. `resetDb` is an extra export.
- Files: `src/ledger/schema.ts`.
- Verified by: the vitest run above; `npm run seed` against a scratch DB → "64 rows, 4 goals, month 2026-10", on a connection with foreign keys on.

## DB-2 Synthetic seed · Status: done
- Used: `seedDemo`, which wipes then reseeds, so the reset route can just call it.
- Decisions: `simMonth` 2026-10. October's Bike EMI is left out on purpose, or the beat 3 dictation would count it twice. `next-month.json` is `{ month, simulated, synthetic, bonus: 4200000 (paise), txns: RawTxn[] }`. The bonus is **not** in `txns`.
- Also: rent to Landlord ₹18,000 is my addition, so Rahul's ₹5,000 is a second rent line. November dining totals ₹13,140 against ₹4,800 in October. It only registers as dining if `categorize` recognises Swiggy, Zomato, Toit and Truffles.
- Files: `seed/index.ts`, `seed/run.ts`, `seed/next-month.json`.
- Verified by: golden "seed" tests; `npm run seed` as above.

## BE-1 Ledger · Status: done, all 11 fixtures including 7
- Decisions:
  - Fixture 7 works through `postSplitExpense`, but dictation can't reach it because the router has no split item.
  - Fixture 8: `openEmi` posts nothing and only instalments count. EMI principal and interest aren't split.
  - Fixture 9: dedupe on reference, or on amount, date and account when either row has no reference. Two different references stay two rows.
  - Fixture 10: **not handled automatically.** Both rows stay and both count as spend, each with a "Same as this?" flag (same amount, within 3 days).
  - Undo is a reversal event dated like the original. Rules recategorise past rows by editing postings in place, which is the one exception to append-only; spend doesn't change.
- From the ingest builder: narration is stored as `sourceQuote`; `account` is kept; money in has kind `income`; rules match payee, label or narration. All tested.
- Files: `src/ledger/post.ts`, `src/ledger/state.ts`, `src/ledger/index.ts`, `src/ledger/ledger.test.ts`.
- Verified by: "the 11 ledger fixtures" tests in the vitest run.

## BE-2 setWithdrawalTreatment · Status: done
- Decisions: "spend" counts only the cash not yet explained, so ATM ₹10,000 with ₹6,000 logged gives spend ₹10,000, not ₹16,000. Logging more cash after that takes the wallet negative, and it gets flagged.
- Files: `src/ledger/post.ts`.
- Verified by: "BE-2" and "undoing a withdrawal treated as spend" tests.

## BE-3 Profile, goals, earmarks, date engine · Status: done
- Decisions:
  - Projected month is simMonth + ceil(remaining ÷ contribution), and `setSimMonth` pays contributions in so dates hold as months pass.
  - A ruled date is a floor: a goal can be moved later, but not earlier than its money allows. A ruling for an earlier date leaves the funded date showing.
  - Surplus = income − fixed − living budget (₹24,000, stored, not in AppState) − contributions.
  - Emergency fund in the profile is the emergency goal's earmark.
  - A dictated new goal gets a derived contribution (target ÷ months, default 12 months). This is not labelled to the user yet.
- Files: `src/engine/dates.ts`, `src/ledger/state.ts`.
- Verified by: "moving the clock" and "the what-if persists nothing" tests.

## BE-4 Planner · Status: done
- Decisions: candidates in order are goals give way, emergency draw, EMI, dining trim, defer (what-if only). The first 3 feasible are returned. **Fewer come back if fewer are feasible, and `[]` if nothing covers the amount, so callers must handle that.** The emergency floor is 3 months of costs and the EMI rate is an assumed 14%, both labelled in `assumptions`. Plans are tried for voices in plan order, which is why Goa speaks. Placeholders include `flat_delay_months`, `plan_a_after_month`, `goal_cover_months`, `reason_quote` and `precedent_quote`.
- Files: `src/engine/plans.ts`.
- Verified by: golden "gives 3 diverse plans" and "only affected goals speak" tests.

## Heavy expense behaviour · Status: done
- Decisions:
  - Heavy means above both the month's surplus and 25% of income (₹21,250), so the ₹5,000 plumber stays a row.
  - `applyRuling` is all or nothing. Ruling twice returns the first ruling without posting again. An unknown plan or goal throws and changes nothing.
  - Trigger expenses post to category `shopping`, because a trigger has no category.
  - `fireConditions` settles each condition once.
- Limits: a ruling can't be undone as a whole (`undoEvent` only reverses its expense row). `reduce_budget` is recorded in the ruling, and nothing enforces it. `hold_goal` with a non-month `until` moves no date.
- Files: `src/engine/rulings.ts`.
- Verified by: golden "the ruling posts the expense once", "Plan B and Plan C", "an unknown plan or goal" and beat 5 tests.

## BE-6 Golden beat test · Status: done
- Decisions: runs on the seed alone, as the ingest builder asked, using `dictateFixture.items` for beat 3 and inserting a ₹99,900 price literal for beat 4.
- Files: `seed/golden.test.ts`.
- Verified by: the vitest run above.

## Contract changes
Two optional, additive fields in `src/contract/schemas.ts`: `KhataRow.flag` ("same as this?") and `AppState.cash.flag` (negative wallet). **The UI needs to show both; fixtures 3 and 10 are only visibly flagged once it does.** `git merge-tree` against `build/ingest`, `build/agents`, `build/ui` and `main` shows no conflicts.

## Integration needed
- `/api/confirm`: for an `expense` item, check `isHeavy(getState(db), item.amount)`. If heavy, **don't call `applyItem`**: build plans, `savePanchayat`, and let `applyRuling` post it. `applyItem` posts whatever it's given.
- `/api/ruling`: `previewRuling` when `apply` is false, `applyRuling` when true.
- `/api/reset`: `seedDemo(getDb())`. It imports from `seed/index.ts`.
- Insights `runNextMonth`: read `seed/next-month.json` (also exported as `nextMonth`), post `txns`, call `setSimMonth(db, month)` and `fireConditions(db, bonus)`. Post the bonus as income separately if it should count. Call `saveReview(db, review)`, an extra export, or `getState().review` stays null.
- Router: a `correction` item needs both `pattern` and `category`, or `applyItem` makes no rule. Goal and person items without a known goal or person throw, so `/api/confirm` should catch that.

## Blockers
None.

## Checked against the ingest samples (one-off, not a committed test)
Seed plus `statement.csv` and `sms.txt` through the ingest parsers and `postImportedTxn`, with null categories: 19 parsed, 17 added, 2 dropped as duplicates. Goal dates are unchanged.
- **The sample ₹85,000 salary on 2026-10-01 is dropped as a duplicate of the seed salary, so it does not add income.** That differs from what the ingest builder reported. I kept it, because a doubled salary would be worse.
- The other drop is a ₹5,000 SMS on 2026-10-05. I assume it is the sample CSV's copy of the same payment; I didn't inspect the row.
- **Importing the samples on camera raises October spend from ₹45,367 to ₹70,204.50**, so any spend figure said after that import must use the new number.

## Not verified
- The routes, UI and real insights module are not merged, so nothing here has run through them.
- `hold_goal` has no test.
- PDF samples were not run through this check.

## Suggested items
- A router `split` item, to reach fixture 7 by voice.
- Automatic spoken-versus-import matching (S4), built on the existing flag.
- Undo for a whole ruling.
