# Test run: 3 · pressure

2026-10-31 · App: http://localhost:3104 (fake LLM) and http://localhost:3107 (LLM_MODE=real, GEMINI_API_KEY=invalid) · Repo state: 46db7a1 (clean working tree)

Setup note: Next 16 allows only one `next dev` per directory ("Another next dev server is already running"). The 3107 bad-key server ran in the repo. The 3104 fake server ran from a scratch copy of the repo (same source, own DB and llm-cache). Scripts are in `/private/tmp/claude-501/-Users-yashmehta-Desktop-projects-Product-Space-AI-Agnetic-Hackathon/d01e0d97-34f6-4c84-85a2-1472383f42b7/scratchpad/` (t1.mjs to t7c.mjs). Both servers were stopped by PID afterwards. No real Gemini calls were made.
Side effects in the repo: the 3107 run appended about 15 error lines to `data/llm-calls.log` and created `data/badkey.db` (+wal/shm). Nothing was deleted or edited.

## Coverage
- ✓ scripts/e2e-hero.mjs ran clean against 3104 (all beats; a second next-month adds no rows; imports work).
- ✓ Malformed input: 8 POST routes x 16 bodies + 3 raw-bad payloads (168 calls). State (rows, spend, cash) was checked after every call: 0 changes from any failed call. Emoji, Devanagari, RTL, null byte and 100 KB text are accepted and survive. ₹0, NaN and Infinity give a "That wasn't clear" block row and nothing is saved. Unknown eventId gives a readable "No event nope".
- ✓ Money is not double-counted on: ruling apply twice (second is a no-op), undo twice (second is a no-op), next-month twice or x10 concurrently (month advances once), reset concurrent with confirms (final state is the clean seed).
- ✓ Concurrency: 50 parallel dictate + 50 state gave 0 errors. 20 parallel confirms gave an exact total (delta 2,100,000 paise = expected) and no "database is locked". 10 parallel next-month gave the same final state as one run.
- ✓ After kill -9: `PRAGMA integrity_check` = ok, foreign_key_check = 0, 0 unbalanced events. llm-cache.json parses. A truncated llm-cache.json (300 bytes, simulating a kill mid-write) is tolerated: dictate, munshi and next-month all still answered.
- ✓ Dead AI: no stack, key or raw provider text reached the client. Every call failed fast (0.47 to 1.05 s). A failed ruling preview leaves state unchanged.
- ✓ Imports: empty, binary-as-PDF, wrong password, no password and invalid base64 all give a readable one-line "unparsed" reason with 200 and no state change. Importing the same csv, sms and pdf 3 times adds 0 after run 1. A 5000-row CSV re-import gives 5000 dupes, 0 added.
- ✗ P-1 to P-8 below.
- – Browser/UI behaviour (double click, retry button) was not exercised; reasoned from source only.
- – Locked-PDF success path: password unknown, so only no-password and wrong-password were tested.
- – Heavy confirm and ruling under the dead key: dictate returns `unknown` there (P-2), so I forged a heavy expense item to reach the panchayat and ruling on 3107.

## Bugs

### P-1 · P2 · on-path · confirm is not idempotent (utteranceId ignored)
- Repro:
  1. POST /api/dictate {"text":"chai 500 rupaye"}
  2. POST /api/confirm {utteranceId, items} twice with the same body.
  3. GET /api/state
- Expected: second call is a no-op or rejected (same utterance).
- Actual: ₹500 is posted twice. Spend 4,536,700 -> 4,586,700 -> 4,636,700 paise, `errors` is []. A double heavy confirm also convenes 2 panchayats (ids c95c95e7..., 801af207...). `ConfirmRequest` requires `utteranceId` but `confirm()` never reads it.
- Evidence: t2.mjs "2a" and "2b". UI mitigation: ConfirmCard swaps to a saving view while `busy.kind==="confirm"`, so a double click is probably blocked. But `run()`'s failure `retry` re-sends the same confirm, so a refresh failure after a successful post could double-post (not exercised in a browser).
- Frequency: always at API level.

### P-2 · P2 · on-path · With a dead AI, dictation of every demo phrase becomes "That wasn't clear", and nothing says the AI is down
- Repro:
  1. Start with GEMINI_API_KEY=invalid LLM_MODE=real (3107).
  2. POST /api/dictate for "chai 500 rupaye", "Laptop died, new one is 70 thousand...", and the ATM/plumber/Rohit/EMI ramble.
  3. POST /api/panchayat {"text":"what if I cut dining by 30%"}
- Expected: per plan, a template line or a clear "AI is unavailable, try again or type the amount" message.
- Actual: all three dictations return `llm_source:"template"`, one item `type:"unknown" status:"block"`, and the message "That wasn't clear. Could you say it again?". The user is told to repeat themselves. The what-if returns HTTP 500 {"error":"That didn't read as a what-if. Try: what if I cut dining by 30%?"}. Beats 1, 3 and 5 are unreachable without a working key (or a cache hit). Munshi, ruling voices, next-month review and imports do degrade to templates (voices "Tumne kaha tha ... Yeh plan dhyan se"; munshi source "template"; csv categorisation falls back to needs-review, 7 instead of 4).
- Evidence: t5.mjs and t5b.mjs on 3107. Time to fail: dictate 471-768 ms, what-if 489-614 ms. llm-calls.log shows `BadRequestError: 400` per call.
- Frequency: always.

### P-3 · P2 · off-path · A next-month run killed after DB commit, then re-run, duplicates the notices
- Repro:
  1. Reset, confirm 500 small rows (DB has 564 rows).
  2. POST /api/next-month and kill -9 the server about 3 ms later; restart on the same DB.
  3. State is already 2026-11 with 582 rows and 3 notices. POST /api/next-month again.
- Expected: no change (the clean-run result: 3 notices).
- Actual: rows stay at 582 (deduped), but notices go from 3 to 6 (drift, price_change, possibly_unused each twice). Seen in 2 of 3 runs in t6c and 3 of 6 in t6b; the runs where the client got a 200 did not duplicate. Separately, in 1 of about 10 kill attempts the restart showed 574 rows with simMonth still 2026-10 (10 next-month rows posted, month not advanced; the re-run converged to 582 rows).
- Evidence: t6.mjs, t6b.mjs, t6c.mjs: `rerun ... notices[ drift,price_change,possibly_unused,drift,price_change,possibly_unused ]`.
- Frequency: about 50% of kill-at-commit attempts. A clean demo restart is not affected, so low demo risk.

### P-4 · P3 · off-path · A confirm batch is not atomic; kill mid-batch then re-run double-posts the first part
- Repro:
  1. POST /api/confirm with 3000 expense items. Kill -9 the server after 1.5 s.
  2. Restart and count the rows.
  3. Re-send the same confirm.
- Expected: all or nothing (or a re-run skips what is already there).
- Actual: 872 of 3000 were posted (each item has its own savepoint, with no outer one). The re-run gives 3872 rows, so 872 duplicates. Integrity check ok, ledger balanced. Real confirms have under 10 items, so this is theoretical.
- Evidence: t6.mjs: `kill rows posted 872 of 3000`, `re-run: kill rows 3872`.
- Frequency: always, if killed mid-batch.

### P-5 · P3 · off-path · Validation errors return HTTP 500 with raw zod JSON; malformed JSON returns internals
- Repro:
  1. POST /api/import {} (or {"kind":"x"}), or /api/confirm with a bad item (amount 1e22).
  2. POST /api/dictate with body `null`, and with `{bad json`.
- Expected: 400 with a one-line message.
- Actual: status 500 and a body like {"error":"[\n  {\n    \"code\": \"invalid_value\",\n    \"values\": [\n      \"sms\",..."}. For `null`: "Cannot destructure property 'text' of '(intermediate value)' as it is null." For bad JSON: "Expected property name or '}' in JSON at position 1 (line 1 column 2)". Unknown event and panchayat ids are 500 "No event nope" (readable, wrong status). 133 of 168 malformed calls were 500. State was never corrupted.
- Evidence: t1.mjs, t1.out. The UI always sends well-formed bodies, so only a server-side bug would show this in the error banner.
- Frequency: always.

### P-6 · P3 · off-path · Large dictation crashes with an internal error string
- Repro: POST /api/dictate {"text":"x" repeated 5,242,880 times}.
- Expected: a "text too long" error (100 KB works fine).
- Actual: 500 {"error":"Maximum call stack size exceeded"} in 335 ms.
- Frequency: always.

### P-7 · P3 · off-path · The ruling API applies an empty ruling, which posts the expense and closes the panchayat
- Repro:
  1. On 3107 (dead AI), confirm a forged heavy expense item and take the panchayat id.
  2. POST /api/ruling {panchayatId, text:"Goa moves to June...", apply:true} with no ops. The AI parse yields ops [].
- Expected: reject, or ask a question, when there are no ops.
- Actual: 200 `applied:true`, a rulingId is created, ₹70,000 is posted (spend 4,536,700 -> 11,536,700), and no plan is chosen. The UI is guarded by `canApply = res.ops.length > 0`, so this needs a direct API call.
- Evidence: t5b.mjs.
- Frequency: always at API level.

### P-8 · P3 · off-path · Amount sign and "ask" rows are handled silently
- Repro:
  1. Dictate "-5000 rupaye chai", then confirm.
  2. Confirm a forged item with amount -300000 and status "ok".
  3. Dictate "chai 9999999999 rupaye" (status "ask"), then confirm.
- Expected: a negative is refused or treated as a refund. An unresolved "ask" row says it was skipped.
- Actual: case 1 posts a +₹5,000 expense (sign dropped); case 2 posts +₹3,000 (abs); case 3 returns 200, errors [], nothing saved, no message. `chai 99999999999999999999 rupaye` gives amount 1e22 in the dictate response and a 500 (zod too_big) on confirm. The ledger is not corrupted.
- Evidence: t1b.mjs, t2b.mjs.
- Frequency: always.

## Measurements (pressure round)
| Scenario | Requests | Concurrency | p50 | p95 | Errors |
|---|---|---|---|---|---|
| GET /api/state, fresh seed (16 KB) | 100 | 10 | 8 ms | 20 ms | 0 |
| GET /api/state, after sms+csv+pdf samples (101 rows, 26 KB) | 100 | 10 | 8 ms | 14 ms | 0 |
| GET /api/state, +2,000 rows via 40 x confirm (2,101 rows, 495 KB) | 100 | 10 | 57 ms | 97 ms | 0 |
| same, serial | 30 | 1 | 11 ms | 12 ms | 0 |
| 50 POST /api/dictate + 50 GET /api/state | 100 | 100 | dictate 129 ms; state 63 ms | dictate 159 ms; state 90 ms | 0 |
| 20 distinct confirms (exact total check) | 20 | 20 | wall 37 ms | 34 ms | 0, total exact |
| next-month | 10 | 10 | wall 19 ms | n/a | 0, month advanced once |
| 2,000 rows via confirm, 50 items per call | 40 | 1 | 206 ms per batch (8.25 s total) | n/a | 0 |
| POST /api/import csv 5,000 rows (2.1 MB response, all in needsReview) | 1 | 1 | 1,391 ms | n/a | 0 |
| same csv again | 1 | 1 | 263 ms (5000 dupes, 0 added) | n/a | 0 |
| GET /api/state after the 5,000-row csv (1.25 MB) | 1 | 1 | 26 ms | n/a | 0 |
| POST /api/import sms 1 MB (8,145 msgs, 5 MB response) | 1 | 1 | 4,365 ms | n/a | 0 |
| GET /api/state after that (8,209 rows, 2.8 MB) | 20 | 1 | 38 ms | 46 ms | 0 |
| Dead AI (3107): dictate / heavy confirm / ruling preview / apply / munshi / next-month / import csv / import sms | 1 each | 1 | 0.47-0.77 s / 0.96 s / 0.50 s / 0.47 s / 0.55-1.05 s / 0.99 s / 0.52 s / 0.05 s | n/a | 0 hangs, 0 leaked keys or stacks; what-if returns 500 (P-2) |

The state payload grows linearly (about 0.23 KB per row). At demo scale (about 100 rows, 26 KB) it is not a concern. Rendering a 2,000-row ledger in the browser was not tested.

## What held up
Ledger integrity under load and kill -9, no lock contention at 20-way concurrency, idempotent next-month, undo, ruling apply and import, a corrupt llm-cache tolerated, and every failed import reported readably.
