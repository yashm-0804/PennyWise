# Test run: round 1 (demo path, functional, real browser)

2026-10-31 16:30 · App: http://localhost:3102 (`DB_PATH=./data/test.db LLM_MODE=fake npx next dev`) · Repo state: uncommitted (not a git repo)
Browser: puppeteer-core 1.x driving Google Chrome headless, 1440x900 (and 1280x720 for beats 1-2 and what-if). No Gemini calls (fake mode).
Shots: `/Users/yashmehta/Desktop/projects/Product Space AI Agnetic Hackathon/docs/test-runs/shots/` (abbreviated SH/ below).
Note: the test run created `code/paisa-panchayat/data/test.db`; I did not touch any source file. Server stopped by PID.

## Coverage
- ✓ Beat 1: Reset demo, dictation, confirm card ("Ask" check on laptop is correct), Panchayat opens with the profile strip, 3 plans, 3 voices, "What-if: nothing saved yet". Legible at 1440x900 (SH/02-panchayat-1440.png) and 1280x720 (SH/02-panchayat-1280.png); at 1280 the third voice and the assumptions are below the fold but scroll.
- ✓ Beat 2: ruling "Goa moves to June, and if the bonus is under 50 thousand, July" -> diff (Flat Feb->Aug 2029, Goa Apr->Jun 2027, "If bonus under ₹50,000: Goa to Jul 2027") (SH/03-ruling-diff.png), Apply works, Goals dates change (SH/05-goals.png).
- ✓ Beat 3: ATM/plumber/Rohit/EMI -> 4 rows with quotes; spend +₹13,400 (cash counted once: 5,000 + 8,400, ATM 10,000 is "Moved to cash"); cash wallet ₹3,000 "not yet explained"; "Rohit owes you ₹2,000" (SH/07-khata.png). Withdrawal toggle Spent raises spend by exactly the unexplained ₹3,000 and clears the cash flag; toggling back restores. Undo of the Rohit row removes the debt and moves cash to ₹5,000.
- ✓ Beat 4: Hinglish iPhone question -> 50% at ₹82,900, 41.5% at ₹99,900, Apple link, "checked 31 Oct, 4:24 pm"; Goals tab shows same numbers (SH/10-munshi-iphone.png, SH/11-goals-iphone.png).
- ✓ Beat 5 (partly): SMS paste, CSV, PDF all import (5 / 12 + 2 dupes / 20 added); OTP/promo/loan SMS are rejected as "Couldn't read"; the injection-text rows in CSV/PDF are not obeyed. "Rahul ko jo jaata hai woh rent hai" makes a visible rule with reason quote (Munshi > Rules, applied 9x-10x). "Import next month (simulated)": rule ran, Hotstar ₹299->₹399, drift notice from Goa, bonus ₹42,000 condition moves Goa to Jul 2027, "Simulated month" labels visible (SH/21-next-month-full-flow.png).
- ✓ Beat 6: reload + real server restart (killed and restarted): state, notices, sabha, rule, precedent ("Laptop ₹70,000 ... 'Goa moves to June...'") all persist (SH/23-after-restart.png). "kaunsa mutual fund lun" -> "Won't name a security", MODELLED SCENARIO, NOT ADVICE, no security name (SH/24-fund-refusal.png).
- ✓ Beat 7: "what if I cut dining by 30%": plans show earlier dates, no voices, no crash (SH/25-whatif-dining.png). See B-6 for issues.
- ✓ Functional: undo a row; undo via the "Saved" band; withdrawal toggle; empty / whitespace dictation (Send disabled, Cmd+Enter does nothing); API errors (500 JSON, 502 HTML, network abort) all show "That didn't go through. <reason>. Nothing was saved." with Try again / Dismiss and keep the typed text (SH/33-error-*.png). Textarea `#dictation` keeps focus after every step in the main flow. Indian grouping is correct everywhere (₹2,40,000; ₹1,20,791.50; ₹40,00,000).
- ✓ Money agreement: strip, Goals, Munshi, Khata and sabha agree on iPhone ₹41,450 / ₹82,900, Rohit ₹2,000, cash ₹3,000, Hotstar. In a clean (no-import) run the drift notice "usual ₹4,783" matches the seed dining average (4,200 / 5,350 / 4,800).
- – Blocked row that cannot be saved: could not produce one in fake mode (fake router never returns "block" for the available lines; "no amount" lines come back as "Not understood / Ask"). The "Confirm disabled while blocked" logic is untested. See B-4 for what I did find.
- – 1280x720 for tabs other than Panchayat; 390px mobile (out of scope).

## Bugs
### B-1 · P2 · on-path · Beat 5 · "Cult Gym: possibly unused" alert disappears after the CSV/PDF imports
- Repro:
  1. Reset demo. Import `seed/samples/statement.pdf` (or CSV) on Notices & Sabha.
  2. Click "Import next month (simulated)".
  3. Read the notices.
- Expected: Hotstar price change AND "Cult Gym: possibly unused" (as storyline beat 5 and brief expect).
- Actual: only Hotstar, drift and rule/ruling notices. Without prior imports, the same click yields `possibly_unused | Cult Gym: possibly unused` (verified via POST /api/reset then /api/next-month and `GET /api/state`). Probable cause: `src/insights/recurring.ts` suppresses "possibly unused" when any other row exists in the same category (imported "Apollo Pharmacy Koramangala Branch Prescription", category Health), so any health import kills the alert.
- Evidence: `GET /api/state` notices after full flow = drift, price_change, condition_fired, rule_applied (no possibly_unused). SH/21-next-month-full-flow.png
- Frequency: always (4/4 runs with imports; 0/2 without)

### B-2 · P2 · on-path · Beat 5 · After SMS import, focus stays in the "Paste SMS" box, not the dictation box
- Repro:
  1. Notices & Sabha tab, type/paste SMS text into "Paste SMS", click "Import SMS".
  2. Check `document.activeElement`.
- Expected: dictation textarea (`#dictation`) is focused so Flow's next line ("Rahul ko jo jaata hai woh rent hai") lands there.
- Actual: activeElement is the paste textarea (no id, red focus ring, SH/15-pdf.png). Dictation typed next goes into the SMS box. (After CSV/PDF upload I clicked `#dictation` explicitly in my script, so only the SMS case was checked as a focus loss.)
- Evidence: puppeteer `document.activeElement.tagName` = TEXTAREA with empty id after import.
- Frequency: 2/2

### B-3 · P2 · on-path · Beat 2 · Assumption lines are duplicated and prefixed twice
- Repro: Reset demo, dictate the laptop line, confirm. Look at the assumption chips under the plan table.
- Expected: each assumption once, "Assumption: ..." once.
- Actual: "Assumption: Assumption: only this month's surplus..."; "the expected bonus is not counted until it arrives" appears 3 times (plus "the fund's floor"); the dining what-if shows the same sentence 3 times. React logs "Encountered two children with the same key" (the next dev overlay shows "1-4 Issues" over the bottom-left of the dictation bar in dev). On the video this reads as sloppy; at 1440x900 the first chip is also half-hidden behind the dictation bar.
- Evidence: SH/02-panchayat-1440.png, SH/25-whatif-dining.png; console error repeated.
- Frequency: always

### B-4 · P2 · off-path · Confirm card · Rows that save nothing still say "Saved 1 entry"
- Repro:
  1. Dictate "asdf qwerty" (row: "Not understood / Ask / No amount", Confirm 1 entry is enabled). Confirm.
  2. Or dictate "Chai 40 rupaye", edit the amount to 0, Confirm.
- Expected: a not-understood row cannot be confirmed (or says nothing was saved); a 0 amount is rejected.
- Actual: green band "Saved 1 entry." but `GET /api/state` rows contain no new row for either.
- Evidence: SH/31-zero-confirm.png; /api/state rows[0] stays Blinkit 26 Oct.
- Frequency: always (2/2)

### B-5 · P2 · off-path · Confirm card · Editing an amount skips the checks; huge amount produces an empty Panchayat
- Repro: Dictate "Chai 40 rupaye", change the amount field to 4000000, Confirm.
- Expected: the status re-flags (amount not in the quote) or the planner handles it.
- Actual: status stays "OK", Confirm saves, the Panchayat opens "Chai 40 rupaye ₹40,00,000" with an empty plan table (only "Goal / Today" header), right panel "No goal objects", and nothing to rule on (SH/30-after-big-confirm.png). User can only "Close without ruling".
- Frequency: always

### B-6 · P2 · off-path · Beat 7 · What-if screen copy and number formatting not demo-ready
- Repro: Reset demo, dictate "what if I cut dining by 30%".
- Expected: clean headline, whole-rupee amounts, no jargon.
- Actual: headline is the raw sentence plus an amount: "what if I cut dining by 30% ₹1,435" (lower-case, ambiguous figure); right panel header "No goal objects" (internal jargon) and a large empty column; paise leak in cells: "₹478.33"; the same assumption repeated 3 times (B-3). Plans are labelled "All to Flat / All to Goa / Split across goals" with "dining budget −30% for 12 mo" (fine). No Apply button exists for a what-if (only "Rule"), so "applying" is via the ruling box; I did not try a ruling on it (not crash-tested).
- Evidence: SH/25-whatif-dining.png, SH/25-whatif-dining-1280.png
- Frequency: always

### B-7 · P3 · on-path · Beat 5 · Strip shows paise after imports
- Repro: Reset, import SMS, CSV, PDF. Look at "Spend, Oct 2026".
- Expected: whole rupees like every other figure.
- Actual: "₹1,20,791.50" in the profile strip and Sabha figures can carry paise (also ₹478.33 in B-6).
- Evidence: SH/15-pdf.png
- Frequency: always

### B-8 · P3 · on-path · Beat 5-6 · Stale "Saved 1 entry. Undo any row in the Khata." band stays on other screens
- Repro: Confirm the Rahul rule, then go to Notices, import next month.
- Expected: the band clears once you move on.
- Actual: the band is still on top of Notices and Goals after the simulated month import (SH/21-next-month-full-flow.png).
- Frequency: always

### B-9 · P3 · on-path · Beat 5 · Goa drift notice says "slip 1 month later, to July 2027" when the same import already moved Goa to July
- Repro: Full flow with the Goa ruling applied, then Import next month.
- Expected: the nudge and the condition notice agree on the new date and say what changed from what.
- Actual: ruling notice "Goa moves to July 2027", nudge "I slip 1 month later, to July 2027". Reads as a double-count or a no-op slip. (Without the ruling, nudge says "May 2027", which is consistent.)
- Frequency: always

### B-10 · P3 · off-path · Sabha highlight wording
- "Emi was ₹8,400 more than last month." (category name lower-cased as "Emi"). In the demo run "Rent was ₹30,000 less than last month" is also odd because the earlier Rahul rule retroactively recategorised imported rows as rent (rule shows applied "9x" then "10x"), so last month's rent looks like ₹53,000.
- Evidence: `GET /api/state` review.highlights.

### B-11 · P3 · on-path · Reset control is faint
- "Reset demo" is a small low-contrast link at bottom-right of the dark bar; barely visible on video (SH/07-khata.png). Not a defect for the viewer, but the presenter may miss it.

## Measurements (pressure round)
Not part of this round.
