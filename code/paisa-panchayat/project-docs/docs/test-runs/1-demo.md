# Test run: 1 (demo, real browser)

2026-10-31 · App: http://localhost:3102 (`DB_PATH=./data/round1.db LLM_MODE=fake`, Next dev) · Repo state: uncommitted (no git) · Chrome headless 1440x900, puppeteer-core

Server was stopped by PID at the end (it was restarted once per run for beat 6; each restart used the same command).

## Coverage
- ✓ Full path (beats 1-6) walked 3 times, Reset demo clicked at the start of each run. All per-beat page text dumps (timestamps normalised) are byte-identical across runs 1, 2 and 3. No flakes. Console clean (0 errors or warnings) in all runs.
- ✓ Beat 1: confirm card (laptop 70,000), Panchayat opens with Plans A/B/C, 3 goal voices (Goa, Flat, Emergency Fund, each "Test reply"), "What-if: nothing saved yet", profile strip.
- ✓ Beat 2: diff Goa Apr 2027 to Jun 2027, Flat Feb 2029 to Aug 2029, "If bonus under ₹50,000: Goa to Jul 2027". After apply, Goals tab agrees (Goa Jun 2027, Flat Aug 2029).
- ✓ Beat 3: 4 quoted rows; no "already in this month's khata" warning; spend rose by exactly 13,400 (5,000 plumber + 8,400 EMI; ATM 10,000 is "Moved to cash", counted once); Cash wallet ₹3,000 "₹3,000 not yet explained"; "Rohit owes you ₹2,000".
- ✓ Beat 4: 50% at ₹82,900; 41.5% at ₹99,900; "Apple India list price", "checked 31 Oct, 5:08 pm", apple.com link; no doubled text.
- ✓ Beat 5: SMS, CSV, PDF imports; focus returns to the dictation box after each (verified with real mouse clicks and the file chooser); rule "Rahul → Rent" with "Because you said"; Next month: rule ran, Hotstar ₹299 to ₹399 alert, Cult Gym possibly unused alert still present, drift nudge, condition moves Goa to July, "Simulated month" labels.
- ✓ Beat 6: after a real server restart, Nov rows, rule (10x applied), alerts, Sabha review and past ruling all persisted. "kaunsa mutual fund lun" gives "Won't name a security" plus a "MODELLED SCENARIO, NOT ADVICE" box, illustration once. "Gold mein paisa daalu" is refused with the same template. A fresh laptop dictation shows goals citing the past ruling ("Pichli baar tumne kaha tha ...") and it is listed under "Past rulings, your precedent".
- ✓ Fixes confirmed, once each (details below).
- ✗ See bugs D-1 to D-5.

## Confirmed fixes (browser)
- ✓ Reset, laptop, rule, apply, undo the Laptop row in Khata: Goals text (Goa, Flat, earmarks) and the Spend strip are identical to seed; Panchayat tab still works; a fresh laptop dictation rules again with Goa Today = Apr 2027.
- ✓ "what if I cut dining by 30%": headline "Cut dining by 30%, a month ₹1,435"; whole rupees; no "No goal objects"; plans show earlier dates (Flat Feb 2029 to Nov 2028, -3 mo). "Plan A" gives a button "Note this decision"; after pressing: "Noted. A what-if moves no money."; Goals unchanged; `getAnimations()` count 0.
- ✓ Assumption chips: no "Assumption: Assumption:", no duplicates, no Next.js Issues badge, no React key error in console.
- ✓ Rules table Undo removes the rule and restores the Rahul row category (Other).
- ✓ Clicking a tab clears the "Saved" band. "asdf qwerty" shows "Not understood" / Blocked, Confirm disabled. No paise in any tab (only in verbatim quoted SMS source text, see D-5).
- ✓ Double-click on Confirm sends exactly one POST /api/confirm and writes one row.

## Bugs
### D-1 · P2 · on-path · Beat 2 hero · Assumption chips clipped by the dictation bar at the hero moment
- Repro: Reset demo; dictate the laptop line; Confirm; look at Panchayat at 1440x900.
- Expected: the plan table and its assumptions are visible, or visibly scrollable.
- Actual: the 4 plan rows fit, but the assumption chips (5 of them) sit under the dictation bar and show as a half-cut single line ("Assumption: only this month's surplus of ₹4,152 is used" cut mid-letter). Main region is scrollable (scrollHeight 750 vs clientHeight 655) but there is no scroll cue. The ruling-diff screen (03) has the same clip. The what-if screen (11) fits.
- Evidence: shots2/02-panchayat.png, shots2/03-ruling-diff.png. DOM check: overlap with bar top 783px.
- Frequency: always (3/3 runs).

### D-2 · P2 · on-path · Beat 5 · Goa's July date said twice in the condition-fired notice
- Repro: after beat 2 and the imports, press "Import next month (simulated)".
- Expected: no date said twice (per the brief).
- Actual: notice reads "Bonus was ₹42,000, under ₹50,000, so Goa moves to July 2027." with a big "Jul 2027" badge beside it. The kicker "YOUR RULING APPLIED" and the title "Your ruling applied" are also the same words twice.
- Evidence: shots2/08-next-month.png.
- Frequency: always (3/3).

### D-3 · P3 · on-path · Beat 5 · Alert title repeated in body
- Repro: same as D-2; look at the Cult Gym notice.
- Expected: body adds information.
- Actual: title "Cult Gym: possibly unused", body "Cult Gym: possibly unused. No related activity found. Still using it?" (title restated). Same shape in "RULE APPLIED / Your rule ran / Rahul → rent: ...".
- Evidence: shots2/08-next-month.png.
- Frequency: always.

### D-4 · P3 · off-path · Stale import result after the next-month import
- Repro: import PDF/CSV, add the Rahul rule, press Import next month, look at the "Bring in statements" panel.
- Expected: result panel cleared or refreshed.
- Actual: it shows "20 added · 0 duplicates skipped · NEEDS A LOOK: UPI/…/rahul.k@okaxis/Rahul K ₹5,000 (x3)" although the Rahul rule has already filed those rows under Rent. After the restart the panel is empty, so this is only in-session state.
- Evidence: /private/tmp/claude-501/walk/run1/b5next.txt (text), end of the notices column.
- Frequency: always.

### D-5 · P3 · off-path · Paise visible inside quoted SMS text
- Repro: paste seed/samples/sms.txt; read the "Needs a look" and "Couldn't read" lists.
- Expected: "Amounts show no paise" (arguably applies only to formatted amounts).
- Actual: raw message text keeps "Rs.5,000.00", "Rs.12,000.00". The app's own amounts show no paise. Reporting for the call: probably fine since it is a verbatim quote.
- Evidence: shots2/07-imports-sms.png.
- Frequency: always.

### D-6 · P3 · off-path · "Close, see goals" after a noted what-if suggests change
- Repro: what-if "cut dining by 30%", rule "Plan A", press "Note this decision".
- Expected: nothing implying Goals moved.
- Actual: right panel shows "DECISION NOTED, Flat Nov 2028 -3 mo" plus a "Close, see goals" button, but Goals still shows Feb 2029 (correct per "moves no money"). Could confuse a viewer.
- Evidence: shots2/12-whatif-noted.png.
- Frequency: always.

### Observations (not filed as bugs)
- Fake-mode "Emergency fund" in the strip goes ₹2,40,000 to ₹2,45,000 after the simulated month and Surplus stays ₹4,152 after the laptop is applied (Spend jumps ₹45,367 to ₹1,15,367). Probably intended in this model; confirm against the golden test.
- Goal voices in the precedent run (Goa, Flat, Emergency Fund) all repeat the identical past-ruling sentence in fake mode. Expected in a test reply, but it reads as copy-paste on screen.

## Timings (fake mode, dev server, same in all 3 runs, +-30 ms)
| Beat | On screen after action |
|---|---|
| 1 dictate to confirm card | 0.50 s |
| 1 confirm to Panchayat | 0.10 s |
| 2 ruling to diff | 0.40 s |
| 2 apply to "Ruling saved" | 0.10 s, then the date-count animation runs about 2.4 s more |
| 3 confirm card | 0.57 s |
| 4 Munshi answer | 0.72 s |
| 5 SMS / CSV / PDF import | 0.11 / 0.32 / 0.31-0.51 s |
| 5 Import next month | 0.12 s |
| 6 refusal | under 1 s |

## Hero moment at 1440x900
- Beat 1 Panchayat: banner, plan table (4 goal rows), voices all in view with no scroll, except the assumption chips (D-1). Bottom plan row (iPhone 17) is fully visible, not clipped. Ruling-diff screen: Apply ruling button and condition line visible, no scroll.
- Best hero shots: shots2/03-ruling-diff.png, shots2/08-next-month.png, shots2/12-whatif-noted.png (also 10-refusal.png and 06-munshi.png).

## Screenshots
/Users/yashmehta/Desktop/projects/Product Space AI Agnetic Hackathon/docs/test-runs/shots2/ : 01-confirm, 02-panchayat, 03-ruling-diff, 04-goals-after, 05-khata, 06-munshi, 07-imports, 08-next-month, 09-restart, 10-refusal, 11-whatif, 12-whatif-noted. Also extras: b2-applied, b3-confirm, b3-after, b5-rule-*, b6-precedent, f1-after-undo, 07-imports-sms. err-A1.png is a stale failure shot from my own script (focus false alarm), ignore it.

## Measurements (pressure round)
n/a (demo round).
