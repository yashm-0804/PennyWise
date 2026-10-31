# Judge review: ideas (Money Standup, Say It See It Move)

2026-10-31 13:55 · Rubric: OFFICIAL (as quoted in the prompt; HACKATHON.md not opened, as instructed) · Blind: yes

Both ideas are scored as concepts: the likely result if built as carded by one person in one day. Nothing has been seen working, so scores of 8 are provisional and show what the concept makes possible.

## What a 9 looks like here

| Criterion | A 9 would show |
|---|---|
| Wispr Flow usage | The video shows the Wispr Flow bubble while the builder dictates prompts, specs and a real bug fix. LinkedIn posts show the same. The product's core input would be painful to type. |
| Prototype and UX | One clean loop that is obvious with the sound off, using messy-looking Indian bank data, with no visibly fake or dead screens. |
| AI integration | The agent decides something itself, such as what to ask or what a ramble changes, and turns messy speech into several kinds of validated action. Maths stays deterministic. |
| Problem understanding | Goes past categorization to goals and life changes, covers every required item, and has guardrails a finance person would accept. |
| LinkedIn | Several posts with a clip that makes sense in the feed and a hook Indian PMs want to comment on, posted early enough to collect engagement. |
| Innovation | An interaction the panel has not seen in the other finance coaches on the same problem statement. |

## Idea A: Money Standup

| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20% | 7 | A 30-second ramble is the whole demo and would be painful to type, so voice is clearly needed; capped at 7 because the card has no plan to show voice being used to build, which is what this criterion actually grades. |
| Prototype quality and UX | 20% | 6 | 40+ transactions settling on screen is a strong visual, but the card has no step for catching a misheard answer, and ingestion, ranking, parsing and bulk updates are a lot to polish alone in a day. |
| AI integration | 20% | 8 | The agent ranks what the data can't tell it, chooses its questions, then splits one ramble into rules, tags and profile updates; this is the more agentic design and goes beyond the speech-to-structure baseline every entrant must meet. |
| Problem understanding | 15% | 7 | "Ask only what the data can't tell" is a real insight into why people abandon budgeting, and "possibly unused" is honest about what statements can show; but the demo looks backward at transactions, the thing the statement says apps stop at, and goals barely appear. |
| LinkedIn content and engagement | 15% | 7 | "My finance app ran a standup with me" is instantly clear to PMs, and "₹40k in Sept, did you watch Netflix?" invites comments; capped because the card has no posting plan and reach depends on the builder's network. |
| Innovation and creativity | 10% | 8 | Reversing the flow, so the app asks and one ramble settles everything, should stand out among upload-then-chat coaches; the "standup" framing is memorable. |
| **Weighted** | | **7.1 (71/100)** | |

### What would raise the score

1. Record the build from the first dictated prompt: Wispr Flow bubble visible, 20–30 seconds in the video, including one bug fixed by voice, plus a real count of dictated prompts → Wispr Flow usage, +0.4 (7 to 9), about 0.5 hours spread across the day.
2. Publish a plan of 2–3 posts: an early post with the hook, a build-by-voice clip mid-day, and the 30-second ramble clip at the end, each ending on a question people can answer → LinkedIn, +0.15 to +0.3, about 1 hour.
3. End the demo on a consequence: the settled ramble moves a goal date or changes the plan, which brings in the "living model" and what-if in one beat → Problem understanding +0.15, Prototype +0.2, about 1.5 hours.
4. Show a receipt linking each spoken phrase to the change it caused, with one-tap undo, so a misparse is visible and fixable → Prototype, +0.2, about 1.5 hours.
5. Import next month's file on camera and show the spoken rule applying with no question asked, which proves the correction loop learns → AI integration, +0.2 (to 9), about 1 hour.

## Idea B: Say It, See It Move

| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20% | 6 | "No wait, 34" shows why natural speech beats a form, but the example sentence takes about eight seconds to type, so voice feels less necessary; it has the same gap on showing voice used to build. |
| Prototype quality and UX | 20% | 7 | Raw text beside change cards, then a sliding goal date, reads with the sound off, and one tight loop with a deterministic engine is more achievable in a day; versioned history adds scope, and ingestion may end up thin as it sits last in the plan. |
| AI integration | 20% | 6 | Speech to structured change with confidence levels and clarifying questions is well engineered, but it is close to what this event's rules ask of every entrant, and the agent only reacts to what the user says. |
| Problem understanding | 15% | 8 | It answers "adapting as life changes" head on: goals with dates, what-if and a deterministic projection are at the core, not an add-on; lost a point because users must think to volunteer changes, and the correction loop isn't stated. |
| LinkedIn content and engagement | 15% | 6 | The date-slide clip works in a feed and "a pull request for your finances" will please technical readers, but it is less relatable and gives non-engineers less to comment on. |
| Innovation and creativity | 10% | 7 | Review-before-commit for personal finance is a sharp, memorable metaphor, but proposed-change cards are now a familiar AI pattern and the metaphor doesn't match how most consumers think about money. |
| **Weighted** | | **6.6 (66/100)** | |

### What would raise the score

1. Record the build by voice the same way as in A → Wispr Flow usage, +0.4 (6 to 8), about 0.5 hours spread across the day.
2. Change the demo line to a long, rambling life update covering 4–5 changes (rent, a raise, Goa, a cancelled gym), so typing is plainly worse → Wispr Flow usage +0.2, AI integration +0.2, about 0.5 hours.
3. Have the agent open pull requests too: "Your rent debit rose to ₹34k. Update the model?", generated from ingested statements → AI integration +0.4 (to 8), Innovation +0.1, about 2.5 hours.
4. Publish the same 2–3 post plan, and lead with "I said my rent was going up and my savings goal moved five months" rather than the pull request metaphor → LinkedIn, +0.15 to +0.3, about 1 hour.
5. Turn a rejected or edited card into a learned rule, closing the stated correction-loop gap, and keep "pull request" for the pitch while the UI says "Proposed changes" → Problem understanding, +0.15, about 1 hour.

## Ranking

| Rank | Idea | Wispr (20) | Prototype (20) | AI (20) | Problem (15) | LinkedIn (15) | Innovation (10) | Weighted |
|---|---|---|---|---|---|---|---|---|
| 1 | A: Money Standup | 7 | 6 | 8 | 7 | 7 | 8 | **7.1** |
| 2 | B: Say It, See It Move | 6 | 7 | 6 | 8 | 6 | 7 | **6.6** |

**How firm the lead is:** moderately firm. A's 0.5 lead comes mainly from AI integration and depends on the spoken parsing really working. If it only works on a scripted take, Prototype could fall to 4 and AI to 6, which puts A at about 6.3, below B. A video submission lowers this risk because a retake is possible, but the cost then becomes hours spent tuning the parser.

**The best version borrows from both.** Keep A's agent-led questions and ramble, and add B's phrase-to-change cards and moving goal date. That is what changes 3 and 4 under A do, and together they would take A to about 7.6 before the build-capture and LinkedIn gains.

## Red flags

Requirement coverage, based only on what the cards state:

| Required item | A | B |
|---|---|---|
| PDF, CSV and SMS ingestion with auto-categorization | Stated (one PDF path) | Stated (one PDF path) |
| Correction loop that learns rules | Stated, through spoken answers | **Not stated**; the model holds rules, but no link from corrections to rules is described |
| Recurring detection | Stated | Stated |
| Alert when a recurring payment changes | **Not stated**; "Swiggy up 40%" is category drift, not a recurring change | **Not stated** |
| Alert when a recurring payment goes unused | Stated as a question | **Not stated** |
| Persistent profile | Stated | Stated |
| Goals with target dates in the profile | **Not stated**; only implied by the planner | Stated |
| Goal planner with what-if | Stated, but absent from the demo moment | Stated, and central |
| Nudges, monthly review, guardrail refusals | Stated | Stated |

Other concerns:

- **Scope, both ideas:** each card lists nine or more components for one solo builder in one day. Expect some to end up thin. Any part that is stubbed should be labelled, because a dead screen in a video costs more than a missing one.
- **The product could look like a text box, both ideas:** as far as I know, Wispr Flow is system-wide dictation that types into the focused field. Unless its bubble is on screen, judges just see text appearing. I did not check this against current Wispr Flow documentation.
- **B's signature moment may not survive Wispr Flow:** from memory, Wispr Flow can resolve spoken self-corrections itself, so "32, no wait, 34" may arrive as just "34". The raw text panel would then show nothing messy, and the credit would go to Wispr Flow rather than the agent. Test this first. Filler cleanup could likewise tidy A's ramble on screen.
- **Demo numbers are unverified:** "40+ transactions resolve" (A) only happens if the seeded data is built so that rules sweep many rows. "Mar 2028 to Aug 2028" (B) must come from the engine, and the inputs should be able to reproduce it. Label seeded data as synthetic, which also avoids exposing real statements in a public video and posts.
- **A's fit with the rule on main input:** the first input is a statement upload, not speech. Speech is the main interaction, so I read this as compliant, but the video should reach voice within the first 20 seconds.
- **Guardrails:** a domain judge will test them. Investment advice is regulated by SEBI in India, so a refusal should visibly explain and model scenarios rather than only block, and should never name securities.
- **B's retention gap:** nothing in the card brings a user back, because the app waits to be told about changes. Change 3 under B addresses this.
- **LinkedIn is largely outside the idea:** this 15% depends heavily on the builder's network and on timing. The scores reflect how shareable each concept is, not likely engagement. The cards don't say when engagement is counted, so check this and post early.

## How it compares

Both sit above a typical submission on this statement, which is likely to be a chat box over a CSV with dictation added on (about 5). Neither is yet a likely winner, because the 20% for Wispr Flow usage and the 15% for LinkedIn are won by evidence of the build process, and neither card plans for that evidence. With the two cheapest changes (build capture and a post plan), A reaches strong-finalist territory at about 7.7, and about 8 if the demo also ends on a moving goal date. A typical winner of an event like this is about 8 to 8.5: one unforgettable voice moment, proof of the build in the video, and posts that travelled.

---

## Idea C: Personal CA (added later)

2026-10-31 14:00 · Rubric: OFFICIAL (same as above) · Blind: yes. Scores for A and B are unchanged. C is scored as the builder described it, with nothing filled in on its behalf.

| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20% | 3 | Voice is never mentioned: inputs are messages, emails and "directly write", so the event's rule that speech is the main input isn't met as described, and there is no plan to show voice being used to build. |
| Prototype quality and UX | 20% | 5 | The small scope is achievable and could be tidy in a day, but no screen or demo moment is described, so the likely result is a familiar dashboard with a chat box. |
| AI integration | 20% | 5 | Categorizing, answering "where can I cut down?" and a 20% what-if are competent but common; learning from corrections is the real substance, though it isn't defined how a correction changes later behaviour. |
| Problem understanding | 15% | 4 | UPI alerts and "irrelevant expenditures" are real Indian pain points, but the idea mostly categorizes and adds chat, which is what the statement criticizes; goals are spending limits, not goals with target dates, and most required items are missing. |
| LinkedIn content and engagement | 15% | 6 | "Everyone deserves a personal CA" is the idea's best asset and speaks to a broad Indian audience, but there is no visual moment to clip and no posting plan. |
| Innovation and creativity | 10% | 4 | Apart from the CA persona, this is an expense tracker with a chatbot, which is likely to be the most common entry on this statement. |
| **Weighted** | | **4.5 (45/100)** | |

### What would raise the score

1. Record the build by voice with the Wispr Flow bubble visible, 20–30 seconds in the video, including one bug fixed by voice → Wispr Flow usage, +0.4, about 0.5 hours spread across the day.
2. Make speech the main input for expenses, budgets, corrections and questions, for example "800 on dinner, Riya owes me half, and the 2k to Amit was rent" → Wispr Flow usage, +0.4, about 1 hour.
3. Build one demo moment around the correction idea: say "that 2k to Ramesh is my house help, every month", then watch past payments reclassify and next month's import get it right with no question asked → AI integration +0.2, Prototype +0.2, Innovation +0.1, about 2 hours.
4. Publish 2–3 posts built on the "personal CA" hook, with the correction clip → LinkedIn, +0.15, about 1 hour.
5. Add a profile (income, fixed costs, emergency fund) and goals with target dates, so that "what if I spend 20% less?" answers "your goal arrives four months sooner" → Problem understanding, +0.3, about 3 hours.

Together these reach about 6.8, roughly level with B and still short of A, with recurring detection, nudges, a monthly review and guardrails still to build.

### Ranking with C

| Rank | Idea | Wispr (20) | Prototype (20) | AI (20) | Problem (15) | LinkedIn (15) | Innovation (10) | Weighted |
|---|---|---|---|---|---|---|---|---|
| 1 | A: Money Standup | 7 | 6 | 8 | 7 | 7 | 8 | **7.1** |
| 2 | B: Say It, See It Move | 6 | 7 | 6 | 8 | 6 | 7 | **6.6** |
| 3 | C: Personal CA | 3 | 5 | 5 | 4 | 6 | 4 | **4.5** |

**What is worth keeping from C:** the "personal CA" framing is more relatable to an Indian audience than A's or B's names, and its correction-learning idea is already central to A. Both could carry over, subject to the naming flag below.

### Red flags for C

Requirement coverage, based only on what the builder described:

| Required item | C |
|---|---|
| Messy ingestion with auto-categorization | Partial: SMS, email and manual entry; **PDF and CSV not stated** |
| Correction loop that learns | Stated; explicit rules not described |
| Recurring detection, with alerts when one changes or goes unused | **Not stated** |
| Persistent profile (income, fixed costs, emergency fund, goals) | Partial: budget and spending goal only |
| Goal planner with what-if | Partial: what-if on spending; **no goals with target dates** |
| Nudges when spending drifts off plan | **Not stated** |
| Monthly review report | **Not stated** |
| Guardrails against recommending securities | **Not stated** |

Other concerns:

- **Main-input rule:** as described, C doesn't use speech as its main input, which is an event rule as well as a scoring issue. Fix this first.
- **Name:** from memory and unverified, "chartered accountant" is a protected professional designation in India under the Chartered Accountants Act. Check this before using it publicly, and consider wording such as "CA-style" with a clear note that it isn't a licensed professional.
- **Expectation gap:** a domain judge will expect a CA to handle tax, yet the idea has no tax feature. The name promises more than the product does.
- **Fetching messages and email:** from memory and unverified, iOS doesn't let third-party apps read SMS, and Android and Gmail access are restricted. In one day, use pasted SMS text or a sample export, and say so in the video.
- **Learning claim:** "enhance the AI's understanding" has to be visible. Show a saved rule or memory changing a later result, or a judge will assume it does nothing.

---

## Idea D: Paisa Panchayat (added later)

2026-10-31 14:29 · Rubric: OFFICIAL (same as above) · Blind: yes. Scores for A, B and C are unchanged. D is scored as the likely result of one solo builder building everything described in one day. Nothing has been seen working, so scores of 8 or more are provisional.

| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20% | 7 | Wispr Flow is the only way speech gets in, used for entries, questions and the final ruling, and mixed Hindi and English makes it a strong showcase; held at 7, like A, because there is still no plan to show voice being used to build. |
| Prototype quality and UX | 20% | 6 | Goals arguing and then every date updating is a strong hero screen, but this is the largest scope of the four (ledger, lending, EMIs, cash wallet, live prices, debate and every required item), so much of it will be thin after one day. |
| AI integration | 20% | 8 | Separate goal agents negotiate over numbers calculated in code, the user's ruling is parsed into changes, and Munshi answers with sourced prices: this is agentic and architecturally sound, provided the offers come from real calculations and not from one prompt playing several voices. |
| Problem understanding | 15% | 8 | It is the only card stating every required item, and it treats goals as competing for the same money; counting a ₹10,000 cash withdrawal once, tracking money lent per person and covering EMIs all reflect real Indian money habits; held at 8 because stated coverage isn't working coverage. |
| LinkedIn content and engagement | 15% | 8 | "My savings goals held a panchayat over my iPhone" is funny, Indian and easy to clip, and invites people to name which goal would lose; this is a stronger hook than A's, though it has no posting plan and reach still depends on the builder's network. |
| Innovation and creativity | 10% | 9 | Goals with voices that bargain with each other while the user makes the final call is a new way to show a financial trade-off, and it is unlikely to be repeated by other entrants on this statement. |
| **Weighted** | | **7.5 (75/100)** | |

### What would raise the score

1. Record the build by voice, including some mixed Hindi and English dictation and one bug fixed by voice, with the Wispr Flow bubble visible → Wispr Flow usage, +0.4 (7 to 9), about 0.5 hours spread across the day.
2. Rank the scope before building: polish expense, panchayat, ruling and updated dates, and keep every other required item small, real and labelled → Prototype, +0.2 to +0.4, about 0.5 hours of planning, and it should save build time.
3. Have code generate the allowed trade-offs so agents can only argue over those, and let any claim be tapped to reveal its calculation → AI integration, +0.2 (to 9), about 1.5 hours.
4. Publish 2–3 posts led by the panchayat clip, with English subtitles and a closing question, "Which of your goals would lose?" → LinkedIn, +0.15, about 1 hour.
5. Add a 15-second second beat to the video: a ₹10,000 withdrawal counted once, money lent to a friend marked repaid, and a correction told to Munshi appearing as a visible rule → Problem understanding, +0.15, about 1 hour.

Together these come to about 8.7 on paper. The first two alone reach about 8, in the range of a typical winner.

### Ranking with D

| Rank | Idea | Wispr (20) | Prototype (20) | AI (20) | Problem (15) | LinkedIn (15) | Innovation (10) | Weighted |
|---|---|---|---|---|---|---|---|---|
| 1 | D: Paisa Panchayat | 7 | 6 | 8 | 8 | 8 | 9 | **7.5** |
| 2 | A: Money Standup | 7 | 6 | 8 | 7 | 7 | 8 | **7.1** |
| 3 | B: Say It, See It Move | 6 | 7 | 6 | 8 | 6 | 7 | **6.6** |
| 4 | C: Personal CA | 3 | 5 | 5 | 4 | 6 | 4 | **4.5** |

**How firm the lead is:** modest. D only ties A on Wispr Flow usage, Prototype and AI integration, the three heaviest criteria, so its 0.4 lead comes entirely from Problem, LinkedIn and Innovation. If the breadth leaves the product visibly thin, Prototype could fall to 4 and D to 7.1, level with A. If the debate reads as scripted theatre, AI could fall to 6 and D to 7.1; both together give 6.7. A has its own downside case of about 6.3, so D still holds up reasonably well.

### Red flags for D

All required items are stated on the card. This confirms only that they are planned, not that they work.

- **Scope:** this is the largest card of the four, and it adds items beyond the required list (lending, cash wallet, EMIs, live prices). One builder won't finish all of it to the same standard in one day. Change 2 under D matters most for this reason.
- **Mixed Hindi and English is untested:** I can't confirm how Wispr Flow handles it. It may output Devanagari, Roman script or English, and the output could vary within a sentence. Amounts such as "5k", "paanch hazaar" or "2 lakh" must also parse correctly. Test this in the first hour, since the demo depends on it.
- **The demo script has gaps:**
  - The sister's December wedding is mentioned but never speaks, and the ruling doesn't address it. A judge will notice that the most urgent expense has no voice.
  - "No iPhone till bonus" needs a bonus date and amount that nothing on the card establishes.
  - "₹5k" costing Flat "4 months" only makes sense under certain inputs. If it means a one-off ₹5k, Flat would be saving only about ₹1,250 a month. State whether it is one-off or monthly, and make sure the engine produces this number.
- **Live price lookup:** an iPhone's price varies by seller, model and storage, and the lookup can break or return the wrong variant. Show the source and time checked. If the price is cached or stubbed in the video, label it.
- **EMI realism:** the card doesn't mention interest or processing fees. A domain judge may ask, particularly about "no-cost" EMI.
- **Still looks like a text box:** with no speech code, the app shows only text appearing. The Wispr Flow bubble must be visible in the demo or the voice story is lost on screen.
- **Theatre over substance:** the debate only earns its AI score if the agents' positions truly change with the numbers. Show the same purchase with different inputs producing a different argument. Keep lines short, because long persona dialogue will get tiresome in a video.
- **Limited everyday use:** the panchayat only meets for big expenses, so day-to-day value rests on the ledger and Munshi. An investor-minded judge may ask what brings users back between big decisions; goal notices are the answer to show.
- **Audience:** subtitle the Hindi for any judge or LinkedIn reader who doesn't follow it. The word "panchayat" should land well here, but keep the tone affectionate, not mocking.

### How D compares

D is the only one of the four with a demo moment a panel would still be discussing after seeing many finance coaches, and its strengths lie in the criteria least dependent on build time. It is a strong-finalist concept now and can reach likely-winner range, but only if the scope is cut hard and the build is recorded from the first prompt. Without those, it risks being the most memorable idea with the thinnest product.
