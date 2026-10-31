# Judge review: Paisa Panchayat (Product Space x Wispr Flow hackathon)
2026-10-31 · Rubric: OFFICIAL (as given in prompt) · Blind: yes (no earlier scores read)

Evidence: screenshots 02, 03, 07, 24, 25; src/agents + src/engine file listing; `npx vitest run` = 16 files, 409 tests pass. I did not run the dev server or e2e. No video, LinkedIn posts or build footage exist, so those criteria are scored on absence.

## Scorecard
| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20 | 5 | The app is voice-first (bottom "Dictate" bar, "Speech goes through Wispr Flow", Hinglish utterances like "ATM se 10 hazaar nikale"). But that line is only a label; nothing shows Wispr being used to BUILD it. No footage exists. Capped until the video shows it. |
| Prototype quality and UX | 20 | 7 | Distinctive editorial look, a clear 3-plan what-if table, strikethrough old-to-new dates, Apply ruling, Undo everywhere, cash wallet reconciliation ("3,000 not yet explained"). Polish gaps on screen: red "1 Issue / 4 Issues" dev badge, "Assumption: Assumption:" stutter, the same assumption repeated 3x, raw utterance shown as headline ("what if I cut dining by 30% Rs1,435"), table clipped by the footer bar. |
| AI integration | 20 | 7 | Real structure: per-goal agents that argue ("Your goals speak"), a router, a ruling parser, a validator, numbers/safety checks, and a deterministic engine that does the date maths, so the LLM does not invent numbers. The Munshi refusal is a "Template line" and not a model answer. Real Gemini lines fit the persona. 409 tests are a good sign. The "Test reply" badge shows a fake mode exists. The value of the goal agents is mostly flavour, since the engine already decides the plans. |
| Problem understanding | 15 | 7 | The living-model idea is on target: persistent profile, goals with dates, a what-if before a decision, rule learning ("Rahul = Rent, applied 10x"), a guardrail refusal with a labelled "Modelled scenario, not advice" box. Thin or unverified: PDF/CSV/SMS messy ingestion (the Khata shows "Seed" and "Spoken" rows, no file import seen), subscription detection and unused alerts, the monthly review report, and drift nudges (a Notices tab exists, which I did not see). |
| LinkedIn content and engagement | 15 | 2 | Nothing exists. |
| Innovation and creativity | 10 | 8 | The "Panchayat" metaphor, where goals argue and the user rules by voice, is memorable and culturally fitting. It is much better than the typical budgeting chatbot. |
| **Weighted** | 100 | **59.5** | 1.0 + 1.4 + 1.4 + 1.05 + 0.3 + 0.8 = 5.95 /10 |

## What would raise the score
1. Record a video that opens with the Wispr Flow BUILD: show dictating the spec into the AI builder, a fix by voice, and the Wispr hotkey filling the in-app box on camera → Wispr usage, +3 to +4 points of the 20 (about +3 weighted /100 per point of 10), about 2 h.
2. Publish 3 to 4 LinkedIn posts (build log with a screen recording, the Panchayat demo clip, a refusal clip), tag Wispr and Product Space, and ask for comments → LinkedIn, +4 to +6 of 15, about 2 h.
3. Fix the visible polish: hide the dev overlay badge (run a production build), dedupe the "Assumption:" lines, make the what-if headline a clean title, stop the footer clipping the table → Prototype, +1 to +1.5 of 20, about 1 h.
4. Show the required items that look thin on camera: a real CSV/PDF/SMS paste with messy categorization, a subscription price hike or unused alert, and the monthly review report. Say plainly which ones are partial → Problem and Prototype, +1.5 of 15 and +1 of 20, about 3 h.
5. Make the AI part clearly load-bearing in the demo: show the router and validator catching a bad number or a securities request, and use a non-template model reply for the fund question → AI, +1 of 20, about 1 h.

## Red flags
- No video, LinkedIn posts or build footage, so 35% of the rubric (Wispr usage and LinkedIn) is unproven.
- "Test reply" badges and the "Synthetic data" tag are visible in the test run. The real video must be recorded in real Gemini mode, and the synthetic data should be said plainly.
- The securities refusal is a template line, not an AI response. It is correct behaviour, but a judge may call it canned.
- The Khata shows "Seed" rows. The messy PDF/CSV/SMS ingestion is not visible in the screenshots I read, so I could not confirm it.
- The "Simulated month" flag on the next-month flow means the time progression is staged. Label it.
- Spoken-input screenshots show typed text. Wispr Flow is a system dictation tool, so the app cannot prove voice was used. Only the video can.
- I did not run the app live, so I could not check anything off the happy path.

## How it compares
Against a typical submission (a chat wrapper over a CSV with category pie charts), this is clearly better: a real engine, tests, a guardrail and a distinct concept. Against a likely winner, it falls short on the two things the rubric rewards most visibly. A winner shows Wispr Flow dictation through the whole build on camera, has several LinkedIn posts with real engagement, and covers the whole problem-statement checklist visibly. This one is a strong finalist on product and idea, but on current evidence about 60/100. With the video and posts done well, it could reach about 75 to 80.
