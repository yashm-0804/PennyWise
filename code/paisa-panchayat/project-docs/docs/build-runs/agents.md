# Build report: agents (build/agents)

2026-10-31 16:09 · Commits: 9a7317a

**Tested:** everything below ran against fakes or a scripted stand-in for the model. No real Gemini call was made, so the real prompts have never been run. Contract changes: none.

Full run: `npx vitest run` → 5 files, 253 tests passed (245 in `src/agents`, 8 existing). `npx eslint src/agents` is clean. `npx tsc --noEmit` reports nothing in `src/agents`; its one error is in `src/app/layout.tsx` (`LayoutProps`), a file I didn't touch.

## AI-1 Router · Status: done (fake only)
- Used: `llmJson`, zod `RouterResult`.
- Decisions:
  - The dictation and context go in the input inside delimiters. Angle brackets in them are neutralized, so the text can't close its tag.
  - Code adds an `investment_ask` item if the model misses one.
  - If every model fails, the text comes back as one `unknown` item with source `template`. Empty text makes no call.
  - The fake is a small rule set labelled MOCK, not a canned lookup.
  - A what-if percent stays in `amount_text` ("30%"), and `amount_rupees` stays null, because the contract has no percent field.
- Files: `src/agents/router.ts`, `src/agents/text.ts`
- Verified by: `npx vitest run src/agents` → demo line gives 4 items; laptop gives 1 expense of ₹70,000; what-if; the real iPhone sentence gives one `goal_progress` question with `read_as` "hired → hiked"; Rahul correction.

## AI-2 Checks and number parser · Status: done
- Used: own parser in `numbers.ts`.
- Decisions:
  - **The quote must really be in the dictation.** Otherwise an invented quote containing the amount would pass, so a quote that wasn't said is blocked.
  - **Inherited units come only from the nearest earlier unit.** A later or farther unit is blocked.
  - **Bare ₹5 misread:** code keeps ₹5 and asks "₹5 ya ₹5,000?". It doesn't rewrite the amount, because "chai pe 20" after "10 hazaar" really is ₹20. A bare number under ₹100 with no earlier unit also asks.
  - **Cash and debts run across the dictation,** so the demo line doesn't raise a false negative-cash question from a zero balance.
  - Ordinary words ("ek", "do", "saath", "tera", "one", "panch") count as numbers only before a unit.
  - Questions are written in the speaker's language: Devanagari, Hinglish or English.
- Files: `src/agents/checks.ts`, `src/agents/numbers.ts`
- Verified by: `npx vitest run src/agents` → 37 number forms, 15 phrases that must yield no amount, and each check. The iPhone sentence yields no false amount; its "एक" and "last month" are ignored.
- **A plausible wrong amount can't be caught by code.** If speech-to-text hears "15 hazaar" for "50 hazaar", the amount is in the text and passes all checks. Only the person reading the confirm card can catch it, and the pitch should say so.
- Check 5, undo, belongs to the ledger.

## AI-3 Goal agents · Status: done (fake and scripted model)
- Used: `llmJson`, `AgentReply`.
- Decisions:
  - One call per sheet in parallel, capped at 3 in code. Each prompt holds only its own sheet.
  - Unknown or missing stances are repaired in code, so they don't cost a retry.
  - The prompt has good and bad example lines, to pass first time.
  - Added a `{goal_name}` placeholder, so a name like "iPhone 17" doesn't fail the digit check.
  - A quote that trips the safety scan is never sent to the model or shown.
- Files: `src/agents/goalAgents.ts`, `src/agents/retry.ts`
- Verified by: `npx vitest run src/agents` → all 3 calls start before any answers; inputs don't contain other goals' quotes; the fake's lines differ per goal; one failing goal falls back alone.

## AI-4 validateLine and fillPlaceholders · Status: done
- Decisions:
  - **Stricter than asked:** "ek" and "do" are allowed, except before a unit or time word, so "do mahine" and "ek saal" are rejected. They are numbers the model wrote itself.
  - **Allowed on purpose:** "Emergency Fund" isn't a fund name, and "jaati hai" is the ordinary verb "goes".
  - **Rejected on purpose:** lower-case "sip lo" is rejected even though it could mean a sip of chai. Safety wins, and a goal line won't need it.
  - Substitution is single-pass, so values can't inject placeholders. `{constructor}` is treated as unknown.
  - After a rejection, the retry input names the reasons, so `LLM_CACHE` can't return the same bad answer.
- Files: `src/agents/validator.ts`, `src/agents/safety.ts`
- Verified by: `npx vitest run src/agents` → 7 accepted lines, 35 rejected lines with the expected reason, and the 13 and 14-word boundary.

## AI-5 parseRuling · Status: done (fake and scripted model)
- Decisions:
  - Code rechecks all output: goal and plan ids must exist, the goal must have been named in the ruling (skipped when the ruling has any Devanagari, because names are stored in Latin), the month must have been said, and the amount and quote must be in the text.
  - Code also recomputes the year unless one was said: the first such month on or after the goal's current month. A month with no year can't be moved earlier than that.
  - "under 50" with no unit anywhere becomes a question, not ₹50,000. **The demo script must say "50 thousand", as PLAN.md does.** The skeptic's "under 50" variant asks a question.
- Files: `src/agents/ruling.ts`
- Verified by: `npx vitest run src/agents` → the demo ruling gives `move_goal` 2027-06 plus `add_condition` (lt, 5000000 paise, then 2027-07); a second ruling gives `choose_plan`, `move_goal`, `hold_goal`; Devanagari and inherited units work; 7 ambiguous rulings ask instead of guessing; invented model ops are dropped.

## AI-7 Guardrails · Status: done
- Decisions:
  - `guardrailCheck` needs an ask, so logging isn't refused: "SIP ki 5000 kat gayi", "HDFC card ka bill", "Reliance Digital se TV liya", "Emergency Fund kitna hai".
  - `writeProse` uses the same placeholder rule as goal lines, so facts are filled in by code. Unsafe fact values are never offered to the model.
  - If the caller's fallback is itself unsafe, a fixed safe line replaces it.
- Files: `src/agents/safety.ts`, `src/agents/prose.ts`, `src/agents/index.ts`
- Verified by: `npx vitest run src/agents` → 11 attacks in Hinglish, English and Devanagari, including a hidden instruction and a mid-ramble ask, each run against `guardrailCheck`, `routeUtterance`, `checkItems`, `validateLine`, `fillPlaceholders`, `runGoalAgents`, `parseRuling` and `writeProse`, with both a fake and an obedient model. 12 false-positive cases aren't refused.

## Not verified
- **Real Gemini behaviour.** All prompts are unrun, so the first-pass validator rate and the "8 of 10 rambles" kill criterion are unmeasured. Passing tests show the fake and code checks work, not that the model will.
- **Gemini may reject the ruling schema.** `toApiSchema(RulingParse)` contains `oneOf` and `const`, and `RouterResult` contains `anyOf`. I don't know whether these models accept them. If rejected, `llmJson` throws after trying the whole chain, and `parseRuling` only returns a question, which breaks beat 2. **Spend one real call on `parseRuling` before recording.**
- **Deny-lists are finite.** A ticker or fund house not on the list gets through. They catch common names, not all of them.

## Call budget
Each role makes one call. There is no batching, because each role has one input and goal agents must stay separate.

| Step | Calls | Note |
|---|---|---|
| Each dictation (`routeUtterance`) | 1 | Beat 1, beat 3 and the correction: 3 |
| Panchayat (`runGoalAgents`) | up to 3 | |
| Ruling (`parseRuling`) | 1 | |
| Munshi and review (`writeProse`) | 1 each | 2 |
| **Demo total** | **about 9** | Add 1 for each extra dictation or second ruling |

Each validator retry adds 1, and goal lines and prose are the only retried calls. A failing model in the chain also makes an attempt, though `generateChecked` doesn't retry after a throw.

## Integration needed
- `src/insights` `answerMunshi` and `src/app/api/munshi/route.ts`: call `guardrailCheck(text)` before any model call. Refusing in code spends no call.
- `src/app/api/dictate/route.ts`: `investment_ask` items are `block`, and other items in the same ramble keep their own status. Use the `refusal` route only if the items are all `investment_ask`; otherwise show the refusal beside the entries.
- Dictate route: `checkItems` context is in **paise**, both `categoryMedians` and `people`.
- What-if trigger: read the percent from `amount_text` ("30%"), because `Trigger.amount` is paise and `amount_rupees` is null there.
- `src/engine` `buildFactSheets`: give each sheet placeholders with display values, such as `{flat_delay_months: "4 months"}`. The fake and template pick a name containing `delay`, `month` or `mahin` first. Quotes go in `reasonQuote` and `precedentQuote`.
- `src/insights`: pass display values in `writeProse` facts. Any label works as a key, and non-identifier labels become `fact_1` and so on.
- `src/ledger` `applyItem`: the fake's EMI item has payee "EMI", not the fixture's "Bike EMI". The router has no EMI names in its context, so match on type if needed.
- Confirm card UI: allow editing the amount on an `ask` item, since a bare "₹5 ya ₹5,000?" keeps ₹5 until the user changes it.
- API routes: named exports are in `src/agents/index.ts`, plus `agents: AgentsModule` as a compile-time check and `parseAmount` and `parseAmounts`.

## Blockers
None.

## Suggested items
- One real-call smoke test of `parseRuling` and of one goal agent before recording, to settle the schema risk and the first-pass rate.
