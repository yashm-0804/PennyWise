# Test run: 8-scenarios (simulated-scenario review of the money model)

2026-10-31 · App: copy of the repo run with `DB_PATH=./data/scenario.db LLM_MODE=fake` on port 3106 · Repo state: uncommitted working tree, source read-only

## How this was run
- The repo's own dev slot was taken (another `next dev` was running in the repo), and Next refuses two dev servers per directory. I ran an rsync copy of the source with a cloned `node_modules` from `/private/tmp/claude-501/-Users-yashmehta-Desktop-projects-Product-Space-AI-Agnetic-Hackathon/d01e0d97-34f6-4c84-85a2-1472383f42b7/scratchpad/sc8/app`. No file in the repo was edited. My server was stopped by PID (60720).
- One slip: my first attempt rsynced the source into `scratchpad/app`, which another agent was using. The files were identical copies. I did not touch that agent's server or the other servers on 3104, 3105 and 3107.
- Scripts are in `/private/tmp/claude-501/-Users-yashmehta-Desktop-projects-Product-Space-AI-Agnetic-Hackathon/d01e0d97-34f6-4c84-85a2-1472383f42b7/scratchpad/sc8/t/` (s1.mjs to s13.mjs plus lib.mjs). `lib.mjs` has `conservation()`, which opens the DB read-only with `node:sqlite`.
- Fake mode only. No Gemini calls. Where the fake router's limits could explain a result, the bug is marked "fake-router caveat".

## Money conservation
**Held in every scenario.** After each scenario, `conservation()` checked all of these:
- every event's postings sum to 0;
- the sum of all postings is 0;
- expense accounts are posted only by `expense`, `emi`, `withdrawal_treatment` and `reversal` events.

It returned `ok: true` every time, including after the plan C undo, the cash overdraft, the 9,00,000 lend and the pattern-`a` rule. The bugs below are about meaning and state (earmarks, goals, fixed costs, rules, labels). They are not about postings summing to non-zero.

## Coverage
- ✓ 1. Storyline, then undo in reverse (s1). The ledger side returns to seed: spend, cash, EMI count. Goals, rule, condition and fixed costs do not: see C-1, C-2, C-14.
- ✓ 2. Two heavies, a second panchayat while the first is unruled, close without ruling, an emergency fund drawn twice, two rulings on one panchayat, and a goal moved earlier (s2): see C-3 to C-7.
- ✓ 3. What-ifs (s3, s11): see C-8 to C-11. The `rent goes up to 34000` case, 0%, 100%, no category, and an amount above income were all run.
- ✓ 4. Withdrawal toggle, overdrawn cash, lending more than held, overpaying a debt, name case (s4, s12): see C-12 and C-13, C-15 to C-17. Name case merges correctly: `rohit` and `Rohit` are one account. Toggle then undo restores exactly. Cash overdraft is flagged.
- ✓ 5. EMIs (s5): see C-18 to C-20.
- ✓ 6. Rules (s6, s6b, s13): see C-2, C-21 to C-23. A ₹300 repayment to the same payee is correctly NOT caught by the Rahul rule (import test, ₹300 stays `other`, ₹5,000 becomes `rent`).
- ✓ 7. Next month (s7, s7b, s9): reset fully clears next-month state (conditions, notices, price checks, review, rules and panchayats are all 0 after reset), and next-month runs again. A dictation after the roll lands on 2026-11-28. The strip shows "Spend, November". Surplus uses the profile income. Without a ruling, the bonus path works (no conditions, so nothing fires). A second run returns the stored result and posts nothing. The storyline numbers are consistent: Khata = strip = review = ₹58,767. Defects: C-24, C-25.
- ✓ 8. Goals (s8, s10): see C-26 to C-30.
- ✓ 9. Dates (s10): see C-31 to C-33.
- ✓ 10. Display truth (s9, s12): see C-13, C-34. "Same as this?" flags work. The "Spoken", "SMS", "CSV" and "Simulated month" source labels match the real source on every row I checked.
- ✓ Double confirm and parallel requests (s12): see C-35. A double ruling is guarded: parallel rulings x3 gave 1 laptop row.
- – Not tested: "cached" price labels on real or failed lookups (needs Gemini search). Contribution = 0 projection (no API path creates a zero contribution: dictated goals get `ceil(target/months)` of at least 1; `projectMonth` returns `NEVER_MONTH` 2099-12 without looping, by code reading). Goal rename and delete (no such operation exists; only undo of `goal_create` deletes). A December to January clock rollover (`addMonths("2026-12", 1)` is correct by reading; the clock can only be advanced once, to Nov, so it cannot be driven through the API). Real-model date and what-if extraction.

## Bugs

### C-1 · P1 · on-path · Undoing the heavy expense leaves the ruling's plan effects in place
- Repro (s1.mjs):
  1. `POST /api/reset`. Dictate "Laptop died, new one is 70 thousand, need it this month" and confirm. Rule with plan A ("Goa moves to June, and if the bonus is under 50 thousand, July") with `apply:true`.
  2. `POST /api/undo` with the Laptop event id.
- Expected: undoing the ₹70,000 expense reverses what the ruling did to pay for it, or says plainly that it cannot.
- Actual: spend returns to ₹45,367, but the money stays moved. Flat earmark 1,20,000 to 64,152. Goa earmark 12,000 to 2,000. Goa target 2027-04 stays 2027-06. Flat 2029-02 stays 2029-08. The pending bonus condition stays. The panchayat stays "ruled", so it cannot be re-ruled. The goal money is gone with no expense behind it.
- Evidence: after undo, goals are `g-flat:6415200/...@2029-08`, `g-goa:200000/...@2027-06`, and `conditions` has 1 `pending` row. Seed values were `g-flat:12000000`, `g-goa:1200000`.
- Frequency: always.

### C-14 · P1 · off-path · Undoing a plan C (EMI) ruling leaves fixed costs and the goal contribution cut in place
- Repro (s5.mjs 5e/5f): confirm a ₹70,000 expense, rule with the EMI plan, then undo the instalment event and then the `emi_open` event.
- Expected: fixed costs, contributions and surplus return to seed.
- Actual: after undoing both, `fixedCosts` stays 40,13,400 (seed 33,84,800), surplus stays 0 (seed 4,152), and the iPhone goal stays at 2028-09 (seed 2027-12), because `reduction_amount` is never cleared. Undoing only the instalment leaves the EMI plan open with 12 instalments left.
- Evidence: `fixed:4013400,surplus:0` after both undos.
- Frequency: always.

### C-2 · P2 · on-path · A spoken rule cannot be undone, and it rewrote history
- Repro (s1, s6): confirm "Rahul ko jo jaata hai woh rent hai", then undo everything in the Khata.
- Expected: the rule can be undone, or at least listed with a way to remove it.
- Actual: the correction creates no event, so there is nothing to undo. The rule stays (`Rahul>rent x3`), and the 3 old Rahul rows stay recategorized (`expense:rent` goes from 54,000 to 69,000). The recategorization edits postings in place (`UPDATE postings SET account_id`). No reversal event exists, and the old category is not recorded. There is no rule-delete route.
- Frequency: always.

### C-3 · P1 · off-path · A second heavy expense in the same confirm skips the panchayat and posts directly
- Repro (s2.mjs 2a): `POST /api/confirm` with items Laptop ₹70,000 and Phone ₹90,000.
- Expected: both are held for a panchayat, or one at a time.
- Actual: a panchayat convenes for the Laptop only. The Phone ₹90,000 is posted immediately as an expense (`!heavy` in `confirm()`), with no plans. Spend rose by exactly ₹90,000.
- Frequency: always.

### C-4 · P1 · off-path · Two unruled panchayats can both draw on the emergency fund, below its floor
- Repro (s2.mjs 2c): confirm "Laptop 70000" and then "Phone 70000" in two confirms (two panchayats, both offering plan B "draw on Emergency Fund"). Apply plan B to both.
- Expected: the second draw is refused or re-planned against the current fund.
- Actual: plans are computed at convene time and `applyRuling` does not re-check the floor. The fund goes from ₹2,40,000 to ₹1,08,304, which is 1.87 months of cover. The planner's floor is ₹1,73,544 (3 months). One draw alone passes the floor by only about ₹600.
- Frequency: always.

### C-5 · P2 · off-path · Closing a panchayat without ruling silently drops the confirmed expense
- Repro (s2.mjs 2b): confirm "Laptop 70000" and do not rule.
- Expected: a warning that the expense is not recorded, or a held entry.
- Actual: the expense is never posted: zero Laptop rows, and spend is unchanged. The only trace is a Notices panchayat entry with no ruling. The screen header does say "What-if: nothing saved yet", but the user spoke a real expense and confirmed it. The same applies when no plan covers it (a ₹3,00,000 purchase returns zero plans).
- Frequency: always.

### C-6 · P2 · off-path · A second ruling on a ruled panchayat answers `applied:true` with a different plan, but nothing changes
- Repro (s2.mjs 2d): apply plan A, then apply plan C on the same panchayat.
- Expected: an error or `applied:false`.
- Actual: the response has `applied:true`, the same `rulingId`, `ops:[choose_plan C]` and a diff showing the iPhone moving 2027-12 to 2028-09. The state is identical to after the first ruling and the recorded text is still "plan A". The UI would animate a diff that never happened.
- Frequency: always.

### C-7 · P2 · off-path · A ruling can set a goal's target date earlier than its money allows
- Repro (s2.mjs 2e): ruling with `move_goal` Goa to 2026-11.
- Expected: rejected, or a clamped date shown.
- Actual: `target_month` is stored as 2026-11 (the Goals tab shows "Target Nov 2026") while the projection stays 2027-06. `moveGoal` also sets `floor_month`. The preview diff is honest (it shows 2027-06), but the stored target is not what the user can reach. The ruling also silently chose plan A (via `withPlan`), which posted the Laptop expense and cut Flat and Goa earmarks.
- Frequency: always.

### C-8 · P1 · on-path · Applying a ruling on a what-if changes nothing, but the UI says "Ruling saved"
- Repro (s3.mjs): dictate "what if I cut dining by 30%", `POST /api/panchayat`, then `POST /api/ruling` with `choose_plan A` and `apply:true`.
- Expected: either a real budget and contribution change, or no "saved" claim.
- Actual: the plan's only action is `reduce_budget`, which `applyAction` ignores, and there is no budget table. Only a panchayat ruling row is added (`panchayats` 0 to 1). Goals, spend, surplus and contributions are unchanged. The preview and animation show Flat 2029-02 to 2028-11, then the state refresh shows no change. The UI says "Ruling saved" (`PanchayatScreen.tsx` line 216, `open.applied`).
- Frequency: always.

### C-9 · P1 · off-path · Applying a ruling on a quantity what-if really moves goal money, with no expense
- Repro (s11.mjs): dictate "what if I buy a laptop for 70000", convene, apply plan A. Repeat with plan B and plan C.
- Expected: a what-if changes nothing (the trigger is flagged `hypothetical:true`, and the UI says "nothing saved yet").
- Actual:
  - Plan A: Flat earmark falls by ₹55,848, Goa by ₹10,000, and both goals' dates move. No expense is posted.
  - Plan B: the emergency fund falls from ₹2,40,000 to ₹1,74,152 and its projection goes from 2028-08 to 2029-09.
  - Plan C: iPhone contribution is cut and the date moves to 2028-09. Surplus rises from 4,152 to 6,286, and no EMI is opened.
  - `applyRuling` only checks `trigger.kind === "expense"` before posting, but runs the plan's actions for any kind.
- Frequency: always.

### C-10 · P1 · off-path · A what-if that raises a cost with a percent is modelled as a saving
- Repro (s3.mjs): "what if dining goes up 20%".
- Expected: goals get later.
- Actual: `percent` is treated as a saving whatever the direction. The plans read "All to Flat" with Flat 2029-02 to 2028-12 (earlier), "All to Goa" and so on, and the action is `reduce_budget 20`.
- Frequency: always. Fake-router caveat: the direction word is not read by the fake router, but `whatIf()` never reads direction in any mode.

### C-11 · P2 · off-path · What-if edge cases give wrong or misleading plans or errors
- Repro (s3.mjs):
  - "what if rent goes up to 34000": the monthly delta (₹34,000 vs the ₹18,000 average) is bigger than every goal's contribution, so `monthlyPlans` returns nothing. It silently falls back to a one-time ₹34,000 expense with plans like "Surplus, then Goa and Flat give way" (₹29,848 taken from goals). A rent rise is a monthly cost, not a one-off.
  - "what if I cut dining by 0%" and "what if I cut by 30%" (no category) both return "I need an amount or a percent for that what-if", even though a percent was given.
  - "what if I earn 500000 more" is treated as a cost of ₹5,00,000: one plan, "Wait until November 2036". "what if I buy a car for 900000" gives "Wait until November 2044" as the only plan, with no cap.
  - "cut groceries by 30% and dining by 10%": only dining at 30% is used; groceries is dropped, but the title still names both.
  - 100% works (Flat 2028-05).
- Frequency: always.

### C-12 · P2 · on-path · After "Spent" on a withdrawal, later cash spending is counted twice and flagged as a missing withdrawal
- Repro (s4.mjs B3): withdraw ₹10,000, toggle it to "Spent" (spend +₹10,000, cash 0), then log ₹1,000 chai from cash.
- Expected: no extra spend, or a clear rule for it.
- Actual: spend rises another ₹1,000 and cash goes to -₹1,000 with the flag "Cash wallet is ₹1,000 short: a withdrawal may be missing". The money was already counted when the withdrawal was toggled. Toggling back to "Moved to cash" restores correct spend.
- Frequency: always.

### C-13 · P2 · off-path · Khata row sum does not match the strip after a partial "Spent" toggle
- Repro (s12.mjs 10a): withdraw ₹10,000, log ₹4,000 plumber from cash, toggle the withdrawal to "Spent".
- Expected: Khata rows marked Spend add up to the strip's Spend.
- Actual: the strip is ₹55,367 (the ledger counted only ₹6,000 of the withdrawal). The Khata rows marked "Spend" add up to ₹59,367, because the withdrawal row shows `countsAsSpend:true` with its full ₹10,000. The header says "Month spend adds only rows marked Spend".
- Frequency: always.

### C-15 · P2 · off-path · Overpaying a debt silently flips the person's balance with no warning
- Repro (s4.mjs D1, D2): lend Rohit ₹2,000, then he repays ₹5,000. Separately, borrow ₹1,000 from Meena, then repay ₹3,000.
- Actual: Rohit shows "I owe ₹3,000" and Meena "owes me ₹2,000". Both are legal postings, but nothing asks or flags that a repayment exceeded the debt (there is no check in `applyItem`).
- Frequency: always.

### C-16 · P2 · off-path · Lending or spending more than the account holds is not flagged for bank
- Repro (s4.mjs C3): lend ₹9,00,000 from the bank (bank ₹5,77,129).
- Actual: bank goes to -₹3,22,871, with no error, status or flag. Only the cash wallet has a short flag (C1 and C2 show it works: "Cash wallet is ₹5,000 short").
- Frequency: always.

### C-17 · P3 · off-path · Person name keeps the first-seen casing
- Repro (s4.mjs E): borrow from `rohit`, then repay `Rohit`. The balances correctly merge, but the display name is `rohit` for good (the account name is set on first insert). Accent variants (`Rohít`) become a separate person.

### C-18 · P2 · on-path · The same month's EMI can be recorded any number of times
- Repro (s5.mjs 5a): confirm "EMI Bike EMI 8400" twice in October.
- Actual: two instalments (spend +₹8,400 each, instalments left 14 then 13). There is no one-per-month guard and no "Same as this?" flag for spoken-vs-spoken duplicates.
- Frequency: always.

### C-19 · P2 · off-path · EMI instalments continue after the plan reaches 0 left
- Repro (s5.mjs 5b): 22 instalment dictations for Bike EMI.
- Actual: `instalmentsLeft` floors at 0 and stays listed, but each further instalment is still posted (spend ₹2.38 lakh after 22 posts, vs the 17 that remained).
- Frequency: always.

### C-20 · P2 · off-path · An EMI with an unknown name is accepted, and a same-amount one attaches to the wrong plan
- Repro (s5.mjs 5c, 5d): "Car EMI 5000" has no matching plan but posts as spend with no error or ask. "Car EMI 8400" attaches to the Bike EMI plan (`findEmiPlan` falls back to `monthly === amount`), so Bike's instalments left drops from 15 to 14.
- Frequency: always.

### C-21 · P2 · off-path · A rule with a one-letter or space pattern re-files a large part of the ledger
- Repro (s6.mjs): correction with pattern `a` to `family`, or pattern ` ` (one space).
- Actual: `a` recategorizes 14 existing rows into `family`. A space recategorizes 27 rows (the pattern is substring-matched with no word boundary and no minimum length). No confirmation, and no undo (C-2). An empty pattern is silently dropped (no rule, no error).
- Frequency: always.

### C-22 · P2 · off-path · Two rules on one row: the later rule wins on old rows, the earlier rule wins on new rows
- Repro (s6.mjs 6b, s13.mjs): rule 1 `Rahul` to `rent`, then rule 2 `okaxis` to `family`.
- Actual: the second rule takes the 3 old rows (`Rahul>rent x0`, `okaxis>family x3`). In next-month the first-created rule wins: the Nov Rahul row is `rent`. The same payee ends up under two categories across months.
- Frequency: always.

### C-23 · P3 · off-path · `appliedCount` counts every matching row in the rule's category, not rows the rule changed
- Repro (s6.mjs 6c): rule `Landlord` to `rent` (already rent). It shows `x3` although nothing changed. The old-row retro-match also uses a different matcher (substring) than the import matcher (word-start), so a rule can retro-match rows that an import would not.

### C-24 · P2 · on-path · Next-month result goes stale after undoing a simulated row
- Repro (s7b.mjs): run next-month, undo the Nov Landlord row, run next-month again.
- Expected: review, notices and spend track the ledger.
- Actual: the second run returns the stored result. `review.spend` stays ₹58,767 while the strip and Khata show ₹40,767. There is no way to re-run, and the stored copy is only cleared by reset.
- Frequency: always.

### C-25 · P3 · on-path · Notice text duplicated and bonus not in the ledger
- Repro (s7.mjs, s9.mjs):
  - The Cult Gym notice reads "Cult Gym: possibly unused: Cult Gym: possibly unused. No related activity found...": the title and body repeat each other.
  - The ₹42,000 bonus fires the Goa condition, but no income event is posted for it, and `expectedBonus` still shows ₹60,000 after the month rolls.
  - The drift notice says "I slip 2 months later, to June 2027" while Goa's projection is unchanged (2027-04) unless a condition moved it.

### C-26 · P2 · off-path · Earmarks can exceed the bank balance and the goal target, with no flag
- Repro (s8.mjs 8a, 8b): earmark ₹10,00,000 to Goa (target ₹40,000), or set Flat's target to ₹20,000 under its ₹1,20,000 earmark.
- Actual: earmarks total ₹14,13,450 against a bank of ₹5,77,129. Goa shows earmarked ₹10,12,000 and "reached". Plans treat earmarks as real money, so a plan can "borrow" from a goal's phantom balance. Dictation of "earmark" has no cap.
- Frequency: always.

### C-27 · P2 · off-path · A dictated goal can push surplus negative with no warning
- Repro (s10.mjs): dictate a ₹1,00,000 goal for 2027-10. Contribution is `ceil(target/months)` = ₹8,334 a month.
- Actual: `monthlySurplus` becomes -₹4,181 (shown in the strip). A goal dated in the past (`2025-01`, `months=max(1,...)`) gets the full target as its monthly contribution (₹50,000 a month) and projects to next month. Plans clamp negative surplus to 0, so planning keeps working. Undo of `goal_create` restores surplus.

### C-28 · P3 · off-path · A fuzzy goal-name match sends money to the wrong goal
- Repro (s8.mjs): earmark ₹1,000 for "Goat farm". The goal matcher treats the query as containing "Goa" and the earmark lands on Goa with no error (`findGoal` uses `q.includes(name)`). A duplicate goal name silently targets the first one, and the second can never be reached.

### C-29 · P2 · off-path · Undoing an earlier goal_update clobbers a later one
- Repro (s8.mjs 8e): update Goa to ₹50,000, then to ₹60,000. Undo the first update.
- Actual: the target goes back to ₹40,000 (the first update's "before"), although the ₹60,000 update is still live. The same pattern applies to `profile_update`.

### C-30 · P3 · off-path · Goal rename and delete are not supported
- No operation renames or deletes a goal. `goal_update` only changes target, month and reason. Deleting is possible only by undoing the `goal_create` (which also deletes the goal's earmark rows). Noted, not a defect in what exists.

### C-31 · P2 · off-path · Spoken relative dates are ignored: "kal" and "last month" land on the 28th of the sim month
- Repro (s10.mjs): "kal 500 ka chai", "last month 2000 ka dining", "pichle mahine 1200 ka Swiggy", "yesterday 300 for auto".
- Actual: all four have `month:null`, status `ok`, and land on 2026-10-28. Nothing asks about the date. Only "this month" sets a month. The default day is hard-coded to 28 (`defaultDate`).
- Fake-router caveat: Gemini may fill `month`, but the code has no day-level date at all, and "kal" can only be the 28th of some month.

### C-32 · P3 · off-path · A date in the sentence is read as an amount (fake-router caveat), and an invalid month is stored
- "12 December 2025 ko 700 ka dinner" parsed as ₹2,025 with status `ok`. A confirm payload with `month:"2026-13"` is accepted, stored with date `2026-13-28`, and shown in Khata, because the month check is only `^\d{4}-\d{2}$`.

### C-33 · P3 · off-path · Imports dated outside the sim month are accepted and invisible to the strip
- Repro (s10.mjs): CSV with rows dated 05/12/2026, 03/01/2027 and 05/03/2025.
- Actual: all three posted (spend by month shows 2026-12, 2027-01, 2025-03). The strip shows only October, there is no notice, and none of them gets "Same as this?" flags. The imported payee comes out as the last narration segment (`FOOD`, `TRIP`, `SENT`, `REPAY`) rather than Swiggy or Uber. Conservation held.

### C-34 · P3 · off-path · Source labels and flags: no false claim found
- Checked "Spoken", "SMS", "CSV", "Simulated month" and the "Same as this?" flags across the storyline and imports; they matched the real source on every row. The ruling-posted Laptop is labelled "Spoken" because it was dictated, which is correct. `cached` cannot be exercised in fake mode.

### C-35 · P2 · off-path · Confirming the same utterance twice posts it twice
- Repro (s12.mjs 10b, 10c): `POST /api/confirm` with the same `utteranceId` and items twice: two rows are posted. Two parallel confirms of a heavy expense created 2 panchayats. (A double tap on a ruling is protected: 3 parallel rulings gave 1 expense row.) There is no idempotency key on `/api/confirm`.
- Frequency: always.

## Could not reproduce or not applicable
- Contribution of 0 looping or dividing by zero: `projectMonth` returns `NEVER_MONTH` (2099-12). No API path sets a zero contribution, so this stays theoretical.
- Deleting or renaming a goal: no such operation exists.
- A December to January rollover through the API: not reachable (the clock moves once, to November).
- Plan C leaves `fixed_costs` permanently higher after the EMI ends (it is never decremented): theoretical, since the clock cannot reach month 12.
- "cached" price label shown wrongly: needs live or failed price lookups; not tested.
