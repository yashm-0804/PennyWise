# Agentic AI Hackathon (Product Space × Wispr Flow): ideas

2026-10-31 · 9.9 h left · Built from research/REPORT.md

## Problem statements

Fixed by the event. We took problem 04 before ideation.

| ID | Statement | Who's hurting | Evidence | Sponsor tie-in | Taken forward? |
|---|---|---|---|---|---|
| 04 | Personal finance coach with a living money model: apps categorize and stop, without understanding goals or adapting as life changes | Salaried Indians under debt pressure, with low financial literacy | Household debt 45.5% of GDP; small-ticket delinquency 6.4%; literacy about 27% (REPORT §5) | Natural speech through Wispr Flow is the main input, and the app is built by voice | Yes |

**What a winning answer shows:** speech visibly changes a persistent model, and that change moves a goal date.

**Hidden constraints:**
- All 8 brief features plus voice input are required.
- The submission is video only, so no deployment is needed.
- Flow already applies self-corrections and removes fillers, so "we clean up speech" earns no credit.
- Statements can't prove a subscription is unused.

## Ideas

### I-1 · Money Standup

- **One-liner:** the coach reads your statements, then asks only what the data can't tell it. One rambling spoken answer settles it all.
- **Problem statement:** 04
- **Demo moment:** the coach asks about ₹40k in Sept, Swiggy up 40% and Netflix. You ramble for 30 seconds, and 40+ transactions, a rule and a one-off tag resolve.
- **Sponsor tech used:** Flow for build by voice and for long spoken answers. Depth is good, because this input would be painful to type.
- **Borrowed from:** stand-ups and doctor's intake interviews.
- **MUST scope (rough):**
  - CSV, SMS and one PDF path, with auto-categorization
  - A deterministic ranking of what the data can't determine
  - Spoken answers parsed into rules, tags and profile updates
  - Persistent profile
  - Recurring detection with "possibly unused" questions
  - What-if, nudges, monthly review and guardrails
- **Skeptic's strongest objections:**
  - The hero moment is categorization, the thing the brief criticizes. → **Our answer:** end the ramble with the goal date moving, and ask about what data can't show (UPI payments to individuals, one-offs).
  - Estimated 280 minutes against about 240 available. → **Our answer:** deterministic ranker, 4 operation types, plain computation for nudges and alerts, and one "import next month" control.
  - It can look scripted on video. → **Our answer:** show a second, different ramble, and link each change to the sentence that caused it.

### I-2 · Say It, See It Move

- **One-liner:** anything you say becomes a reviewable change to your money model, like a pull request for your finances.
- **Problem statement:** 04
- **Demo moment:** "Rent's going to 32, no wait, 34 from January, and I want Goa in March." Raw text on the left, change cards on the right, and a goal date moves.
- **Sponsor tech used:** Flow for build by voice and spoken updates. Depth is thin, because the sample line is short enough to type.
- **Borrowed from:** Git diffs and pull requests.
- **MUST scope (rough):**
  - Money model with a change history
  - Speech-to-change agent with clarifying questions
  - Accept and reject step
  - Deterministic projection engine, with what-if as an uncommitted change
  - CSV, SMS and one PDF path
  - Recurring detection, nudges, monthly review and guardrails
- **Skeptic's strongest objections:**
  - Flow probably resolves "no wait" before the app sees it. → **Our answer:** the headline line must be rewritten around what Flow can't do.
  - The goal-date move needs a Goa cost nobody said. → **Our answer:** make the clarifying question visible.
  - Estimated 310 minutes against about 240 available, and ingestion is disconnected from the review step. → **Our answer:** one review queue fed by speech and statements.
  - It's a model editor, and the brief asks for a coach. → **Our answer:** have the agent check claims against data ("I cancelled Hotstar" vs "October still shows ₹299").

### I-4 · Personal CA (the user's own idea)

- **In the user's words:** "I'm thinking of building a personal CA assistant. Every individual can have a personal CA that can help them manage their budget. If we talk about budget it means you spend. You will get messages and everything whenever you use a UPI payment and something like that. We can make the app fetch data from the messages or from emails and so on. Or you can directly write as well. You can directly input the spending and/or expenditures yourself. You can also input the budget of the month or of the year or something, or the goal that you want to cross in spending as well. Based on that the AI will segregate where you have spent. Then you can ask AI, 'Where can I cut down my spending?' You can say, 'What happens if I spend only 20% less next month?' and so on. We need a CA that manages whatever we are spending so that we can reduce our irrelevant expenditures and work for a healthier money management system."
- **Addition, in the user's words:** "I'm also thinking of making sure that the AI that we have integrated in this learns from the corrections we make in the app. Let's say it marked a payment wrong or it doesn't understand why we paid somewhere or something like that. The corrections we make can help enhance the AI's understanding of more of our daily spending or the spending behaviors we have."
- **Problem statement:** 04
- **Demo moment:** none stated yet.
- **Sponsor tech used:** none stated. Speech is not mentioned as an input.
- **MUST scope (rough):** message and email fetching, manual entry, budgets, AI categorization, cut-down questions, what-if, and learning from corrections.
- **Skeptic's strongest objections:**
  - Fatal as written: speech isn't the input, and "segregate plus Q&A" is what the brief criticizes. → **Our answer:** fixable within an hour of re-scoping, as in I-5.
  - Live fetching needs a native app or a warning-screen OAuth flow, and email isn't required. → **Our answer:** paste and upload today, and name Android SMS or Account Aggregator as the production route.
  - "CA" points at a protected designation (Chartered Accountants Act section 24; how it applies to software is untested, and enforcement on a video is very unlikely). It also promises tax help. → **Our answer:** keep the behaviours and drop the title, with a "Not a Chartered Accountant" footer.
- **What's worth keeping:** the judge calls the framing the most relatable of the three. The skeptic calls "why we paid somewhere" the best new idea on the card, because UPI narrations show a payee and never a purpose.

### I-5 · Munshi (working name; a merge of I-1, I-2 and I-4)

- **One-liner:** the money file a good accountant would keep on you. It queries what doesn't add up, your spoken answer updates the file, and your goal date moves.
- **Problem statement:** 04
- **Demo moment (figures illustrative until the engine computes them):** Munshi asks "₹5,000 to rahul.k@okaxis every month, and ₹40k in September: what are these?" You answer: "Rahul's my landlord, that's my share of rent, and it goes up to 5,500 from January. The 40k was my sister's wedding, one-off, with another 20k in December." Each sentence links to its change: rule learned, fixed cost updated, one-off tagged, and the flat-deposit date moves. Then you import November, and Rahul is categorized with no question asked.
- **Sponsor tech used:** Flow for build by voice and for spoken answers that would be painful to type. No Wispr API needed.
- **Borrowed from:** I-1's question-led loop, I-2's change cards and moving goal date, I-4's accountant framing and purpose-learning, and the I-2 skeptic's check of claims against data.
- **MUST scope (rough):**
  - Paste SMS, upload CSV, one synthetic PDF layout, auto-categorization
  - Deterministic ranking of what's unexplained; Gemini phrases questions and parses answers
  - 4 operation types: rule, tag, profile field, goal or plan change
  - Visible rules table, with each rule's spoken reason, applied in code before any LLM call
  - Persistent file: income, fixed costs, emergency fund, goals with target dates
  - Deterministic projection engine and what-if ("cut dining by 30%")
  - "Import next month" control that produces the drift nudge, the subscription price-change and possibly-unused alerts, and the monthly review
  - Guardrails, including a fund question asked mid-ramble, then a modelled scenario
- **Strongest objections it inherits:**
  - Scope is still the biggest risk: the skeptics' estimates for the thinner cards were already over the window. → **Our answer:** build the hero loop first, keep every other feature as plain computation, and use the skeptics' timed kill criteria.
  - The parser can write wrong facts. → **Our answer:** every change cites a transaction or quoted sentence, uncertain ones wait for a confirm, and there's an undo.
  - It can look scripted on video. → **Our answer:** a second, different ramble with a different result, and one unedited take.

### I-9 · Paisa Panchayat (the user's fleshed-out idea, built on I-7)

- **In the user's words:** see `research/user-dictation-2026-10-31.md`.
- **One-liner:** a money ledger you feed by talking, where your goals argue like a village panchayat whenever a big expense threatens them, and you make the final call.
- **Problem statement:** 04
- **Demo moment (figures illustrative until the engine computes them):** you dictate a heavy expense, such as "laptop died, new one is 70 thousand, need it this month." Code finds 3 possible plans, and only the affected goals speak. Emergency Fund: "2.1 months of cover, not this month." Goa: "I'll give up ₹5k if Flat does too." Flat: "You said in March this is for the deposit, and that costs me 4 months." You rule by voice, "Goa moves to June, and if the bonus is under 50, July," and every date updates. Next time, the panchayat cites your ruling as precedent. The earlier demo used a sister's wedding; it was removed because of the skeptic's khap-association warning.
- **Sponsor tech used:** Flow for build by voice and for the app's main input, including Hinglish. No speech code in the app.
- **Borrowed from:** village panchayats, double-entry bookkeeping and the traditional bahi-khata ledger.
- **Three parts:**
  - **The khata (ledger).** Say anything financial: spending, income, cash or online, money lent or borrowed, repayments, EMIs. Cash withdrawals are transfers to a cash wallet and aren't counted as spending, so ₹10,000 withdrawn and paid out counts once. The user can change how any withdrawal is treated. Money lent isn't spending and a repayment isn't income; both sit in a ledger per person. Statements can be pasted or uploaded.
  - **The Panchayat.** Each goal (a commodity like an iPhone, or a monthly budget) is an agent. A heavy expense or a what-if convenes them to argue trade-offs using only numbers calculated in code. Nothing changes until your spoken ruling.
  - **Munshi (Q&A).** The record-keeper answers anything about your file. "How far along is my iPhone goal, and has the price gone up?" gets the amount saved, the percentage left and the live market price with its source, so progress is measured against the current price rather than the old one.
- **How the brief's required items fit:**

  | Required item | Where it lives |
  |---|---|
  | PDF, CSV and SMS ingestion with auto-categorization | Khata: paste or upload |
  | Correction loop that learns rules | Tell Munshi what a payment really was; it becomes a visible rule |
  | Recurring detection and alerts | Munshi flags price changes and "possibly unused" items |
  | Persistent profile | Khata plus goals with target dates |
  | Goal planner with what-if | A panchayat on a hypothetical, with nothing saved until you rule |
  | Nudges on drift | A notice from the goal being hurt |
  | Monthly review | The month-end sabha |
  | Guardrails | Panch and Munshi refuse to name securities, then model a scenario |

- **Skeptic's strongest objections** (full text and timed kill criteria in `docs/reviews/ideate-skeptic-paisa-panchayat.md`):
  - Fatal as carded: scope of about 490 minutes against about 210 (estimates). → **Our answer:** accept the skeptic's thin build order before any code. Each required item stays at a thin version.
  - The panchayat is "a table in costume" if the dialogue adds no facts. → **Our answer:** code finds 3 feasible plans that goals defend or concede, goals quote the user's dictated reasons, and rulings become precedent. Numbers are placeholders filled by code, with a validator.
  - The ledger can double count, including one payment both spoken and imported, and "saved for iPhone" needs an earmark model. → **Our answer:** spending is only postings to expense accounts, with 11 fixtures written before features, and earmarks as labels on balances.
  - One phone showed prices from ₹99,900 down to under ₹30,000 with exchange across sources, so a web search can give a confidently wrong percentage. → **Our answer:** read one named source (Apple India list price), show the URL and checked-at time, and fall back to a typed price.
  - The idea came out of an LLM session, so other teams may reach it too, and debate projects exist in other domains. → **Our answer:** partly unanswerable. The defence is the substance above, the Indian ledger and execution, not the name.
  - Voice and per-person ledgers already exist (DhanRakh, AiXpense, WalletLoop). → **Our answer:** don't pitch the ledger as novel; pitch "statements come in by themselves; you only talk about what your bank can't see: cash, who owes whom, and why."
  - The word panchayat carries khap and patriarchy associations. → **Our answer:** keep the name, with goals as the panch and you as sarpanch. No elder personas, dialect comedy or wedding demo, and banned terms go in the validator.
- **Naming:** "Paisa Panchayat" wasn't found as an existing product at search depth; no trademark search was done. "Munshi" is crowded in Indian accounting software, which matters only for a later launch.

### Dropped ideas

| Idea | Why it was dropped |
|---|---|
| I-3 Forks (branching what-if futures) | The user left it off the shortlist. Scenario comparison already exists (ProjectionLab, PocketSmith), and it makes the lightest use of speech |
| I-6 Reality Check (fact-checks your beliefs about your money) | Offered in the second round; the user chose the Panchayat instead |
| I-8 Do Raaste (two future selves) | Offered in the second round; the most gimmicky |
| Regret tracking, "should I buy this?" agent | Already exist; see `research/notes/unique-ideas.md`. The lent-and-borrowed ledger moved into I-9 as a feature |

## Score matrix

Judge scores come from `docs/reviews/ideate-judge.md` (blind, not adjusted). Feasibility scores are ours. All scores are out of 10. The total is 70% judge weighted plus 30% feasibility average.

| Idea | Wispr (20%) | Prototype (20%) | AI (20%) | Problem (15%) | LinkedIn (15%) | Innovation (10%) | Judge weighted | Buildable in time | Demo strength | Sponsor depth | Novelty | Feasibility avg | **Total (70/30)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I-9 Paisa Panchayat | 7 | 6 | 8 | 8 | 8 | 9 | 7.5 | 3 | 9 | 7 | 8 | 6.75 | **7.3** |
| I-5 Munshi (merge) | not scored | not scored | not scored | not scored | not scored | not scored | about 7.6* | 4 | 8 | 7 | 7 | 6.5 | **about 7.3*** |
| I-1 Money Standup | 7 | 6 | 8 | 7 | 7 | 8 | 7.1 | 5 | 8 | 7 | 7 | 6.75 | **7.0** |
| I-2 Say It, See It Move | 6 | 7 | 6 | 8 | 6 | 7 | 6.6 | 4 | 6 | 5 | 5 | 5.0 | **6.1** |
| I-4 Personal CA (as written) | 3 | 5 | 5 | 4 | 6 | 4 | 4.5 | 3 | 4 | 3 | 3 | 3.25 | **4.1** |

*I-5 was not blind-scored. 7.6 is the judge's own estimate for a version with A's questions and B's change cards and moving goal date. It doesn't count the accountant framing or the build-evidence and LinkedIn gains, and it assumes the parsing works.

**How firm this is:** these are concept scores and nothing has been seen running. If spoken parsing only works on a scripted take, the judge puts I-1 at about 6.3, below I-2. I-4 was scored as written, without assuming features it doesn't state; the judge's listed improvements take it to about 6.8 with several required items still unbuilt.

**The largest unbuilt points are process, not product:** the judge's biggest single gain for every idea is recording the build by voice (+0.4). Neither that footage nor the LinkedIn posts come from the product's features, and build footage can't be recreated later.

## Recommendation

**Go with I-9 Paisa Panchayat, in the skeptic's thin build, with the I-5/I-1 spine as the backup.** It has the best blind score (7.5) and is the only idea with a moment a panel would likely remember, and its strengths include LinkedIn, which carries 15 points plus up to a +10 bonus. Its "Buildable" score of 3 is as carded, so the cuts are a condition of this recommendation. The ledger, goal engine and parser carry over to the backup, so a pivot at 17:05 IST needs no restart.

**Build order (skeptic's estimates, thin version):** Flow test, skeleton and seed data, ledger core and fixtures, goal engine and what-if, dictation to entries, panchayat and ruling, guardrails, ingestion, correction rule, recurring + nudge + review, Munshi Q&A and price.

**Dropped first if short of time:** web search for price (keep one official page or a typed price), free-form Q&A (keep 3 intents), EMI interest split, automatic spoken-vs-import matching, a second debate round, monthly-budget agents, split bills.

**Never cut:** build footage, code-only numbers, confirm before write, ledger fixtures, guardrails, and a thin version of each required item.

Risks we accept:
- The lead is modest. A thin product or a debate that reads as scripted takes it to 7.1, and both to 6.7.
- Hinglish through Flow is untested, and a plausible wrong amount can only be caught by the human on the confirm card.
- "Each goal is an agent" must be true, or the video says "one model, separate voices".
- Others could reach the same idea; no uniqueness claims.

### Earlier recommendation (superseded)

**Go with I-5 Munshi, with I-1 re-aimed ("Your answer moves your goal") as the backup.** I-1 has the best blind score, and I-5 fixes its main weakness by ending on the goal date rather than on categorization. It also keeps the two best parts of your idea: the accountant who queries what doesn't add up, and learning why you paid someone. The backup is close to a subset of the same build, so if scope runs out we cut change linking and the accountant framing, without restarting.

Why not the others: I-2's headline line is broken by Flow's own self-correction, and I-4 as written misses the main-input rule. Its strengths are carried into I-5.

Risks we accept:
- Scope is tight. Every feature except the hero loop stays thin and is built as plain computation.
- The data is synthetic and labelled so, and live SMS and email fetching are out. Say so in the video.
- "Unused" is only ever "possibly unused, still using it?"
- Claims of uniqueness are out, because jAI, AiXpense and SpentyAI come close on parts. We claim only the specific combination.

## Decision

2026-10-31 · Chosen: I-9 Paisa Panchayat, full scope · By: the user · Reason: wanted a more distinctive idea than I-5 Munshi, combining the Panchayat with their complete money ledger, and chose full scope over the recommended thin build. Backup: the I-5/I-1 spine.

Earlier the same day, I-5 Munshi was chosen and then superseded when the user reopened ideation.
