# Paisa Panchayat: test report

The newest round is on top. Bug IDs are unique across the project. Only the reviewer's scores appear in the scorecards.

## Round 3 · 2026-10-31 17:18 IST · 244213d · 6.7h left

Rounds run: 1 demo (3 full runs in Chrome, fake AI mode) · 6 fresh-clone · 7 judge.

### Summary

| Severity | New | Still open | Fixed since the last round |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 7 |
| P2 | 3 | 21 | 0 in this round |
| P3 | 7 | 21 | 0 in this round |

No flakes across 3 full runs: page text identical, console clean. Today's fixes confirmed in the browser: undo of a ruling, what-if wording, assumption chips, rule undo, the saved band, unreadable rows blocked, double-click Confirm. Fresh clone passed install, seed, run and 445 tests using only the README, with 0 key hits in tracked files.

**Not tested:** real Gemini beyond the panchayat path, real Flow text, phone width, the dead-AI message after its fix.

### Judge scorecard (blind, from docs/reviews/3-test-judge.md)

| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20% | 5 | Only an all-time Insights screenshot; not tied to this build |
| Prototype quality and UX | 20% | 8 | Plan table, ruling diff, cash counted once, honest labels |
| AI integration | 20% | 7 | Code computes numbers, Gemini voices and parsing; refusal is a template line; screenshots in fake mode |
| Problem understanding | 15% | 8 | Nearly every required item; nudges and review barely visible |
| LinkedIn content and engagement | 15% | 3 | One generic intent post with no visuals |
| Innovation and creativity | 10% | 8 | Goals that argue, precedent, conditional rulings |
| **Weighted** | | **6.45** | Target 8.0 |

What would raise the score, according to the judge:
1. Record the video with Flow visible and real Gemini, including a bug fixed by voice (about +6 points, about 3 h).
2. Post 3–4 more LinkedIn posts with the ruling clip, build-specific Flow stats and a tagged question (about +5 points, about 1.5 h).
3. Replace the refusal's template line with a real guarded Gemini reply, and show one unscripted Munshi question (about +2 points, about 1.5 h).

## Debug · 2026-10-31 17:03 IST · 86f2e09

Open now: P0 0 · P1 0 · P2 18 · P3 14. Fixes passed 445 tests, lint, a production build, the original repros and the end-to-end script through a real server, all in fake AI mode. They haven't been re-run in a browser, so `/hack-test` should confirm them.

## Stress round · 2026-10-31 16:52 IST · 46db7a1 · 7.1h left

Rounds run: 3 pressure · 4 security · simulated scenarios (money logic). All in fake AI mode, apart from an invalid-key failure run. No browser in these rounds. Round 1 (browser) is below.

### Summary

| Severity | New | Still open | Fixed since the last round |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 7 | 7 | 0 |
| P2 | 25 | 25 | 5 (B-1 to B-6, except B-5's amount re-check) |
| P3 | 17 | 18 | 4 (B-7 to B-10) |

Money conservation held in every scenario: every event's postings summed to zero. The P1s are about what a ruling or an undo does to goals, not unbalanced books. C-10's logic was confirmed by reading `whatIf()`, and the others by re-running them at 16:50.

### Performance (round 3)

| Scenario | Requests | p50 | p95 | Errors |
|---|---|---|---|---|
| /api/state, fresh seed (16 KB) | 10 concurrent | 8 ms | 20 ms | 0 |
| /api/state, after sample imports (26 KB) | 10 concurrent | 8 ms | 14 ms | 0 |
| /api/state, after +2,000 rows (495 KB) | 10 concurrent | 57 ms | 97 ms | 0 |
| /api/dictate, parallel, fake AI | 50 | not recorded | 159 ms | 0 |

Dead AI: every call failed within 1.05 s, with no hangs. 5,000-row CSV: 1.4 s. 1 MB SMS paste: 4.4 s.

### Held up

168 malformed calls changed no state. 20 parallel confirms gave an exact total. Next-month run 10 times in parallel advanced once. After `kill -9`, SQLite integrity and balances were fine. The key prefix appears only in `.env.local`: 0 hits in git history, tracked files, docs, logs and the client bundle. No raw-HTML sink, all SQL parameterized, `npm audit --omit=dev` shows 0 vulnerabilities.

### Not tested

Real Gemini on these paths, including how it treats guardrail bypass phrases and date words. Real Flow text. A zero-contribution goal, since no API path creates one.

### Judge scorecard

No new judge ran in this round. The latest is 5.95 against a target of 8.0 (`docs/reviews/2-test-judge.md`).

## Round 1 · 2026-10-31 16:30 IST · browser demo path

See `docs/test-runs/round1.md`. B-1 to B-11, P0 0, P1 0, P2 6, P3 5. All 7 beats completed. Fixes for B-1 to B-10 passed unit tests and a production build but weren't re-run in the browser.

## Bugs (cumulative)

| ID | Sev | Path | Title | Found in | Verified | Status |
|---|---|---|---|---|---|---|
| B-1 | P2 | on-path | Gym alert hidden by imports | round 1 | tester | fixed, regression test |
| B-2 | P2 | on-path | Focus stuck in SMS box after import | round 1 | tester | fixed, not re-run in browser |
| B-3 | P2 | on-path | Assumptions repeated and double-prefixed | round 1 | tester | fixed, not re-run in browser |
| B-4 | P2 | off-path | "Saved" for rows that save nothing | round 1 | tester | fixed |
| B-5 | P2 | off-path | Edited amount skips checks; empty panchayat | round 1 | tester | partly fixed: empty screen only |
| B-6 | P2 | off-path | What-if screen copy and paise | round 1 | tester | fixed, not re-run in browser |
| B-7 | P3 | on-path | Paise in the strip | round 1 | tester | fixed |
| B-8 | P3 | on-path | Stale saved band | round 1 | tester | fixed |
| B-9 | P3 | on-path | Drift and condition repeat a date | round 1 | tester | fixed |
| B-10 | P3 | off-path | "Emi" wording | round 1 | tester | fixed |
| B-11 | P3 | on-path | Faint reset control | round 1 | tester | open |
| B-12 | P1 | on-path | Undoing the heavy expense leaves the ruling's plan effects in place | C-1 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): undo reverses the whole ruling. Test: B-12 |
| B-13 | P1 | on-path | Applying a ruling on a what-if changes nothing, but the UI says "Ruling saved" | C-8 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): a what-if moves no money and the screen says so. Test: B-13 and B-17 |
| B-14 | P1 | off-path | Undoing a plan C (EMI) ruling leaves fixed costs and the goal contribution cut in place | C-14 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): same undo. Test: B-14 |
| B-15 | P1 | off-path | A second heavy expense in the same confirm skips the panchayat and posts directly | C-3 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): heavy expenses said together go to one panchayat. Test: B-15 |
| B-16 | P1 | off-path | Two unruled panchayats can both draw on the emergency fund, below its floor | C-4 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): stale plans are re-checked against the floor. Test: B-16 |
| B-17 | P1 | off-path | Applying a ruling on a quantity what-if really moves goal money, with no expense | C-9 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): same as C-8. Test: B-13 and B-17 |
| B-18 | P1 | off-path | A what-if that raises a cost with a percent is modelled as a saving | C-10 in `docs/test-runs/8-scenarios.md` | confirmed by re-run | fixed (verified 2026-10-31): direction read from the words, in fake mode. Test: B-18 |
| B-19 | P2 | on-path | A spoken rule cannot be undone, and it rewrote history | C-2 in `docs/test-runs/8-scenarios.md` | tester | fixed (verified 2026-10-31): rules can be undone. Test: B-19; the button wasn't tried in a browser |
| B-20 | P2 | on-path | After "Spent" on a withdrawal, later cash spending is counted twice and flagged as a missing withdrawal | C-12 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-21 | P2 | on-path | The same month's EMI can be recorded any number of times | C-18 in `docs/test-runs/8-scenarios.md` | tester | partly fixed: a repeat EMI of the same amount gets a warning, and saving it still counts it |
| B-22 | P2 | on-path | Next-month result goes stale after undoing a simulated row | C-24 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-23 | P2 | on-path | confirm is not idempotent (utteranceId ignored) | P-1 (same as C-35) in `docs/test-runs/3-pressure.md` | tester | fixed (verified 2026-10-31): repeat confirm of an issued id posts nothing. Test: B-23 |
| B-24 | P2 | on-path | With a dead AI, dictation of every demo phrase becomes "That wasn't clear", and nothing says the AI is down | P-2 in `docs/test-runs/3-pressure.md` | tester | partly fixed: the card says the AI is unreachable; not re-run with a dead key |
| B-25 | P2 | off-path | Closing a panchayat without ruling silently drops the confirmed expense | C-5 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-26 | P2 | off-path | A second ruling on a ruled panchayat answers `applied:true` with a different plan, but nothing changes | C-6 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-27 | P2 | off-path | A ruling can set a goal's target date earlier than its money allows | C-7 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-28 | P2 | off-path | What-if edge cases give wrong or misleading plans or errors | C-11 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-29 | P2 | off-path | Khata row sum does not match the strip after a partial "Spent" toggle | C-13 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-30 | P2 | off-path | Overpaying a debt silently flips the person's balance with no warning | C-15 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-31 | P2 | off-path | Lending or spending more than the account holds is not flagged for bank | C-16 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-32 | P2 | off-path | EMI instalments continue after the plan reaches 0 left | C-19 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-33 | P2 | off-path | An EMI with an unknown name is accepted, and a same-amount one attaches to the wrong plan | C-20 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-34 | P2 | off-path | A rule with a one-letter or space pattern re-files a large part of the ledger | C-21 in `docs/test-runs/8-scenarios.md` | tester | fixed (verified 2026-10-31): short patterns block on the card; not unit-tested |
| B-35 | P2 | off-path | Two rules on one row: the later rule wins on old rows, the earlier rule wins on new rows | C-22 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-36 | P2 | off-path | Earmarks can exceed the bank balance and the goal target, with no flag | C-26 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-37 | P2 | off-path | A dictated goal can push surplus negative with no warning | C-27 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-38 | P2 | off-path | Undoing an earlier goal_update clobbers a later one | C-29 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-39 | P2 | off-path | Spoken relative dates are ignored: "kal" and "last month" land on the 28th of the sim month | C-31 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-40 | P2 | off-path | A next-month run killed after DB commit, then re-run, duplicates the notices | P-3 in `docs/test-runs/3-pressure.md` | tester | open |
| B-41 | P2 | off-path | Guardrail misses common Hinglish and English investment asks | S-1 in `docs/test-runs/4-security.md` | tester | fixed for the reported phrases (verified 2026-10-31): deny-lists stay finite, and real Gemini is untested. Test: safety.test.ts |
| B-42 | P2 | off-path | Any website can reset or write data (CSRF) | S-2 in `docs/test-runs/4-security.md` | tester | open |
| B-43 | P2 | off-path | Quadratic parsing: ~16 KB of "1,1,1,…" freezes the server for 17 s, 100 KB for 4 s of spaces | S-3 in `docs/test-runs/4-security.md` | tester | fixed for dictation (verified 2026-10-31): length cap. Other parsers not re-measured |
| B-44 | P3 | on-path | Notice text duplicated and bonus not in the ledger | C-25 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-45 | P3 | on-path | Munshi refusal shows the "Illustration only…" sentence twice | S-5 in `docs/test-runs/4-security.md` | tester | fixed (verified 2026-10-31): the refusal no longer repeats the scenario |
| B-46 | P3 | on-path | "Nifty 50 ka kya haal hai" becomes a ₹50 expense card | S-8 in `docs/test-runs/4-security.md` | tester | fixed (verified 2026-10-31): Nifty asks are refused |
| B-47 | P3 | off-path | Person name keeps the first-seen casing | C-17 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-48 | P3 | off-path | `appliedCount` counts every matching row in the rule's category, not rows the rule changed | C-23 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-49 | P3 | off-path | A fuzzy goal-name match sends money to the wrong goal | C-28 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-50 | P3 | off-path | Goal rename and delete are not supported | C-30 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-51 | P3 | off-path | A date in the sentence is read as an amount (fake-router caveat), and an invalid month is stored | C-32 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-52 | P3 | off-path | Imports dated outside the sim month are accepted and invisible to the strip | C-33 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-53 | P3 | off-path | Source labels and flags: no false claim found | C-34 in `docs/test-runs/8-scenarios.md` | tester | open |
| B-54 | P3 | off-path | A confirm batch is not atomic; kill mid-batch then re-run double-posts the first part | P-4 in `docs/test-runs/3-pressure.md` | tester | open |
| B-55 | P3 | off-path | Validation errors return HTTP 500 with raw zod JSON; malformed JSON returns internals | P-5 (same as S-7) in `docs/test-runs/3-pressure.md` | tester | open |
| B-56 | P3 | off-path | Large dictation crashes with an internal error string | P-6 in `docs/test-runs/3-pressure.md` | tester | fixed (verified 2026-10-31): dictation over 4,000 characters is refused |
| B-57 | P3 | off-path | The ruling API applies an empty ruling, which posts the expense and closes the panchayat | P-7 in `docs/test-runs/3-pressure.md` | tester | fixed (verified 2026-10-31): an empty ruling can't apply |
| B-58 | P3 | off-path | Amount sign and "ask" rows are handled silently | P-8 in `docs/test-runs/3-pressure.md` | tester | open |
| B-59 | P3 | off-path | No size limit on /api/import or /api/dictate bodies | S-4 in `docs/test-runs/4-security.md` | tester | open |
| B-60 | P3 | off-path | Goal names and reasons skip the deny-list on some screens | S-6 in `docs/test-runs/4-security.md` | tester | open |
| B-61 | P2 | on-path | Assumption chips sit under the dictation bar at the hero moment, cut off mid-line | D-1 in docs/test-runs/1-demo.md | tester | open |
| B-62 | P2 | on-path | Condition notice says Goa's July twice; kicker and title repeat | D-2 in docs/test-runs/1-demo.md | tester | open |
| B-63 | P2 | on-path | README says nothing is saved until confirmed, but imports save directly and review-flagged rows aren't marked | F-3 in docs/test-runs/6-fresh-clone.md | tester | open |
| B-64 | P3 | on-path | Alert title repeated at the start of its body | D-3 in docs/test-runs/1-demo.md | tester | open |
| B-65 | P3 | on-path | Import-result panel stale after next month | D-4 in docs/test-runs/1-demo.md | tester | open |
| B-66 | P3 | on-path | Verbatim SMS quotes show Rs.5,000.00 | D-5 in docs/test-runs/1-demo.md | tester | open |
| B-67 | P3 | off-path | After noting a what-if, the panel offers "Close, see goals" beside a date that didn't change | D-6 in docs/test-runs/1-demo.md | tester | open |
| B-68 | P3 | off-path | MODEL_SEARCH in .env.example is never read | F-1 in docs/test-runs/6-fresh-clone.md | tester | open |
| B-69 | P3 | off-path | Wrong PDF password returns HTTP 200 with the error in unparsed | F-2 in docs/test-runs/6-fresh-clone.md | tester | open |
| B-70 | P3 | off-path | Dictated rows dated 28 Oct, panchayat uses the real date | F-4 in docs/test-runs/6-fresh-clone.md | tester | open |
