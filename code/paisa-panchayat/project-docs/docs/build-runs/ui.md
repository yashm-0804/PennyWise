# Build report: ui (build/ui)

2026-10-31 16:13 · Commits: 0a4b5d9, edcac39

Everything below ran against the stub routes, plus a fetch shim for responses the stubs can't produce. **Nothing has run against the real backend.**

Shared by all items:
- Used: Next.js 16.4.3 client components, Tailwind 4 import with hand-written CSS, Rozha One and Mukta through next/font/google.
- Test harness: a headless Chrome driver over CDP, kept in the session scratchpad and not committed. It types with `Input.insertText`, which writes into whichever element has focus, the same way Wispr Flow does.
- Checks at edcac39: `npx vitest run` → 25 passed, 3 files. `npx tsc --noEmit` and `npx eslint` on my files → clean. `npx next build` → succeeded.

## FE-1 Shell · Status: done
- Decisions: the page is a fixed 100dvh column and only the main area scrolls, so the strip, badge and bar never leave the frame. The bar turns deep red and says "Your ruling" while a panchayat is open. Focus returns to the textarea after every action unless the user is in another input. On coarse-pointer devices focus isn't forced, so the phone keyboard doesn't pop up.
- Files: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/components/App.tsx, api.ts, format.ts, ui.tsx, public/icon.svg. Template SVGs removed from public/.
- Verified by: the hero driver read `document.activeElement` on load, at confirm, at panchayat and after apply → `dictation` each time. Cmd+Enter submits through a CDP key event. Page width at 1280×720 and 390×844 → no horizontal overflow on any tab. `format.test.ts` covers ₹1,24,900 and Jun 2027.

## FE-2 Confirm card · Status: done
- Decisions: editing the amount on a blocked row downgrades it to "ask" with the note "Changed by you", because a human has now looked at it. Any remaining blocked row disables Confirm. Undo needs event ids, which /api/confirm doesn't return, so the client compares state.rows before and after. Each Khata row also has its own Undo. On the current stub no new ids appear, so the band says to undo in the Khata instead.
- Files: src/components/ConfirmCard.tsx, flow.ts, flow.test.ts
- Verified by: browser run → Confirm disabled with a blocked row and enabled once it was removed. Typing 7000 sent `amount: 700000` in the POST to /api/confirm. A shimmed new row → "Saved 4 entries. Undo" posted `/api/undo {eventId:"new1"}`.

## FE-3 Panchayat screen · Status: done
- Decisions: the table has goals as rows, then Today, then one column per plan. When a ruling arrives, the right column swaps from voices to the diff, with a "Hear the goals again" link. Apply animates from the preview's diff, in case the apply response recomputes it and finds nothing left to move. After apply the panchayat stops taking rulings and dictation goes back to /api/dictate. This narrows "every dictation goes to /api/ruling while open": applied counts as closed. Months step one at a time on a solid red block, because a fade wouldn't survive compression. A trigger with `hypothetical: false` also shows "Expense recorded. These plans are not."
- Files: src/components/PanchayatScreen.tsx, ui.tsx
- Verified by: hero driver at both desktop sizes → Goa column ticks `Apr 2027, May 2027, Jun 2027`. POST bodies confirmed for dictate, confirm, ruling and apply. Main area scrollHeight equals clientHeight at 1440×900 (655/655) and 1280×720 (491/491). Screenshots read at 1440×900: panchayat, diff, mid-apply. What-if route via shim → convening screen, then POST `/api/panchayat {text, utteranceId}`.

## FE-4 Goals tab · Status: partial
- Decisions: AppState has no price data on goals. The tab reads a price from a Munshi answer this session, or from an optional `goal.price` if the backend adds it. Otherwise it shows the source link and "Live list price not checked yet. Ask Munshi."
- Files: src/components/GoalsTab.tsx
- Verified by: screenshot at 1440×900 after a Munshi answer → ₹99,900 Apple India list price, checked-at, link, 41.5%. The "cached" label is in the code but wasn't exercised. **Partial until the contract change below:** without it, no price shows until Munshi has been asked, and a reload loses it.

## FE-5 Khata tab · Status: done
- Decisions: rows that don't count as spend say why ("Moved to cash", "Owed to you").
- Files: src/components/KhataTab.tsx
- Verified by: screenshot at 1440×900. Toggle → POST `/api/withdrawal {eventId:"e1",treatment:"spend"}`. Undo → POST `/api/undo {eventId:"e1"}`. The toggle's visual change wasn't seen, because stub state never changes.

## FE-6 Munshi tab · Status: done
- Files: src/components/MunshiTab.tsx
- Verified by: screenshot with a refusal over a goal answer → dashed "Modelled scenario, not advice" box, facts, price with link, rules table. POST `/api/munshi {text}` confirmed.

## FE-7 Notices and Sabha tab · Status: done
- Decisions: "Simulated month" shows on data from a next-month run this session, or from a month holding `source: "simulated"` rows. After a reload, notices in a simulated month with no rows could lose the label, so see the contract request below.
- Files: src/components/NoticesTab.tsx
- Verified by: screenshot at 1440×900. POST bodies confirmed for next-month, SMS, CSV (text) and PDF (base64). With shimmed state, the fired notice stepped `Jun 2027, Jul 2027` and the strip showed Simulated month.

## FE-8 States · Status: done
- Decisions: every call goes through one wrapper, so busy, retry and focus behave the same everywhere. Waits show a red line being ruled across the page and an elapsed-seconds counter, and make no progress claims. A failed dictation or ruling puts the text back in the box.
- Files: src/components/ui.tsx, App.tsx
- Verified by: empty state text read on all 5 tabs. A 500 on load → error band and "—" in the strip, and Try again recovered. A 500 on a ruling → text restored, retry cleared the band. Reset → POST /api/reset. Delayed-response runs went through the dictate, convening and ruling waits. Those loading screenshots were captured but not read.

## Integration needed
- next.config.ts: add `devIndicators: false`. **The Next "N" badge covers the start of the Wispr Flow hint in the recording if you record on `next dev`.** The docs say errors still surface.
- src/app/favicon.ico: delete it so public/icon.svg is the tab icon. I don't own that file.
- src/contract/schemas.ts: add `price: PriceCheck.nullable()` to GoalView and fill it in getState. The UI already reads it. This completes FE-4.
- src/contract/schemas.ts: add `simulated: boolean` to Notice, so the label survives a reload. The UI needs a one-line change when this lands.
- /api/confirm: optionally return `eventIds`. The client works without it, by comparing state.
- /api/confirm: must accept rows that were blocked and then edited, which now arrive as `status: "ask"` with the message "Changed by you".
- /api/ruling with apply: true: must still accept the ops sent back from the preview, as specified.
- Optional: `GET /api/panchayat/:id`. Past panchayats can't be reopened today, and a browser refresh closes an open one.

## Blockers
None. One environment trap: after the outage the dev server served a stale stylesheet, and restarting didn't fix it. Deleting `.next` in this worktree and restarting did. Cause unknown. If styles look old after merging, do the same.

## Not verified
- The real backend, and real Wispr Flow or a physical Cmd+Enter.
- Devanagari rendering. Both fonts declare the subset, but I never put Devanagari text on screen.
- Phone: page overflow was measured on all tabs, but only the panchayat screenshot was read. Its plans table scrolls sideways inside its own container.
- The "Test reply" badge shows for `source: "fake"`, which I added beyond the brief. It should disappear on real Gemini replies. If it appears in a take, the app is still in fake mode.

## Suggested items
- Replay the date animation on the Goals tab after "Close, see goals". It currently mounts on the final date.
