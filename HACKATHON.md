# Agentic AI Hackathon (Product Space × Wispr Flow): tracker

Last updated: 2026-10-31 22:48 IST by /hack-iterate

## Event

| Field | Value | Source |
|---|---|---|
| Hackathon | Agentic AI Hackathon ("AI Hackathon for Product Managers"), one-day event | https://theproductspace.in/ai-hackathon-details |
| Organiser / sponsor | Product Space, in collaboration with Wispr Flow | https://theproductspace.in/ai-hackathon-details |
| Format | One day. Fixed problem statements (pick 1 of 5). Venue and team size: UNKNOWN (kickoff is an online live class link; the page does not state team size) | https://theproductspace.in/ai-hackathon-details |
| Tracks | 01 Content repurposing studio · 02 Adaptive exam-prep tutor · 03 Meeting-to-execution agent · 04 Personal finance coach · 05 Career pivot coach | https://theproductspace.in/ai-hackathon-details/problem-statement |
| Our track / problem statement | 04 Personal finance coach with a living money model. Product: PennyWise (was Paisa Panchayat), with Ledger (was Khata), Buggy (was Munshi), Huddle (was Panchayat) and Nudges (was Alerts) | research/problem-statement-04-screenshot.png, docs/IDEAS.md |
| Submission deadline | 2026-10-31 23:59 IST | https://theproductspace.in/ai-hackathon-details |
| Other dates | Kickoff 2026-10-31 12:30 IST (mandatory) · LinkedIn streak submission 2026-11-01 23:59 IST · Demo Day: to be announced · Winners: to be announced | https://theproductspace.in/ai-hackathon-details |
| Prizes | UNKNOWN (not on the page) | https://theproductspace.in/ai-hackathon-details |
| Team | Yash Mehta; a teammate was mentioned on 2026-10-31 (name and role UNKNOWN). Planned as solo so far | The user, 2026-10-31 |

Submit project: https://theproductspace.in/user-dashboard/submissions/agentic-ai-hackathons
Submit LinkedIn posts: https://theproductspace.in/user-dashboard/linkedin-submissions/agentic-ai-hackathons
Kickoff call: https://learn.theproductspace.in/edmingleliveclass/join?token=8HFBFgDAmv52FS1I
Wispr Flow download: https://ref.wisprflow.ai/productspace

## Submission requirements

- [ ] Demo video submitted through the project submission link by 2026-10-31 23:59 IST. The form asks for a video only (the user, 2026-10-31). Length limit: UNKNOWN
- [ ] Built by voice: prompts, specs and fixes dictated with Wispr Flow into the AI builder, and shown in the submission
- [ ] The product's main input is natural speech captured through Wispr Flow; the agent turns filler words, digressions and self-corrections into structured output
- [ ] Problem 04 scope: messy PDF, CSV and SMS ingestion with auto-categorization
- [ ] Problem 04 scope: correction loop that learns rules
- [ ] Problem 04 scope: recurring payment and subscription detection, with alerts when one changes or goes unused
- [ ] Problem 04 scope: persistent financial profile (income, fixed costs, emergency fund, goals with target dates)
- [ ] Problem 04 scope: goal planner with what-if simulation
- [ ] Problem 04 scope: nudges when spending drifts off plan
- [ ] Problem 04 scope: monthly review report
- [ ] Problem 04 scope: guardrails (educates and models scenarios, never recommends specific securities)
- [ ] LinkedIn posts tagging Product Space and Wispr Flow, submitted with link and likes/comments screenshot by 2026-11-01 23:59 IST (suggested: after kickoff, while building, final demo)

Sources: https://theproductspace.in/ai-hackathon-details and https://theproductspace.in/ai-hackathon-details/problem-statement

## Judging criteria

Rubric source: OFFICIAL https://theproductspace.in/ai-hackathon-details

| Criterion | Weight | What the judges look for |
|---|---|---|
| Wispr Flow usage | 20% | How you used your voice with Wispr Flow to build. Show it in the submission and LinkedIn posts |
| Prototype quality and UX | 20% | Not detailed on the page |
| AI integration | 20% | Not detailed on the page |
| Problem understanding | 15% | Not detailed on the page |
| LinkedIn content and engagement | 15% | Posts about the build; engagement is likes plus comments |
| Innovation and creativity | 10% | Not detailed on the page |

Bonus on top of the 100: engagement rank 1 = +10 · ranks 2–3 = +9 · ranks 4–7 = +8 · ranks 8–15 = +7 · everyone else who posts and submits = +6.

Target weighted score: 8.0 / 10

## Phase status

Hours left at the last update: 1.2 · Ship buffer: 4 h (under-24h rule; starts 2026-10-31 19:59 IST) · Feature freeze: 2026-10-31 17:59 IST (6 h before the deadline)

Scaling: under 24 hours. 2–3 ideas, shortlist 1–2, test rounds 1 and 6, skip HTML pages.

| # | Phase | Status | Output | Notes |
|---|---|---|---|---|
| 1 | Research | done | research/REPORT.md | Kickoff attended; no new rules (the user). HTML page skipped under the under-24h rule |
| 2 | Ideation | done | docs/IDEAS.md | Chose I-9 Paisa Panchayat, full scope, after reopening I-5. HTML board skipped under the under-24h rule |
| 3 | Planning | done | docs/PLAN.md | Plan approved by the user. Checklist seeded: 44 MUST, 8 SHOULD. Thin slice due 16:30, MUSTs due 17:45 |
| 4–6 | Build, test, debug | in progress | docs/ITERATION_LOG.md | Iteration 2 done · Open P0: 0, P1: 0 · Latest judge score: 6.45 (target 8.0) |
| 7 | Ship | not started | docs/submission/ | |

Status values: not started · in progress · awaiting review · done

## Settings

- code_repo: code/paisa-panchayat (git initialized, no commits yet)
- commits_allowed: yes, local only; no pushes unless the user asks (the user, 2026-10-31)
- custom_research_prompt: none
- product_llm: Gemini API, using the user's free key (the user, 2026-10-31). Main model gemini-2.5-flash, falling back to -lite; search grounding on gemini-2.5-flash. gemini-3.8-flash returned a 429 at 16:05 (20 requests a day on this key). Keep the key out of the repo
- wispr_quota: not a constraint (the user, 2026-10-31)

## Artifacts

| What | Local file | URL |
|---|---|---|
| Research report page | skipped (under 24h) | |
| Ideas board page | skipped (under 24h) | |
| Pitch deck | | |
| Build plan PDF for the teammate | docs/Paisa-Panchayat-Build-Plan.pdf | Not published |

## Decisions log

| Date | Decision | Why | By |
|---|---|---|---|
| 2026-10-31 | Problem statement 04: Personal finance coach with a living money model | The user's choice, uploaded as a screenshot | User |
| 2026-10-31 | Build I-5 Munshi (working name), merging I-1, I-2 and I-4. Backup: I-1 re-aimed | Best blind-scored loop (7.1), ends on a moving goal date, and keeps the user's accountant framing and correction learning. Merge is an unscored estimate of about 7.6 | User |
| 2026-10-31 | Replace I-5 with I-9 Paisa Panchayat, **full scope**: a ledger for cash, online, lending and EMIs, competing goal agents, and Munshi Q&A with live prices. Backup: the I-5/I-1 spine | The user wanted more uniqueness. Blind score 7.5, highest of four. Chosen over the recommended thin build, against the skeptic's estimate of about 490 min vs about 205 min to the freeze | User |
| 2026-10-31 | Plan approved. Feature freeze stays at 17:59 IST and unbuilt extras are cut. Free Gemini key. Local commits allowed | Keeps 6 hours for testing and the video; the review expects most SHOULD items to be cut | User |
| 2026-10-31 | Redesign the frontend as a friendly, pictorial app for students: big icons, rings and tappable cards, no charts | The user: it looked like a report, not an app. Backend unchanged | User |
| 2026-10-31 | Munshi becomes a floating round chat on every screen, answers free-form questions through Gemini, and Home figures explain themselves. Past the 17:59 freeze at the user's request | The user's test: Munshi couldn't answer real questions, and a negative figure had no reason | User |
| 2026-10-31 | Apply the Payoneer-inspired design system (dribbble.com-DESIGN.md) to the mobile frontend, with reactive touches. Rename to PennyWise, Ledger and Buggy. This frontend is mobile only (Android and iOS); the website has a separate frontend | The user's direction at 21:35 to 21:52 IST. Past the freeze and into the ship buffer at the user's request | User |
| 2026-10-31 | App opens on a Gemini-style Home: greeting, one box for speech and questions, bubbles to each section. Adds a Profile and a prototype sign-in (a name on the device, no password or server account). Panchayat is now Huddle and Alerts is now Nudges | The user asked for this page and for renames without giving names; Claude picked Huddle and Nudges for the user to veto | User |
| 2026-10-31 | No speech code in the app. A plain text box takes Wispr Flow dictation; typed input also works | Meets "main input is natural speech captured through Wispr Flow" without building speech features | User |
| 2026-10-31 | No "CA" or "Chartered Accountant" in the product's name or persona; live SMS and email fetching are out; synthetic data only | Protected-designation risk, build time, and Gemini data terms | User, via I-5 |
| 2026-10-31 22:38 IST | Mobile frontend restyled as glass panels over black, from the user's Payoneer mobile concept references. Home is now the larger centre ring in the bottom nav. Pink accent kept instead of the references' red | The user asked for the glass panel look and a centred, larger Home icon. Pink is the accent from their own palette, and it keeps the brand consistent | The user, with the accent call by Claude |

## Open questions

- Is there a video length limit? The user reports only that the form asks for a video
- Wispr Flow Insights exists and is captured at docs/submission/wispr-flow-insights.png (the user, 2026-10-31): 130 WPM, 30,508 total words, 434 AI prompts. These are lifetime figures, not today's alone. The uncropped screenshot shows part of the API key, so share only the cropped one
- Does Flow keep amounts and Hinglish intact in long dictation? Untested; run a 15-minute dictation test first
- "Paisa Panchayat" wasn't found as a product at search depth; no trademark search done. Show the LinkedIn post to 2 people before publishing, given the skeptic's khap-association warning
- Gemini free key limits: gemini-2.5-flash hit 20 requests a day at about 17:56 IST, and gemini-3.8-flash also shows 20 a day. gemini-2.5-flash-lite is in use, 6 calls made, and its limit is assumed similar but not confirmed. A second key is set up as automatic failover, with its own quota on gemini-2.5-flash (18:34). A full demo run needs about 10 calls
- Claude usage limit stopped all builders from about 15:15 to 16:00, so the timeline lost 50 minutes
- Two Gemini keys were pasted in chat on 2026-10-31; rotate both after the hackathon
- The user wants the product as an Android and iOS app, tested first in a phone view on the web, with simulators later (the user, 2026-10-31). The phone preview is at /phone. Mobile frontend plan and native route are undecided
- The app is now pitched at students, but the demo data is a salaried person (₹85,000 income, rent, flat deposit). Should the demo data change?
- Where is the website frontend? It isn't in this project or under ~/Desktop/projects (checked 21:52 IST)
- Who is the teammate, and what do they own? The plan assigns no work to them yet
- Demo Day date, format and panel
- Prizes
