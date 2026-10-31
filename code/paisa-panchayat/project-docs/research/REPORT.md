# Agentic AI Hackathon (Product Space × Wispr Flow): research report

Prepared 2026-10-31 · 10.5 h before the deadline · Confidence key: High = official source or several independent sources · Med = one credible source · Low = inferred

Research depth: about 10 minutes per angle, mostly from search snippets. Anything below High should be checked before it goes in the pitch.

## 1 · The hackathon at a glance

| | |
|---|---|
| What it is | A one-day event to build an AI-powered product from scratch, using your voice through Wispr Flow [1] · High |
| Organiser and sponsors | Product Space, an Indian PM-career platform, in collaboration with Wispr Flow [1][7] · High |
| Format and team rules | Fixed problem statements, pick 1 of 5 [2]. Team size and venue are not on the page [1]. We are solo. |
| Tracks / problem statements | Content repurposing, exam-prep tutor, meeting-to-execution, **personal finance coach (ours)**, career pivot coach [2] · High |
| Key dates | Kickoff 2026-10-31 12:30 IST · **project submission 2026-10-31 23:59 IST** · LinkedIn submission 2026-11-01 23:59 IST · Demo Day and winners to be announced [1] · High |
| Prizes | Not stated [1]. An earlier Product Space hackathon listed about ₹3,000 / ₹2,000 / ₹1,000 plus certificates [8][9] · Low-Med |
| Submission requirements | Final project through the dashboard form, whose fields sit behind login [1]. LinkedIn post links plus a likes and comments screenshot [1] · High |
| Eligibility and rule gotchas | Build from scratch on 31 Oct [1]. Build by voice, and the product's main input must be natural speech captured through Wispr Flow [2] · High. The kickoff added no new rules (the user, 2026-10-31). |

### Judging criteria

| Criterion | Weight | What it means in practice | Source |
|---|---|---|---|
| Wispr Flow usage | 20% | How you used voice to build. Show it in the submission and the LinkedIn posts | [1] |
| Prototype quality and UX | 20% | No detail published; a working, polished prototype (Low) | [1] |
| AI integration | 20% | No detail published; AI doing real work beyond a chat wrapper (Low) | [1] |
| Problem understanding | 15% | No detail published; covering the brief and India's real constraints (Low) | [1] |
| LinkedIn content and engagement | 15% | Posts about the build; engagement is likes plus comments | [1] |
| Innovation and creativity | 10% | No detail published | [1] |

Bonus on top of the 100: rank 1 = +10 · ranks 2–3 = +9 · ranks 4–7 = +8 · ranks 8–15 = +7 · anyone else who posts and submits = +6 [1] · High. Tag both Product Space and Wispr Flow [3].

## 2 · The problem statement

Problem 04, Personal finance coach with a living money model: budgeting apps categorize transactions and stop there, without understanding a person's goals or adapting as life changes [2]. The sponsor's evident intent is a system that keeps a persistent model of someone's money, is updated by natural speech, and turns rambling speech into structured output [2] (Low on intent).

## 3 · What needs to be built

**Mandatory, all from the brief [2]:**

1. Ingestion of messy PDF, CSV and SMS statements, with automatic categorization
2. A correction loop: the user fixes a category and the system learns the rule
3. Recurring payment and subscription detection, with alerts when one changes or goes unused
4. A persistent profile: income, fixed costs, emergency fund, goals with target dates
5. A goal planner with what-if simulation ("cut dining out by 30%", "rent goes up")
6. Nudges when spending drifts off plan
7. A monthly review report
8. Guardrails: it educates and models scenarios, and never recommends specific securities
9. Natural speech through Wispr Flow as the main input, turned into structured output

**Also required:** the project submission, built by voice, and the LinkedIn posts [1][2].

**Implied but rewarded (Low):** visible proof of voice building, raw speech shown next to structured output, and a short demo. The submission form may require more.

## 4 · What already exists

### The sponsor's technology we can use

| Product / API | What it does | Access (sandbox, keys, cost) | Limits | Docs |
|---|---|---|---|---|
| Wispr Flow app | Dictation into the focused text field on Mac, Windows, iOS (keyboard) and Android [5][6] · Med-High | Free plan, or Pro at $15/mo ($12/mo annual); students 50% off [5] · High | Free plan is "limited words per week" with no number given [5]. Older reviews say 2,000 a week, likely stale [10] · Low | [5] |
| Wispr Voice Interface API | WebSocket and REST transcription with self-correction, filler removal and name fixes, 100+ languages [4] · High | API key on a backend, or short-lived client tokens [4]. Whether a participant can get a key today is unknown | Pricing and limits not published on that page [4] | [4] |

### Existing solutions and prior art

| Name | What it does | Who's behind it | The gap it leaves | Source |
|---|---|---|---|---|
| axio (ex-Walnut) | SMS expense auto-categorization | axio | No LLM, voice or coach found · Low-Med | [14] |
| ET Money | Rules-based recommendations | 360 ONE (acquired 2024) | Not agentic · Low-Med | [14][16] |
| INDmoney | AI portfolio summaries and alerts, Pro ₹999/yr | INDmoney | Portfolio-centric, not budget and goal modelling · Low-Med | [14][15] |
| Fi Money | Neobank | Google-backed | Wound down banking in Mar 2026 and pivoted to AI and enterprise · Med | [12] |
| Jupiter | Neobank | Jupiter | Dropped its SBM deal to focus on profitability · Med | [13] |
| Cleo | AI coach with voice and memory (Cleo 3.0) | Cleo | Closest comparable. About 62% of 2025 revenue estimated from cash advances. No India presence found | [17][18] · Med |
| Monarch | Budgeting and goals | Monarch | Users complained about the Goals rebuild and intrusive AI · Low-Med | [20] |
| YNAB, Copilot | Budgeting | Each company | No conversational what-if found · Low | [21] |

Corrected 2026-10-31: the first search found no India product combining goals, what-if and voice, but the skeptic reviews found close ones (see Follow-up research). CRED and Money Manager were not checked. Never say "no one does this", and don't pitch "no India voice coach".

**Reusable code:** `indian-finance-parsers` and `StmtForge` for card PDFs, with password attempts in StmtForge [22][23]. `transaction-sms-parser` (JS), `upi_sms_parser` (Dart, MIT) and FinEE (Python) for SMS [24][25][26] · Med. Check licences before copying; the Beancount importers for Indian banks are GPL or AGPL, so avoid them (notes [7] of the prior-art angle). Savings-account PDFs will likely need custom `pdfplumber` work [22]. SMS templates can change, and UPI autopay may send no SMS, so reconcile with statements [27].

**Sample data:** no public synthetic Indian statement dataset was found. The SMS formats in `research/notes/prior-art-market.md` are from memory and unverified, so use them as test hints only.

### Past winners

Not found. Earlier Product Space hackathon listings say judging rewards product thinking, business innovation, execution velocity and final presentation, not just code [8][9] · Low-Med. The panel for this event is unknown.

## 5 · Market and business model

- **Who has the problem:** about 27% of Indian adults are financially literate per NCFE (survey year unclear) [37]. Account Aggregator personal-finance users stand at 5.96 crore, self-reported by Sahamati [35][36] · Med. No Gen Z, millennial or BNPL figures were found.
- **Cost of the problem:** household debt is 45.5% of GDP (Sep 2025). Small-ticket loan delinquency reached 6.4% in Mar 2026, up from 4.5% two years earlier [39] · Med.
- **Market size:** no India personal-finance app figure was found. Use the 5.96 crore users as the best proxy [35] · Low.
- **How similar products make money:** Cleo earns mostly from cash-advance fees plus $2.99–19.99/mo subscriptions [18]. INDmoney Pro costs ₹999/yr [14]. Copilot costs $95/yr [21]. Indian apps commonly cross-sell (Low).
- **Viable models for us (Low, our inference):**
  - Subscription around ₹999/yr, because a coach with no products to sell stays unbiased.
  - Free coach with a paid handoff to SEBI-registered advisers, which keeps the app itself out of advice.
  - White-label for banks and employers, which fits the Fi and Jupiter lesson on bank-partner economics.
- **Regulation and risks:**
  - SEBI's Jan 2025 circular and FAQs allow education but not advice or performance claims [31][32] · Med; the final circular text was not read.
  - DPDP Rules were notified in Nov 2025 with an 18-month phase-in, so about May 2027 [33][34] · Med. Show consent and delete-my-data anyway.
  - Account Aggregator is the proper production data route [35][36] · Med. Use uploads in the demo and name AA as the production path.
  - RBI e-mandates require a pre-debit notice at least 24 h ahead, and recurring debits up to ₹15,000 need no fresh OTP [28][29] · Med, news level. Those notices are an early signal for recurring detection (Low).

## 6 · Technology landscape

- **Mature:** `pdfplumber` and `pikepdf` for PDFs [22][23], regex SMS parsers [24][26], structured LLM output (Low; general knowledge).
- **Available but uncertain:** Wispr's API, because key access is unknown [4]. Not needed to meet the rule, since Flow can type into a plain text box.
- **Web-app detail:** use a plain `<textarea>` for dictation. Dictation can't be detected directly, only inferred from large input bursts (Low; inference, no source found).
- **Prompt injection:** transaction narrations are untrusted input. Keep them in delimited fields, accept only JSON with an allowed category list, and never let narration text trigger a tool (Low; inference).

## 7 · Link to our project

- **Where judges' points are:**
  - **35 of 100 points don't depend on the product's features:** Wispr usage (20) and LinkedIn (15) [1]. The bonus adds up to 10 more [1]. Capturing evidence is core work and has to start now.
  - **Prototype and AI (40 points):** a fast, polished path through the money model beats nine shallow screens (Low).
  - **Problem understanding (15 points):** Indian SMS and UPI data, SEBI-safe guardrails and "possibly unused" honesty show real understanding (Low).
- **White space:** a persistent, goal-aware model that speech updates, with corrections that become rules. Categorizers don't hold goals, and portfolio apps don't model budgets [14][15] · Low-Med.
- **What Flow changes:** Flow already removes fillers and applies self-corrections [4]. What's left is run-on, multi-topic text, vague amounts and dates, Hinglish, and contradictions across turns (Low; inference). So the agent's value is structuring and reconciling, including "that's changed since last time", rather than cleaning up "um".
- **Unfair advantages:** Claude Code does most of the typing work, and dictating to it counts as the required voice building [2]. Node, npm, Python, git and gh are installed (checked locally).
- **Constraints that shape any idea:**
  - Solo, with 4.5 h to the 17:59 IST freeze and 10.5 h to the deadline.
  - All nine items above are required, so each needs at least a working thin version.
  - No LLM API key is set in the shell (checked locally), and `vercel` is not installed.
  - The Flow free plan has a weekly word cap of unknown size [5], which could run out mid-build.
- **Early signals for ideation:**
  - One voice box drives everything: statements of fact, corrections and what-ifs all arrive as speech.
  - Show raw dictation next to a visible change to the model. It proves voice input and the living model in one shot.
  - A contradiction moment, such as "actually my rent went up", which updates the plan and the goal date live.
  - Speak a correction once, and matching future transactions get categorized correctly.
  - A guardrail moment: ask "which mutual fund should I buy?", get a clear refusal, and get a modelled scenario instead.
  - Use synthetic data with one real PDF path. Don't spend hours on bank-specific parsers.

## 8 · Open questions

| Question | Why it matters | Who can answer it |
|---|---|---|
| What does the submission form ask for: video, live URL, repo? | Sets the ship plan, and whether we must deploy | The user (logged in) |
| How much Wispr Flow quota is left, and is there a usage stats screen? | Quota could run out mid-build; stats are evidence | The user (Flow app) |
| Which LLM key will the product use? | The product can't run without one | The user |
| Can we get a Wispr API key today? | Optional stretch only; the textarea route already meets the rule | wisprflow.ai/developers |
| Demo Day date, format and panel | Sets the pitch style and timing | Product Space support |
| Prizes | Not needed for the build | Product Space support |

## 9 · Sources

All accessed 2026-10-31. Angle: E = event-sponsor, P = prior-art-market.

1. Hackathon details · https://theproductspace.in/ai-hackathon-details · saved at `research/event-page.txt` · E
2. Problem statements · https://theproductspace.in/ai-hackathon-details/problem-statement · saved at `research/problem-statements-page.txt` · E
3. LinkedIn templates · https://theproductspace.in/ai-hackathon-details/linkedin-templates · E
4. Wispr Flow Voice Interface API docs · https://api-docs.wisprflow.ai · E
5. Wispr Flow pricing · https://wisprflow.ai/pricing · E
6. Wispr Flow, Wikipedia · https://en.wikipedia.org/wiki/Wispr_Flow · E
7. Product Space homepage · https://theproductspace.in · E
8. Startup Grants India listing (search summary) · https://www.startupgrantsindia.com/agentic-ai-hackathon-2 · E
9. Internshala listing (search summary) · https://internshala.com/competitions/agentic-ai-hackathon-2/ · E
10. eesel.ai on Wispr pricing, 2025 (search summary) · https://www.eesel.ai/blog/wispr-flow-pricing · E
11. Wispr press release on finanzen.net (search summary; background) · https://finanzen.net/nachricht/aktien/developers-are-ditching-their-keyboards-as-wispr-flow-expands-to-new-platforms-14312035 · E
12. TechCrunch on Fi, 2026-03-11 · https://techcrunch.com/2026/03/11/india-neobank-fi-winds-down-banking-services-on-its-platform · P
13. Whalesbook on Jupiter, 2026 · https://www.whalesbook.com/news/English/bankingfinance/Jupiter-Money-Abandons-SBM-India-Deal-to-Focus-on-Profitability/69b275ad17d794d3dcfc3137 · P
14. Richify comparison, undated · https://www.richify.ai/in/best-ai-personal-finance-app · P
15. Investor Toolkit, undated · https://investortoolkit.pages.dev/best-ai-tools-finance.html · P
16. TechCrunch on ET Money, 2024-06-12 · https://techcrunch.com/2024/06/12/indias-360-one-acquires-mutual-fund-app-et-money-for-44m · P
17. Cleo 3.0 launch, 2025 · https://techintelpro.com/news/finance/financial-services/cleo-30-launches-as-ai-financial-coach-with-voice-and-memory · P
18. Sacra on Cleo, 2025-26 · https://sacra.com/c/cleo · P
19. ARR Club on Cleo (background) · https://www.arr.club/cleo/cleo-arr-hits-250m · P
20. Monarch subreddit snapshot, 2025-12 · https://reddit.sentinel-team.org/subreddits/MonarchMoney/snapshots/2025-12-19T07%3A11%3A21.8753Z · P
21. Budget app ranking, 2026 · https://unstar.app/blog/ynab-rocket-money-monarch-everydollar-copilot-budget-apps-ranked-2026 · P
22. indian-finance-parsers · https://pypi.org/project/indian-finance-parsers/ · P
23. StmtForge · https://pypi.org/project/stmtforge/0.1.0/ · P
24. transaction-sms-parser · https://github.com/saurabhgupta050890/transaction-sms-parser · P
25. upi_sms_parser · https://pub.dev/packages/upi_sms_parser/example · P
26. FinEE · https://pypi.org/project/finee/ · P
27. UPI tracking tutorial · https://dev.to/automate-archit/automate-your-upi-transaction-tracking-60-lines-of-python-free-works-offline-5gcm · P
28. Business Today on e-mandates, 2026-04-21 · https://www.businesstoday.in/personal-finance/news/story/rbi-caps-recurring-payments-at-rs15000-without-otp-under-new-e-mandate-framework-526759-2026-04-21 · P
29. Business Today on auto-debit, 2026-05-02 · https://www.businesstoday.in/personal-finance/news/story/rbi-auto-debit-rules-explained-what-new-changes-mean-for-your-upi-and-card-payments-528507-2026-05-02 · P
30. Juspay mandates docs (background) · https://juspay.io/mandates/docs/mandates/description · P
31. FoxMandal on SEBI finfluencer FAQs, 2025 · https://foxmandal.in/news/cutting-ties-with-finfluencers-sebi-distinguishes-between-education-advice/ · P
32. Business Standard on the SEBI circular, 2025-01-30 · https://www.business-standard.com/markets/news/sebi-finfluencer-circular-live-stock-data-market-education-rules-125013000571_1.html · P
33. PIB DPDP Rules, 2025-11 · https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf · P
34. YourStory on DPDP, 2025-11 · https://yourstory.com/2025/11/digital-personal-data-protection-dpdp-rules-2025-rollout-over-18-months · P
35. New Kerala on Account Aggregators, 2026-06-24 · https://www.newkerala.com/news/a/indias-account-aggregator-ecosystem-facilitates-nearly-38-crore-263.htm · P
36. Sahamati newsletter, Jan 2026 · https://sahamati.org.in/varta-the-sahamati-newsletter-january-2026/ · P
37. NCFE Annual Report 2022-23 · https://old.ncfe.org.in/images/pdfs/annual_reports/Annual_Report_2022-23.pdf · P
38. Business Standard on the S&P survey, 2015 (background) · https://www.business-standard.com/amp/article/pti-stories/76-indians-not-financially-literate-says-s-p-survey-115121500418_1.html · P
39. Business Today on household debt, 2026-07-22 · https://www.businesstoday.in/latest/economy/story/indias-household-debt-rises-to-45-5-of-gdp-non-housing-retail-loans-account-for-58-4-show-data-544604-2026-07-22 · P
40. Business Today on household savings, 2026-06-18 (background) · https://www.businesstoday.in/latest/economy/story/declining-household-savings-pose-risks-to-indias-credit-growth-engine-report-537507-2026-06-18 · P

## Follow-up research

### 2026-10-31, from the ideation skeptic reviews

Details and links are in `docs/reviews/ideate-skeptic-*.md`. These are search-level findings and weren't independently re-checked.

- **Closer prior art in India:**
  - [jAI from Finvasia](https://techlomedia.in/2026/05/finvasia-launches-jai-a-voice-based-ai-finance-assistant-on-jumpp-123368/): Hindi and English voice for spending questions, budgets and savings planning.
  - [AiXpense](https://www.producthunt.com/products/aixpense/makers): voice in 22 languages including Hinglish, with a weekly AI coach.
  - [SpentyAI](https://mwm.ai/apps/spentyai/6762543155): "AI accountant", first released May 2026, with pasted SMS, recurring scans and a 24-month projection (self-reported).
  - [expenseOS](https://peerlist.io/sumiet/project/expenseos-ai-expense-tracker-for-india) and [Cashiro](https://apt.izzysoft.de/fdroid/index/apk/com.ritesh.cashiro?repo=main) are also nearby.
- **Flow behaviour:** Wispr's page says "5 pm, actually 6" becomes "6 pm" ([why-flow](https://wisprflow.ai/why-flow)). Its docs say Hinglish must be selected explicitly and rapid switching within a sentence isn't handled perfectly ([docs](https://docs.wisprflow.ai/articles/3191899797-use-flow-with-multiple-languages)). Not yet tested by us.
- **Gemini data terms:** unpaid-tier content may be read by human reviewers, and the terms say not to submit sensitive or personal information ([terms](https://ai.google.dev/gemini-api/terms)). Use synthetic data only.
- **Account Aggregator:** Sahamati says a data recipient must be registered with a financial regulator ([FIU page](https://sahamati.org.in/financial-information-user-fiu)), so a startup would need a licence or a partner. Sources differ on the current directions, so verify before stating it.
- **"CA" as a name:** section 24 of the Chartered Accountants Act penalizes non-members using the designation ([text](https://www.advocatekhoj.com/library/bareacts/charteredaccountants/24.php)), and ICAI warns against the "CA." prefix ([notice](https://www.icai.org/post/pre-conditions-for-using-the-designation-chartered-accountant-07-08-2009)). No case on software or AI was found. Not legal advice.
- **Gemini price lookup:** Google Search grounding returns URL citations ([docs](https://ai.google.dev/gemini-api/docs/google-search)). On the free tier, only Gemini 2.5 Flash and Flash-Lite include it, at 500 requests a day. Gemini 3 and newer need a paid key, with 5,000 free searches a month, then $14 per 1,000 ([pricing](https://ai.google.dev/gemini-api/docs/pricing)). Free-tier content is used to improve Google's products.
- **Retail prices vary widely:** one iPhone 17 256GB showed ₹99,900 on [Apple India](https://www.apple.com/in/shop/buy-iphone/iphone-17) and lower deal figures elsewhere (`docs/reviews/ideate-skeptic-paisa-panchayat.md`). Read one named source and label it list price.
- **SMS permission:** Google Play lists SMS-based money management as an exception, subject to review ([policy](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)). It needs a native Android app, so it's a production path rather than a build for today.
