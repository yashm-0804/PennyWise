# Event-sponsor: research notes

Agentic AI Hackathon by Product Space x Wispr Flow · researched 2026-10-31 · by hack-researcher (about 10 min, search-snippet depth; several items unverified)

## Key findings
- Wispr Flow has an official Voice Interface API: WebSocket `/ws` (recommended, streaming) and REST `/api` POST. Auth is an API key on a backend, or short-lived client access tokens issued by your backend. It does 100+ languages, self-corrections, filler removal and name correction. (source: https://api-docs.wisprflow.ai, fetched 2026-10-31) · High. Pricing, limits and request params are NOT stated on that page. Full index is at https://api-docs.wisprflow.ai/llms.txt, which timed out when fetched.
- Third-party guides give the endpoints as `wss://api.wisprflow.ai/api/v1/ws` and `POST /api/v1/transcribe` (source: search summary, undated, unofficial) · Low-Med. A press release calls it an "enterprise API", so key access may be gated: unknown whether a hackathon participant can get a key today.
- Platforms for dictation: Mac, Windows, iOS, Android. Notetaker is Mac and Windows only (source: https://wisprflow.ai/pricing, 2026-10-31) · High.
- Free plan: speech-to-text in 100+ languages, dictionary and snippets, limited Notetaker. The page says "limited words per week" without a number. Pro is $15/mo monthly or $12/mo annual, with unlimited dictation. Students get 50% off (source: https://wisprflow.ai/pricing, 2026-10-31) · High. Older reviews cite 2,000 words/week on desktop and 1,000 on iPhone; these are likely stale (eesel.ai, 2025) · Low. A 2-week Pro trial is claimed in a search summary only; the saved event page does not mention a trial · Low.
- Desktop versions integrate with system-level input fields. iOS works as a third-party keyboard (source: https://en.wikipedia.org/wiki/Wispr_Flow, accessed 2026-10-31) · Med.
- Wispr is on a growth run: $280M Series B at a $2B valuation in Aug 2026, led by Menlo, per Wikipedia (not independently checked) · Med. Founded 2021 by Tanay Kothari and Sahaj Garg; Flow launched 2024 (same source).
- Product Space is an Indian PM-career platform run by ACADENCE EDUTECH PRIVATE LIMITED. It sells the AI-First PM Fellowship, a Generative AI Program and AI Builders 101, and says "India's Fastest Growing Community of Professionals" (source: https://theproductspace.in, 2026-10-31) · High.
- Past winners, judges and winning LinkedIn posts for Product Space hackathons were NOT found (see Open questions).

## Answers to the key questions
### 1. How Flow works, and what messiness still reaches a product
OS-level dictation into any text field on Mac/Windows/iOS(keyboard)/Android [Wikipedia, pricing]. The API doc itself promises self-correction handling, filler removal and context name fixing [api-docs]. Not confirmed from official docs in this session: "Backtrack", Command Mode details, Styles, snippets semantics (Pro-vs-Free listing shows dictionary and snippets exist, pricing page). Inference: Flow already strips most fillers and resolves "no, I mean X" corrections, so the text a product receives is mostly clean prose. What still arrives is: long unstructured run-ons, digressions and topic jumps, multiple facts in one blob, ambiguous amounts and dates (for example "about fifty, sorry, five zero thousand"), mixed Hindi-English, unresolved references ("same as last month"), and contradictions across turns. Low confidence. The agent's job is therefore structuring and reconciliation, not de-umming. For a finance coach, extract entities (income, expenses, goals, dates), keep a confidence level and ask a clarifying question when ambiguous.

### 2. API, web-app gotchas, limits, usage stats
An official API exists (above), so a product could stream mic audio to Flow for transcription, but whether a participant can obtain a key during the hackathon is unknown. Alternative: judges only need dictation into the product's focused text field, which works with any input. Gotchas (Inference, Low confidence; not found in sources): the desktop app types into the focused field, so a plain `<textarea>` is safest. Rich contenteditable editors can mis-handle pasted/typed bursts. There is no dictation-detection API for typed input; you can only infer it from large input events (a big text insertion in one `input` event, fast WPM). Usage dashboard: the pricing page mentions team usage analytics for Pro and individual usage reporting for Growth, and Wikipedia mentions a Notes hub/Scratchpad; I could not verify a personal "words dictated / WPM" dashboard; check the Flow app's Home or stats screen directly and screenshot it.

### 3. What Wispr wants to show off
Messaging seen: "developers are ditching their keyboards", expansion to new platforms (finanzen.net press release, undated), enterprise API for customizing voice-to-text in AI apps, Notetaker with meeting notes usable in Claude/ChatGPT, team workspace and shared dictionary. The hackathon page frames "building with your voice". Inference: they want voice-first agentic building, voice as the input to AI builders, and screenshots of Flow in action.

### 4. Product Space
Edu/community platform for PMs in India (see above). Earlier Product Space Agentic AI Hackathon listings: a 2-day virtual sprint co-hosted with Code Benders, dated 18-19 July 2026 or 19-20 Sep 2026 depending on listing, prizes of about ₹3,000 / ₹2,000 / ₹1,000 plus certificates, judged on product thinking, business innovation, execution velocity and final presentation, not just code (sources: https://www.startupgrantsindia.com/agentic-ai-hackathon-2 and https://internshala.com/competitions/agentic-ai-hackathon-2/, via search summaries only, not opened) · Low-Med. Rewarded traits, per that: product thinking and clear presentation over code depth. Judges on the panel: not found. Past winners and strong LinkedIn posts: not found.

### 5. Most convincing evidence of building with voice
From the event page rules (saved page): judges look at Wispr usage in the submission and LinkedIn posts; the suggested streak is a screenshot or short clip of Flow in action, then a demo showing how voice changed the work. Inference, Low: a short screen recording with Flow's mic indicator and live dictated prompts into the builder, a raw messy dictation shown next to the structured output, the Flow stats screenshot, and a README section listing which prompts and fixes were dictated.

## Things that change how we compete
- The product input should be shown as raw dictation to structured model: demo a messy, self-correcting, multi-topic monologue and the resulting money model with changes visible.
- Rubric is 35% about voice/LinkedIn proof, so capture screen recordings now.
- Engagement rank on LinkedIn gives +6 to +10; being first with a video and tagging Product Space matters.
- Possible stretch: use the Wispr API for in-app voice, only if a key can be obtained quickly; otherwise rely on Flow typing into the text box.

## Conflicts and uncertainties
- Free-tier word cap: 2,000/week (2025 reviews) vs "limited words per week", no number (official pricing page). Trust the official page; the cap is unknown.
- Growth plan price shows two numbers unlabeled on the pricing page.
- Product Space past hackathon dates conflict between listings (18-19 Jul vs 19-20 Sep 2026); possibly different editions.
- Wikipedia's Series B claim (Aug 2026) was not cross-checked.

## Open questions
- How to get Wispr API keys (https://wisprflow.ai/developers, https://api-docs.wisprflow.ai/llms.txt).
- Official docs for Backtrack, Command Mode, Styles, and any in-app usage stats.
- Panel names for Demo Day; past winners (check Product Space LinkedIn and Instagram, the Internshala pages).

## Sources
1. Wispr Flow Voice Interface API docs, https://api-docs.wisprflow.ai (undated, accessed 2026-10-31)
2. Wispr Flow pricing, https://wisprflow.ai/pricing (undated, accessed 2026-10-31)
3. Wispr Flow, Wikipedia, https://en.wikipedia.org/wiki/Wispr_Flow (accessed 2026-10-31)
4. Product Space homepage, https://theproductspace.in (accessed 2026-10-31)
5. Startup Grants India listing, https://www.startupgrantsindia.com/agentic-ai-hackathon-2 (via search summary, undated)
6. Internshala listing, https://internshala.com/competitions/agentic-ai-hackathon-2/ (via search summary, undated)
7. eesel.ai Wispr pricing, https://www.eesel.ai/blog/wispr-flow-pricing (2025, via search summary)
8. finanzen.net press release, https://finanzen.net/nachricht/aktien/developers-are-ditching-their-keyboards-as-wispr-flow-expands-to-new-platforms-14312035 (undated, via search summary)
