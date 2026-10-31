# Iteration log

A controlled improvement loop. The baseline comes first, then one batch per iteration with verification and blind re-scoring. Changes that don't clearly improve quality are reverted. Only the reviewer's scores appear in the scorecards.

Rubric: OFFICIAL from HACKATHON.md · Target: 8.0/10

---

## Baseline · 2026-10-31 15:05 IST

### What it currently does

Nothing runs yet. The repo at `code/paisa-panchayat/` is empty, 0 of 44 MUST items are done, there are no tests, and there is no demo path to time. `/hack-test` was skipped for this baseline because there is nothing to test.

### Strengths

- **A concept with a strong blind score.** 7.5 as a concept from a blind judge, the highest of four ideas (`docs/reviews/ideate-judge.md`). Nothing has been seen running.
- **A reviewed plan.** A skeptic review fixed the hero lines, ownership and timings before any code (`docs/reviews/plan-skeptic.md`).

### Weaknesses

| # | Weakness, and why it costs points | Severity |
|---|---|---|
| W1 | Nothing is built, so every product criterion (60 points: prototype, AI, problem, plus innovation at 10) has nothing behind it | Critical |
| W2 | OBS wasn't running at 15:05, so build-by-voice footage (Wispr Flow, 20 points) isn't being captured and can't be recreated | Critical |
| W3 | Hinglish amounts through Flow are untested, and the parser and the demo depend on them | High |
| W4 | No Gemini key is set up yet, so real agent calls and free-tier limits are unproven | High |
| W5 | No LinkedIn post is out yet (15 points plus up to +10 bonus) | High |

### Baseline scorecard

Not scored: there is no product for a judge to assess. The concept score above is not a build score.

---

## Iteration 1 · 2026-10-31 15:05–16:35 IST · 7.4h left

**Batch:**

| Item | Expected effect |
|---|---|
| W1 / all backend and UI MUST items | A working product behind every product criterion |
| W4 / SET-3 | Real Gemini proven on the hero path |

**What changed:** commits 66568e5 through 46db7a1 on `main` in `code/paisa-panchayat`. Build reports are in `docs/build-runs/`.

**Bugs:** fixed B-1 to B-10 · new none · still open B-11 (P3). The fixes passed unit tests and a production build but weren't re-run in the browser. B-5's re-check of edited amounts wasn't added; only its empty screen was fixed.

**Scorecard (blind, docs/reviews/2-test-judge.md):**

| Criterion | Previous | Now | Δ |
|---|---|---|---|
| Wispr Flow usage (20%) | not scored | 5 | n/a |
| Prototype quality and UX (20%) | not scored | 7 | n/a |
| AI integration (20%) | not scored | 7 | n/a |
| Problem understanding (15%) | not scored | 7 | n/a |
| LinkedIn content and engagement (15%) | not scored | 2 | n/a |
| Innovation and creativity (10%) | not scored | 8 | n/a |
| **Weighted** | not scored | **5.95** | n/a |

**Kept or reverted:** all kept: MUST items were finished and no P0 appeared.

**Weaknesses still open:** W2 (build footage), W3 (real Flow text untested), W5 (no LinkedIn post). Also: plan table clipped by the dictation bar at the bottom, README not written, fresh-clone test not run.

Implementer notes: not part of the score. The judge read screenshots taken before the B-3 and B-6 fixes and didn't run the app live. About 50 minutes were lost to a Claude usage limit, and gemini-3.8-flash proved unusable on this key.

---

## Debug 2026-10-31 17:03 IST

| Bug | Root cause | Fix | Regression test |
|---|---|---|---|
| B-12, B-14 | A ruling's effects were not recorded, so undo could reverse only one row | Record every effect at ruling time; undoing any of its rows reverses them all | `src/server/app.test.ts` |
| B-13, B-17 | `applyRuling` ran plan actions for any trigger, and `reduce_budget` is a no-op | A what-if records the decision and moves nothing; the screen says so | `src/server/app.test.ts` |
| B-15 | `confirm` held only the first heavy expense | All heavy expenses in a dictation share one panchayat | `src/server/app.test.ts` |
| B-16 | Plans are computed at convene and weren't re-checked at apply | Affordability is checked again at apply | `src/server/app.test.ts` |
| B-18 | `whatIf` assumed every percent was a saving | Read the direction from the words | `src/server/app.test.ts` |
| B-19 | Rules overwrote categories without keeping the old ones | Store changes; add undo and a button | `src/server/app.test.ts` |
| B-23 | `confirm` ignored `utteranceId` | Remember confirmed ids in memory, so a restart forgets them | `src/server/app.test.ts` |
| S-1, S-8 | The guardrail needed an instrument word plus an ask word | Add always-refuse names and index, gold, FD and scheme asks | `src/agents/safety.test.ts` |
| S-3 | The amount parser is slow on long input | Refuse dictation over 4,000 characters | `src/server/app.test.ts` |

**Stayed open:** B-20 (a withdrawal marked "Spent" double-counts later cash; design, not on the demo path) and B-22 (next-month review goes stale after an undo; not on the demo path). S-2, cross-site writes to localhost, is accepted because the app runs locally for recording. The remaining P2 and P3 bugs are in `docs/TEST_REPORT.md`.

**Design flags for the next iteration:** what-ifs are simulations only, so a user can't yet adopt "cut dining 30%" as a real budget. The guardrail's lists are finite.

---

## Iteration 2 · 2026-10-31 16:35–17:18 IST · 6.7h left

**Batch:** stress rounds, then P1 fixes, guardrail gaps and demo-path P2s, plus the README.

**What changed:** commits after 46db7a1 through 244213d. See the Debug entry above.

**Bugs:** fixed B-12 to B-18 and the listed P2s · new 3 P2, 7 P3 · open P0 0, P1 0.

**Scorecard (blind, docs/reviews/3-test-judge.md):**

| Criterion | Previous | Now | Δ |
|---|---|---|---|
| Wispr Flow usage | 5 | 5 | 0 |
| Prototype quality and UX | 7 | 8 | +1 |
| AI integration | 7 | 7 | 0 |
| Problem understanding | 7 | 8 | +1 |
| LinkedIn content and engagement | 2 | 3 | +1 |
| Innovation and creativity | 8 | 8 | 0 |
| **Weighted** | 5.95 | **6.45** | +0.5 |

**Kept or reverted:** all kept: the score rose, P1s were fixed and no P0 appeared.

**Weaknesses still open:** W2 (build footage), W3 (real Flow text), real Gemini beyond the panchayat path, refusal is a template line, B-20 and B-22.

---

## Redesign 2026-10-31 17:47 IST (user request, not scored)

Rebuilt all screens as a friendly app: home with a money ring and goal rings, plan cards you can tap (a tap spends no model call), goal voices and Munshi as chat, recap as sized bubbles, bottom tab bar, new type and colours. Ring colours pass the palette validator. No backend logic changed.

**Checked:** 445 tests, type check, lint with no errors, production build. Screens captured at 390 × 844 for home, confirm, panchayat, ruling, apply, goals, Munshi and alerts, and at 1440 × 900 for home and panchayat, in fake AI mode, with no console errors.

**Not re-checked since the redesign:** import tiles with real files, row undo, rule undo, the withdrawal toggle, and restart persistence through the new screens. A blind judge hasn't seen it. This redesign also changes D-1, D-2, D-3 and D-6, so those bugs need re-testing before they're closed.

---

## Redesign 2026-10-31 22:38 IST (user request, not scored)

Restyled every mobile screen from the user's three Payoneer mobile concept references: frosted glass panels with a large bottom radius over a black lower section, a dark smoky balance card with light, wide numerals, white squircle buttons, translucent chips and small dark cards for recent entries. Home is now the larger centre ring in the bottom nav, and the ₹ coin on the Home page is larger. The pink accent stays in place of the references' red. No charts were added. The reference's category bar card was left out on purpose.

**Also fixed along the way:** every section now opens at its top, because the shared scroller kept the last section's position. The ruling card scrolls into view by itself, so "Apply ruling" isn't left under the dock or above the fold after choosing a plan. "Add" on the Ledger no longer clears text already in the box.

**Checked in fake mode:** 480 tests, type check, lint with no errors, production build. Every screen walked at 390 × 844 and 360 × 640 with no sideways overflow or console errors. The hero flow was run with the API held back at 390 × 844 and 390 × 700, which covers the loading screens, the spoken ruling, choosing a plan, applying it and a what-if. A reason opens on a balance card and fits the screen. The chips bring their card forward.

**Not re-checked:** real Wispr Flow typing inside the phone frame, real file uploads through "+", row undo and rule undo through the new screens. A blind judge hasn't seen it.

---
