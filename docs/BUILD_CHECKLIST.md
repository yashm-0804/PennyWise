# Paisa Panchayat: build checklist

Source of truth for what's built. Item IDs are stable; tests, bugs and the iteration log refer to them.
Mark an item `[x]` only when it is **verified**, not merely written.

Progress: MUST 37/44 · SHOULD 1/8 · Last updated 2026-10-31 18:07 IST by /hack-iterate

Legend: `[slice]` = part of the first thin end-to-end slice · `needs: X-n` = a dependency · (M) MUST · (S) SHOULD

## 0 · Setup and repo

- [x] **SET-1** (M) [slice] Repo, Next.js scaffold with pinned versions (TypeScript 5 or 6, `@types/node` ^24), README stub, `.gitignore`, `.env.example`
  - Used: create-next-app 16.4.3, React 19.3.0 (template pin), TypeScript 5.9.3, @types/node ^24, vitest 5.0.5
  - Decisions: cacheComponents off; .env.example allowed by .gitignore; /data ignored
  - Files: code/paisa-panchayat scaffold, next.config.ts, .env.example, vitest.config.ts
  - Verified by: Scaffold boots; `npx vitest run` passes; `.env.local` confirmed ignored
- [x] **SET-2** (M) [slice] Spike: `node:sqlite` route survives a dev restart; pdfjs legacy build extracts text on the server · needs: SET-1
  - Used: node:sqlite, pdfjs-dist legacy build, serverExternalPackages
  - Decisions: globalThis DB singleton in src/lib/db.ts
  - Files: src/lib/db.ts
  - Verified by: Temporary route returned rows 1 then 2 across a dev restart and read 4 pages of a real PDF; route removed
- [x] **SET-3** (M) [slice] Gemini smoke test: `response_format` on gemini-3.8-flash, gemini-2.5-flash and gemini-2.5-flash-lite; call log · needs: SET-1
  - Used: @google/genai 2.32.0, Interactions API
  - Decisions: Main model gemini-2.5-flash, fallback -lite. gemini-3.8-flash dropped after a 429 (20 requests a day on this free key). One attempt per model, persistent cache, call log at data/llm-calls.log
  - Files: scripts/smoke-gemini.mjs, src/lib/llm.ts
  - Verified by: Smoke test at 16:05: 2.5-flash ok (6.6 s) and 2.5-flash-lite ok (5.4 s) returned correct JSON for a Hinglish line; 3.8-flash 429
- [x] **SET-4** (M) [slice] Contract: zod schemas (items, ruling ops with conditions, plans, fact sheets), fixture JSON for every API response, fake `llm()` mode, DB singleton, stub routes · needs: SET-2, SET-3
  - Used: zod 4 schemas, typed module interfaces, fixtures, stub routes
  - Decisions: Heavy expenses post on ruling, not on confirm; agents take no DB; main owns routes
  - Files: src/contract/*, src/lib/llm.ts, src/app/api/*
  - Verified by: 8/8 contract fixture tests pass; commit 66568e5

## 1 · Database

- [x] **DB-1** (M) [slice] Schema: accounts, events, postings, rules, goals, earmarks, profile, recurring, notices, panchayats, conditions, price_checks, utterances, sim_clock · needs: SET-4
  - Used: core builder (docs/build-runs/)
  - Decisions: fake none; SQLite
  - Files: src/ledger/schema.ts
  - Verified by: ledger tests pass
- [x] **DB-2** (M) [slice] Synthetic seed: 3 months, labelled, goals with dictated reasons, `expected_bonus`, iPhone goal at the reported ₹82,900 · needs: DB-1
  - Used: core builder (docs/build-runs/)
  - Decisions: synthetic only
  - Files: seed/
  - Verified by: golden test on seed passes

## 2 · Backend

- [x] **BE-1** (M) [slice] Ledger: balanced postings, cash wallet, withdrawals as transfers, lent and borrowed per person, card bills, EMI as fixed obligation, undo. All 11 fixtures pass · needs: DB-1
  - Used: core builder (docs/build-runs/)
  - Decisions: spending is only postings to expense accounts
  - Files: src/ledger/post.ts
  - Verified by: all 11 fixtures pass; fixture 10 only flags and both rows count as spend
- [x] **BE-2** (M) User override for how a withdrawal is treated; "not yet explained" cash shown · needs: BE-1
  - Used: core builder (docs/build-runs/)
  - Decisions: override per withdrawal
  - Files: src/ledger/post.ts
  - Verified by: ledger tests pass
- [x] **BE-3** (M) [slice] Profile, goals, earmarks and deterministic date engine, with labelled what-if · needs: BE-1
  - Used: core builder (docs/build-runs/)
  - Decisions: what-if never persists until ruled
  - Files: src/engine/dates.ts, src/ledger/state.ts
  - Verified by: golden test
- [x] **BE-4** (M) [slice] Planner: closed actions, 3 diverse feasible plans, affected goals only · needs: BE-3
  - Used: core builder (docs/build-runs/)
  - Decisions: closed action list, affected goals only
  - Files: src/engine/plans.ts
  - Verified by: golden test: 3 plans for ₹70,000
- [x] **BE-5** (M) [slice] API routes: dictate, confirm, undo, state, reset, panchayat, ruling · needs: BE-4, AI-1
  - Used: main session builder (docs/build-runs/)
  - Decisions: heavy expenses post on ruling; a ruling with no named plan uses the plan that moves that goal
  - Files: src/server/app.ts, src/app/api/*
  - Verified by: scripts/e2e-hero.mjs through a real server at 16:19
- [x] **BE-6** (M) Golden beat test: asserts every number in the storyline · needs: DB-2, BE-4
  - Used: core builder (docs/build-runs/)
  - Decisions: numbers pinned from the engine
  - Files: seed/golden.test.ts
  - Verified by: 407 tests pass
- [x] **BE-7** (M) Ingestion: SMS paste (2 templates), CSV, one synthetic PDF layout, dedupe. API route · needs: BE-1
  - Used: ingest builder (docs/build-runs/)
  - Decisions: 5 SMS templates, 1 CSV layout, 1 PDF layout, password support; real SMS coverage unknown
  - Files: src/ingest, seed/samples
  - Verified by: e2e: SMS 5, CSV 12, PDF 20 added
- [x] **BE-8** (M) Categorization: rules in code first, then Gemini with an allowed category list; narrations as untrusted input · needs: BE-7, AI-1
  - Used: ingest builder (docs/build-runs/)
  - Decisions: rules, dictionary, one model batch; people's UPI stays for review
  - Files: src/ingest
  - Verified by: tests including injection row; real Gemini call not yet run
- [x] **BE-9** (M) Import next month (simulated): recurring detection, price-change and possibly-unused alerts, condition firing. API route · needs: BE-7, AI-5
  - Used: insights builder (docs/build-runs/)
  - Decisions: second run posts nothing
  - Files: src/insights
  - Verified by: e2e at 16:19: rule ran, condition moved Goa to Jul 2027
- [x] **BE-10** (M) Drift nudges as notices from the affected goal · needs: BE-9
  - Used: insights builder (docs/build-runs/)
  - Decisions: notice from the goal hurt most
  - Files: src/insights
  - Verified by: e2e: Notice from Goa with real figures
- [x] **BE-11** (M) Monthly review: numbers in code, prose from Gemini through the validator · needs: BE-9, AI-4
  - Used: insights builder (docs/build-runs/)
  - Decisions: numbers in code, prose through validator
  - Files: src/insights
  - Verified by: e2e in fake mode; real prose not yet run
- [x] **BE-12** (M) Apple India price reader: select by SKU, literal-number check, source URL and checked-at, typed fallback · needs: BE-3
  - Used: insights builder (docs/build-runs/)
  - Decisions: select by SKU name, literal check, stored last value
  - Files: src/insights/price.ts
  - Verified by: e2e: live Apple India fetch returned ₹99,900
- [ ] **BE-13** (S) S3 · EMI principal and interest split · needs: BE-1
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **BE-14** (S) S7 · Split bills, refunds, write-offs · needs: BE-1
  - Used:
  - Decisions:
  - Files:
  - Verified by:

## 3 · AI and agents

- [x] **AI-1** (M) [slice] Router: typed items in Hinglish (Devanagari and Latin), `source_quote`, `amount_text`, `read_as` · needs: SET-4
  - Used: agents builder (docs/build-runs/)
  - Decisions: dictation delimited as data
  - Files: src/agents/router.ts
  - Verified by: real Gemini at 16:11: demo line split into the correct 4 items
- [x] **AI-2** (M) [slice] Five checks, number parser and inherited-unit rule · needs: AI-1
  - Used: agents builder (docs/build-runs/)
  - Decisions: inherited units; a plausible wrong amount can't be caught by code
  - Files: src/agents/checks.ts, numbers.ts
  - Verified by: tests; real Flow text still untested
- [x] **AI-3** (M) [slice] Goal agents: separate calls, separate fact sheets, placeholder prose including quotes · needs: SET-4
  - Used: agents and main session builder (docs/build-runs/)
  - Decisions: separate calls; code picks each goal's angle
  - Files: src/agents/goalAgents.ts
  - Verified by: real Gemini at 16:18: three distinct lines with units
- [x] **AI-4** (M) [slice] Validator: numbers, deny-list, banned social terms; retry then template · needs: SET-4
  - Used: agents builder (docs/build-runs/)
  - Decisions: retry once then template
  - Files: src/agents/validator.ts
  - Verified by: tests
- [x] **AI-5** (M) [slice] Ruling parser: closed ops with conditions, diff, stored as precedent · needs: AI-1
  - Used: agents builder (docs/build-runs/)
  - Decisions: closed ops, questions when ambiguous
  - Files: src/agents/ruling.ts
  - Verified by: real Gemini at 16:11 and 16:18: correct move and condition
- [x] **AI-6** (M) Spoken correction becomes a visible rule, applied to past rows and future imports · needs: AI-1, BE-8
  - Used: main session builder (docs/build-runs/)
  - Decisions: rule scoped to 50–150% of the payee's usual amount
  - Files: src/server/app.ts
  - Verified by: e2e: applied to 3 past payments and fired next month; speech path used fake mode
- [x] **AI-7** (M) Guardrails: 10 Hinglish attack prompts through every output path; refusal then modelled scenario · needs: AI-3, AI-4, AI-8
  - Used: agents and insights builder (docs/build-runs/)
  - Decisions: refusal spends no model call; deny-lists are finite
  - Files: src/agents/safety.ts, src/insights/munshi.ts
  - Verified by: 10 attack prompts in tests; not yet run through real Gemini
- [x] **AI-8** (M) Munshi: goal progress, person balance, month spend; iPhone progress re-based on the live price · needs: AI-1, BE-12
  - Used: insights builder (docs/build-runs/)
  - Decisions: intents detected in code first
  - Files: src/insights/munshi.ts
  - Verified by: e2e: 50% and 41.5% with live price; refusal with scenario
- [x] **AI-9** (S) S1 · Free-form Munshi with function calling · needs: AI-8
  - Used: Gemini through llmJson
  - Decisions: A code-built fact sheet rather than function calling, to spend one call per question; figures not in the sheet are rejected
  - Files: src/insights/askFile.ts, src/components/MunshiChat.tsx
  - Verified by: 3 real Gemini questions at 18:05 on the user's data, 476 tests
- [ ] **AI-10** (S) S2 · Web-search price for other goals, in two calls, with citations · needs: BE-12
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **AI-11** (S) S4 · Spoken-vs-import matching with a "same as this?" question · needs: BE-7
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **AI-12** (S) S5 · Second debate round · needs: AI-3
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **AI-13** (S) S6 · Monthly-budget agents · needs: AI-3
  - Used:
  - Decisions:
  - Files:
  - Verified by:

## 4 · Sponsor integrations

- [ ] **INT-1** (M) [slice] Wispr Flow types correctly into the plain textarea, with the indicator captured by OBS · needs: FE-1
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **INT-2** (M) 20 Flow phrases and 10 rambles saved as fixtures and scored against the targets · needs: AI-2
  - Used:
  - Decisions:
  - Files:
  - Verified by:

## 5 · Frontend

- [x] **FE-1** (M) [slice] Shell: dictation bar, tabs, profile strip, synthetic-data badge · needs: SET-4
  - Used: ui builder (docs/build-runs/)
  - Decisions: plain textarea, no mic
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-2** (M) [slice] Confirm card: quoted phrases, large amounts, "read as", confirm and undo · needs: FE-1
  - Used: ui builder (docs/build-runs/)
  - Decisions: editable amounts
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-3** (M) [slice] Panchayat screen: plans table, voices, what-if label, ruling diff, animated dates · needs: FE-1
  - Used: ui builder (docs/build-runs/)
  - Decisions: table is the authority
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-4** (M) [slice] Goals tab: date bars, progress, price with source · needs: FE-1
  - Used: ui and main session builder (docs/build-runs/)
  - Decisions: price now on goals in state
  - Files: src/components/GoalsTab.tsx
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-5** (M) Khata tab: rows, cash wallet, people, unexplained cash · needs: FE-1
  - Used: ui builder (docs/build-runs/)
  - Decisions: toggle for withdrawals
  - Files: src/components/KhataTab.tsx
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-6** (M) Munshi tab: answers and rules table · needs: FE-1
  - Used: ui builder (docs/build-runs/)
  - Decisions: rules table
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-7** (M) Notices and Sabha tab, import controls, simulated-month label · needs: FE-1
  - Used: ui builder (docs/build-runs/)
  - Decisions: simulated labels
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [x] **FE-8** (M) Empty, loading and error states; video-size type · needs: FE-3
  - Used: ui builder (docs/build-runs/)
  - Decisions: loading looks intentional
  - Files: src/components
  - Verified by: Real Chrome against the real backend in fake mode, round 1 (docs/test-runs/round1.md)
- [ ] **FE-9** (S) Mobile layout polish · needs: FE-8
  - Used:
  - Decisions:
  - Files:
  - Verified by:

## 6 · Deploy and infrastructure

- [x] **DEP-1** (M) Runs locally from a fresh clone: `npm install && npm run seed && npm run dev`. No hosted deployment · needs: BE-5
  - Used: Local run
  - Decisions: No hosted deployment; video-only submission
  - Files: README.md
  - Verified by: Fresh clone, docs/test-runs/6-fresh-clone.md

## 7 · Docs

- [x] **DOC-1** (M) README: what it is, local steps, labelled synthetic and simulated parts, build-by-voice notes · needs: DEP-1
  - Used: README
  - Decisions: Labels synthetic and simulated parts
  - Files: README.md
  - Verified by: Fresh clone; one wording bug open (imports)

## 8 · Submission evidence

- [ ] **EV-1** (M) [slice] Build-by-voice footage running from now, including one bug fixed by voice
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [x] **EV-2** (M) LinkedIn post 1, short and neutral
  - Used: LinkedIn
  - Decisions: Short, neutral first post
  - Files: docs/submission/linkedin-post-1.md
  - Verified by: The user says it's posted, 2026-10-31 16:38
- [ ] **EV-3** (M) LinkedIn post 2: Flow clip, reviewed by 2 readers · needs: EV-1
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **EV-4** (M) ffmpeg installed; subtitles burned into a 10-second test clip by 18:00
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **EV-5** (M) Video: first take by 20:30, submitted by 22:30 · needs: BE-6, EV-4
  - Used:
  - Decisions:
  - Files:
  - Verified by:
- [ ] **EV-6** (M) LinkedIn post 3, then all links and screenshots submitted by 2026-11-01 23:59 IST · needs: EV-5
  - Used:
  - Decisions:
  - Files:
  - Verified by:
