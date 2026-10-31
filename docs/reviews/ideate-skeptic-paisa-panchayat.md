# Skeptic review: I-9 Paisa Panchayat

2026-10-31 · 9.5h left · Verdict: SERIOUS

**Plain answer on fatality:** one objection is fatal as carded: scope. The card needs about 490 minutes by my estimate and there are 210. It stops being fatal if the cuts below are accepted now, before any code. Nothing else here kills the idea. The panchayat itself is a gimmick as carded, and that is fixable in about 10 minutes of design.

All minute figures are my estimates, not measurements. Web evidence is search-level unless marked "fetched".

## Steelman

Everyone on problem 04 will ship ingestion, a dashboard and a chat box. This idea gives a judge one thing to remember: your goals fight over your money in your own language, the numbers are real, and nothing moves until you rule. It is built on a correct ledger that treats cash, lending and transfers properly, which Indian users recognise from their own lives. The name and clip also suit LinkedIn, and LinkedIn (15 points, plus up to +10) is worth more than Innovation (10 points).

## Objections (ranked, most damaging first)

### 1. The card is about twice the window, and its extras are not what the brief asks for. Severity: Fatal as carded, Manageable if cut now

- Evidence:
  - The brief requires eight items plus speech input (`research/REPORT.md` section 3). Lent and borrowed ledgers, cash wallets, EMIs, free-form Q&A and live prices are **not required**. The card adds them on top of I-5, whose own card already says scope is "the biggest risk".
  - Build order and time budget are below. As carded: about 490 min. Available: 210.
- Why it costs points: Prototype quality (20) and AI integration (20). Nine shallow screens lose to one fast path (`REPORT.md` section 7).
- What would resolve it: accept the thin column and the drop list below.

| # | Part | As carded | Thin | Smallest honest version | Clock (IST) |
|---|---|---|---|---|---|
| 1 | Flow test, screen recording on | 15 | 10 | 20 Hinglish phrases with amounts, scored. This footage is also build evidence | to 14:40 |
| 2 | Skeleton, seed data | 30 | 15 | One page, SQLite or JSON file, 3 synthetic months, labelled synthetic | to 14:55 |
| 3 | Ledger core | 60 | 25 | Balanced postings, event log with undo, golden fixtures (objection 3) | to 15:20 |
| 4 | Profile, goal engine, what-if | 30 | 20 | Surplus, earmarks per goal, projected dates. Code only | to 15:40 |
| 5 | Dictation to entries, confirm card | 45 | 25 | Multi-entry parse, quoted source phrase per row, confirm before write | to 16:05 |
| 6 | Panchayat and ruling | 60 | 40 | Max 3 speakers, 1 round, 3 code-generated plans, parsed ruling, dates move, undo | to 16:45 |
| 7 | Guardrails | 15 | 10 | Closed action list, output validator, 10 Hinglish attack prompts | to 16:55 |
| 8 | Ingestion, categorization | 45 | 20 | Paste SMS (2 templates), one CSV, one synthetic PDF layout, allowed category list | to 17:15 |
| 9 | Correction rule | 20 | 10 | Spoken fix writes a visible rule, applied in code before any LLM call | to 17:25 |
| 10 | Recurring, nudge, monthly review | 65 | 20 | One "import next month" control fires all three, on one screen | to 17:45 |
| 11 | Munshi Q&A and price | 60 | 15 | 3 intents (goal progress, person balance, month spend) and one price source | to 17:59 |
| | UI polish and integration | 45 | 0 inside the window | Goes to 18:00–19:59. No new features after 17:59 | |
| | **Total** | **about 490** | **210** | | |

**Drop in this order:**
1. Web search for price (keep one official page, or a typed price the user confirms).
2. Free-form Q&A (keep the 3 intents; everything else gets "not in your file").
3. EMI principal and interest split (keep a fixed monthly obligation with instalments left, and say so).
4. Automatic matching of spoken entries to imports (keep a "same as this?" question on exact amount within 2 days).
5. Second debate round.
6. Monthly-budget agents (keep commodity and date goals plus Emergency Fund; the user asked for budgets, so add one back only if time remains).
7. Split bills, refunds and write-offs.

**Never cut:** build-by-voice footage, code-only numbers, confirm before write, ledger fixtures, guardrails. Each of the 8 required items also stays at its thin version, because all are required.

**Things that would be dishonest to show, and the honest form:**

| Temptation | Why it is dishonest | Honest form |
|---|---|---|
| "Each goal is an agent" when one prompt writes every line | It isn't a multi-agent system | Either separate calls with separate fact sheets, or say "one model, separate voices" |
| A price shown as live but hardcoded or cached | Fake capability | Show source URL and checked-at time. A cached value is labelled cached |
| Canned debate or ruling | Fake AI | One unedited take plus a second ruling that gives a different result. Jump cuts over latency are fine |
| "It learns" | Only true if behaviour changes | Show the rule row, import again, show the rows change |
| "Unused" subscription | Transactions can't show use | "Possibly unused, still using it?" |
| Alerts | There is no live feed | Say "simulated next month" on screen |
| "SMS and PDF ingestion" | Paste only, one layout | Say so in the video, name Account Aggregator and Android as production routes, with `REPORT.md`'s caveat on AA licensing |
| "Persistent" | A session state would look identical | Restart the app on camera |
| "Recognizes your voice" (in the builder's dictation) | No speech code exists | "Flow dictates, the agent structures" |
| Uniqueness claims | jAI, AiXpense and DhanRakh overlap | Claim only the specific combination |

### 2. The panchayat as carded is a table in costume. Severity: Serious

- Evidence:
  - The card's own rule, "using only numbers calculated in code", means the debate cannot contain information the table lacks. As carded, the dialogue adds zero facts. It only adds phrasing.
  - Debate research gives no support for a quality claim: multi-agent debate often fails to beat single-agent baselines ([Smit et al.](https://arxiv.org/pdf/2311.17371), [Zhang et al.](https://arxiv.org/html/2502.08788v3)), and competitive formats can reduce to misleading messages ([Chen et al.](https://arxiv.org/pdf/2510.20963)). These measure accuracy on benchmarks, not personal decisions, so they are indirect.
  - Not distinctive by construction: the idea came from an LLM session ("the second idea that you gave", in the dictation). Others asking an LLM for a unique India finance idea may get the same thing. Debate-council hackathon projects exist in other domains ([AI Treasury Council](https://aitc-pi.vercel.app/), [Notion debate arena](https://dev.to/aditya_007/i-built-a-multi-agent-ai-debate-arena-inside-notion-using-mcp-meet-the-council-5b9e)). The event is literally an agentic hackathon.
  - Rubric weight: Innovation is 10 of 100. The name helps more through LinkedIn.
- Why it costs points: AI integration (20). An informed judge will ask "why not a table?" Five lines of persona text is what the report calls a chat wrapper.
- What would resolve it: make it do three things a table cannot.
  1. **It searches for plans the user didn't think of.** Code enumerates feasible reallocations and returns 3 plans. Goals speak only to defend or concede a plan, so "Goa gives ₹5k if Flat does too" is a real computed coalition. A table shows the damage of one choice; this finds the options. This is the core of the substance.
  2. **It remembers why, in your words.** A goal's dictated reason is stored and quoted: "You said in March this is for the deposit." Statements don't contain this. It also makes speech the source of the argument.
  3. **Rulings become precedent.** A ruling is stored and cited next time: "In September you ruled Goa before iPhone." This extends the required correction loop from categories to decisions, and it is the "living model" the brief wants.
  - Only affected goals speak. Unaffected goals stay silent, and code decides who is affected.
  - Keep the table on screen as the authority. Dialogue is at most 3 short lines beside it.
  - Test: mute the dialogue and show only the plans table. If a viewer loses nothing, the costume is all you have. In that case cut the prose and keep the label, because it costs minutes and adds failure modes.
  - Cheap check on convergence: ask 5 fresh LLM sessions for a unique problem-04 idea for India and count panchayat or debating-goal answers. Don't spend more than 5 minutes.

### 3. The ledger will double count somewhere, and voice plus import adds a case the card doesn't mention. Severity: Serious

- Evidence:
  - Transfer handling is standard practice ([Toshl](https://toshl.com/blog/wp-json/wp/v2/posts/5195), [Quicken forum](https://community.quicken.com/discussion/comment/20026749)). But real tools still get it wrong: an MMEX user reports $200 of actuals for $100 of spending on a card purchase plus bill payment ([thread](https://forum.moneymanagerex.org/viewtopic.php?p=27094)). I did not find how axio or Money Manager handle it.
  - The case the card omits: a user says "Rohit ko 2000 diye", and the CSV import later shows UPI to ROHIT for 2,000. This is one transaction from two sources, and it follows directly from a talk-first ledger that also imports statements.
  - Card demo inputs are incomplete: "iPhone on EMI" has no tenure or rate, "sister's wedding in December" has no amount, and "till bonus" needs a bonus date and amount. The engine cannot compute any of these. Filling them silently would break "numbers calculated in code".
  - "How much have I saved for the iPhone?" has no answer in a ledger. Savings are fungible, so it requires an earmark model the card doesn't describe. The whole panchayat rests on it.
- Why it costs points: Problem understanding (15) and Prototype (20). One wrong total on video undoes the "correct khata" claim, and this panel probably does notice money that doesn't add up (Low; panel unknown).
- What would resolve it: one rule and a fixture file written before any feature. Every event is a balanced posting between accounts; **spending is only the sum of postings to expense accounts**. Earmarks are labels on balances, not postings.

| Fixture | Expected |
|---|---|
| ATM 10,000, then 10,000 cash to plumber | Spend 10,000 once (the builder's own case) |
| ATM 10,000, 6,000 logged | Spend 6,000. Cash wallet shows 4,000 "not yet explained", not auto-spent |
| Cash spend with no withdrawal on file | Wallet goes negative, so ask for an opening balance. Don't hide it |
| Card purchase 5,000, bill 5,000 from bank | Spend 5,000 once. Bill is a transfer |
| Lend Rohit 2,000, he repays 1,500 | Spend 0, income 0, Rohit owes 500 |
| Borrow 5,000 from Amit, repay it | Income 0, spend 0, Amit 0 |
| Dinner 3,000, friends owe 2,000 (cut if short of time) | Spend 1,000, lent 2,000 |
| iPhone on EMI, 12 instalments | Instalments count monthly. The full price never also counts. State this view on screen |
| Same transaction in SMS and CSV | One row (reference number, or amount, date and account) |
| Spoken 2,000 plus imported 2,000 | "Same as this?" question, and one row after yes |
| Earmark 5,000 to Goa | Spend 0 |

  For missing inputs, ask one spoken follow-up ("wedding ka kitna?") or show a labelled assumption chip the user can change. Seed the wedding and bonus in the file for the demo, labelled synthetic.

**How a mis-heard amount gets caught.** Flow removes self-corrections before the app sees the text ([why-flow](https://wisprflow.ai/why-flow)), and its Hinglish mode has an admitted weakness with rapid switching ([docs](https://docs.wisprflow.ai/articles/3191899797-use-flow-with-multiple-languages)). So the app can't always tell a mis-hearing from a correction, and "hired" for "hiked" shows the type of error. Five cheap checks, all in code:
1. **Source check:** the parsed amount must appear in the text as digits or number words. If not, block and ask.
2. **Quoted confirm card:** each row shows the phrase it came from, with amount large. Nothing is written until confirm.
3. **Outlier check:** over 3× the category median, or over a fixed limit, always asks.
4. **Balance sanity:** a negative cash wallet or a repayment larger than the debt raises a question.
5. **Undo:** the event log reverses any entry, and a typed fix is always available.

Also show "read as: hiked" so a repaired word is visible. Note what stays uncaught: a plausible wrong amount (15,000 for 50,000) that passes as number words. Only the human on the confirm card catches that, so say so instead of claiming the app catches every error.

### 4. Live price can show a confidently wrong number, and the number changes the goal percentage. Severity: Serious, but cheap to fix

- Evidence, for one phone (iPhone 17 256GB) in today's search results:
  - **₹99,900** on [Apple India](https://www.apple.com/in/shop/buy-iphone/iphone-17) (fetched today), against a launch price of ₹82,900.
  - ₹86,999 listed and ₹81,999 after a card offer, on Flipkart ([Cashify](https://www.cashify.in/news/iphone-17-flipkart-cost-drops-below-rs-55000-during-big-billion-days-sale), snippet).
  - ₹58,030 ([My Mobile India](https://www.mymobileindia.com/web-stories/flipkart-sells-iphone-17-for-58030-ahead-of-august-1-price-hike/), fetched), ₹47,405 ([Outlook Business](https://www.outlookbusiness.com/deeptech/tech/apple-iphone-17-price-in-india-drops-to-47405-on-flipkart-check-deal-price-and-offers), headline), "below ₹30,000 with exchange" ([Cashify](https://www.cashify.in/news/iphone-17-price-drops-below-rs-30000-with-exchange-offers-on-flipkart), headline).
  - I did not verify these deal figures, and that's the point: a search-grounded model sees all of them. I found no benchmark of Gemini on Indian retail prices.
- The damage: ₹41,450 saved is 50% of ₹82,900, 41.5% of ₹99,900, 47.6% of ₹86,999 and 71.4% of ₹58,030. The same savings can read as a setback or a gain, depending on which page the model picked.
- Failure modes on video:
  - Wrong variant or generation (the current iPhone may not be the iPhone 17).
  - Deal, exchange or card-effective price taken as the price.
  - A stale article.
  - A cited page that doesn't contain the number. Citations give URL, title and text span ([Gemini docs](https://ai.google.dev/gemini-api/docs/google-search), fetched), which proves nothing about the figure.
  - The model answering without searching.
  - JSON schema failing with the search tool. A [forum thread](https://discuss.ai.google.dev/t/rest-api-grounding-and-json-responses-not-compatible/73101) shows 400 errors on older models. Current behaviour is unverified, so test your model; the usual fix is two calls.
  - Price comes back flat or lower, and the planned line doesn't happen.
  - Search query costs: billed per query on Gemini 3+, with a [forum report](https://discuss.ai.google.dev/t/issue-with-gemini-3-products-price-uptick-4x-due-to-generate-content-search-query-gemini-3/139266) of over-billing.
- Why it costs points: AI integration (20) if it works, and credibility if a judge knows the price.
- What would resolve it:
  - **Read one named source, not the web.** Fetch Apple India's page with the URL context tool or a plain fetch, extract the price for the stored variant, and check that the number literally occurs in the fetched text. Fall back to "couldn't verify, tell me the price". Code does the re-base.
  - Show "Apple India list price, not deal price" with the URL and checked-at time. Ask the variant when the goal is created.
  - **There is a real demo number here.** ₹82,900 to ₹99,900 turns 50% into 41.5%, almost exactly the builder's "50% becomes 40%" example. But a [report](https://www.mymobileindia.com/web-stories/flipkart-sells-iphone-17-for-58030-ahead-of-august-1-price-hike/) dates the expected hike to August 1 (unconfirmed by Apple), so the builder's "planned last month" would be false. Seed the goal as planned before the hike, at a labelled reported launch price, and confirm the date yourself.
  - Handle price down and price flat as tested outcomes.

### 5. Panchayat can be mostly reading, not speaking, and a short ruling doesn't show what the rule asks. Severity: Manageable

- Evidence:
  - Rule: "main input is natural speech... filler words, digressions and self-corrections into structured output" (`HACKATHON.md`). The sample ruling is about 8 words, and any keyboard handles it. The debate itself has no input at all.
  - Flow handles fillers and self-corrections itself, so the agent's value is structuring and reconciling (`REPORT.md` section 7).
  - Flow's Hinglish mode writes Hindi in Latin letters and picks one language per dictation ([docs](https://docs.wisprflow.ai/articles/3191899797-use-flow-with-multiple-languages), fetched). The builder's sample mixes Devanagari and English, so it came from another mode. The parser must take both, and the video should use one.
- Why it costs points: Wispr Flow usage (20) and the rule itself. Note the rubric text is about voice **to build**, so build footage earns the larger share, and this rule fit matters mostly for compliance.
- What would resolve it: the rule is met if speech is plainly the main input, and the short ruling doesn't break that. The main speech moments are:
  1. **The khata ramble, as the sponsor moment:** "kal ATM se 10 hazaar nikale, uss mein se 5 plumber ko, Rohit ko 2000 udhar diye, aur haan EMI bhi kat gayi 8400." Four rows of four different kinds, which is painful to type and shows the cash and lending logic in one take.
  2. **The convening ramble,** with reasons.
  3. **A conditional multi-part ruling:** "Goa ko June kar do, iPhone bonus tak ruk jaaye, but if the bonus is under 50, Goa July." Parsed into closed operations, shown as a diff before applying. Short rulings must still work.
  4. **Decision-reason capture:** the app asks "why?" and stores the spoken answer as the goal's reason (objection 2).
  - A plain text box still works for typing, so show the Flow indicator on screen in every take.

### 6. Prior art means the khata earns no novelty, yet consumes most of the build. Severity: Manageable

- Evidence:
  - **Voice plus per-person ledger:** [DhanRakh](https://dhanrakh.pages.dev/blog/udhar-tracking-app-india-who-owes-money) (voice, "Ramesh ko 500 rupaye udhar diye", per-person balances, WhatsApp reminders; Android was listed as coming soon; search snippet only, because the page failed on fetch).
  - **Hinglish voice:** [AiXpense](https://www.producthunt.com/products/aixpense/makers), [jAI](https://techlomedia.in/2026/05/finvasia-launches-jai-a-voice-based-ai-finance-assistant-on-jumpp-123368/), [Khaata AI](https://www.producthunt.com/products/khaata-ai-smart-expense-manager) (voice and shared wallets, details unverified).
  - **Lent and borrowed:** [Pocket Hisaab](https://corex1221.github.io/home.html) (attribution to this URL is from the search summary), [WalletLoop](https://walletloop-marketing.pages.dev/features), [Paisa Experience](https://apps.apple.com/us/app/id1580610374). Khatabook and Splitwise are the names a judge will think of (from general knowledge, not checked today).
  - **Transfer-aware cash:** [Toshl](https://toshl.com/blog/wp-json/wp/v2/posts/5195), and the double-entry [Paisa](https://paisa-docs.pages.dev/guides/introduction) built for Indians.
  - **Goal agents competing:** still no direct match found, at search depth. Nearest: [multi-agent coaching](https://github.com/navin-oss/Hackathon), [multi-agent planning](https://arunabh98.github.io/projects/ai/2025/04/25/multi-agent-ai-financial-planning.html), and ["Buy or Wait?"](https://github.com/jay-2611/AI-Finance-Agent---Hackerrank-Orchestrate-Sept.-2026). Absence in a quick search proves nothing.
  - Also: "manual upkeep is the recurring complaint" about budgeting apps (`research/notes/unique-ideas.md`, Low). "Feed it every financial decision" is still upkeep, just spoken. No survey data on family money flows was found (same notes).
- Why it costs points: Problem understanding (15), if the pitch is "log everything by voice", which is a solved pitch with a known drop-off problem.
- What would resolve it: change the pitch to **"Statements come in by themselves; you only talk about what your bank can't see: cash, who owes whom, and why."** That's a sharper problem statement, it shrinks the input burden, and it justifies the ledger's kinds. Don't pitch the khata as novel. Pitch it as what makes the panchayat's numbers trustworthy.

### 7. Agents with personality will drift into investment suggestions, and the web adds another route. Severity: Manageable, if built in from the start

- Evidence:
  - The brief forbids recommending specific securities. SEBI's framework separates education from advice (`REPORT.md` [31][32]). Commentary says the framework wasn't written for personalized AI output and that the "widely available to the public" carve-out may not fit a tailored reply ([Legal Quorum](https://thelegalquorum.com/artificial-intelligence-and-securities-regulation-rethinking-sebis-approach-to-ai-generated-financial-advice-in-india/), secondary; not legal advice).
  - Exact drift to expect, untested: Emergency Fund says "park this in a liquid fund", Flat says "SIP in an index fund", or a user asks "Reliance ke shares bech du?" mid-ramble. A goal's job is to win, so its prompt pushes towards persuasion. Search results for a price or a plan could bring in product names.
  - A guardrail tested only in Q&A won't cover the panchayat, which is where the risk is highest.
- Why it costs points: required item, Problem understanding (15), and a visible failure on the one feature judges remember.
- What would resolve it:
  - **Closed action list:** agents may only propose delay goal, reduce budget, use surplus, draw emergency fund, skip or defer, and take EMI at a user-stated rate. No "invest" action exists.
  - **Placeholder-only numbers:** agents write `{flat_delay_months}`, and code substitutes the value. A validator rejects any digit or number word in the model's text. Without this, "numbers calculated in code" is a claim, not a property. It also covers Hinglish number words, which a digit regex misses.
  - **Deny-list after generation:** ISIN patterns, ticker and fund-house names, "SIP", "ETF", "FD mein daalo". Retry once, then fall back to a template line.
  - **Attack set of 10 Hinglish prompts** run through both the panchayat and Q&A. Show one in the video: refuse the fund name, then model a labelled scenario with a user-given assumed rate.
  - Treat statement narrations as untrusted input (`REPORT.md` section 6).

### 8. The metaphor carries caste, patriarchy and khap associations, and the card's demo sits right on them. Severity: Manageable

- Evidence:
  - **The risk is real but specific.** Khap panchayats are a separate, informal thing from constitutional ones, but the word is shared. The Supreme Court held in 2018 that khap action against inter-caste couples is illegal ([SCC Online](https://www.scconline.com/blog/post/2018/03/27/khap-panchayats-have-no-authority-to-order-honour-killings-their-activities-are-to-be-stopped-in-entirety-sc/)). Commentators call khaps forums of patriarchy ([Mainstream Weekly](https://mainstreamweekly.net/article2518.html), opinion). "Sarpanch pati" proxy rule by husbands is a live issue ([Drishti](https://www.drishtiias.com/daily-updates/daily-news-analysis/sarpanch-patism)).
  - **The specific catch: the card's own demo has a panchayat ruling on money next to "my sister's wedding".** Panchayat plus woman's wedding plus "ruling" is the closest the demo could come to the khap image, and it's not needed.
  - **The mainstream reading is warm.** TVF's *Panchayat* had its biggest opening with season 4 and reached 95% of India's pin codes in its first week, per Prime Video ([Indian Broadcasting World](https://www.indianbroadcastingworld.com/?p=80912); self-reported). Article 243D reserves at least a third of seats for women. So I don't think the name alone is a problem, and renaming would throw away real LinkedIn value.
  - **Persona prompts are the likely failure.** Gemini asked for "village elder" comedy may produce words like hukka-paani band (social boycott), caste surnames, or gendered jokes. Not tested.
  - **Naming:** exact "Paisa Panchayat" and "Money Panchayat" not found in today's search or earlier notes, but no trademark search has been done. Many "Paisa" products exist. "Munshi" is crowded in Indian accounting: [Munshi on G2](https://www.g2.com/sellers/munshi), [Munshi IQ](https://munshiiq-website.pages.dev/), [Munshijee](https://inc42.com/company/munshijee). "Khaata AI" sits close to "khata". This matters little for a hackathon and more for any later launch.
- Why it costs points: LinkedIn (15, and bonus). A public post is where this would surface. Probability low, damage high for a solo builder's name.
- What would resolve it:
  - Replace the wedding with a neutral expense in the demo (medical, laptop, Diwali gifts, or rent rise).
  - Frame it as the **gram panchayat as a meeting where your goals are the panch and you are the sarpanch**. Don't use "village" in the one-liner.
  - No elder avatars, turbans, dialect comedy, surnames, or gendered goal personas. Goals are named by goal only ("Flat", "Goa"), and speak as plain Hinglish.
  - Add banned terms to the validator: khap, hukka-paani, biradari, jaati, izzat, and caste names.
  - Show the post to 2 people from different backgrounds, including one woman from a North Indian family, before publishing. Takes 10 minutes.
  - Search the [IP India trademark database](https://tmrsearch.ipindia.gov.in/tmrpublicsearch/) before any launch. Not needed today.

### 9. Video has to land in seconds, and reading dialogue is slow. Severity: Manageable

- Evidence: length limit unknown (`HACKATHON.md`). At about 600 entries and 3 minutes each, watching everything takes 30 hours, so assume skimming (my inference, and 600 is the builder's estimate). A debate rendered as text must be read, and Hinglish text in a small box at normal speed is hard to absorb.
- Why it costs points: Prototype (20), Innovation (10).
- What would resolve it: put the moment in the first 30 seconds. Use large type and show deltas that animate ("Flat: −4 months"). Keep lines under 10 words. Narrate over them if needed. Plan a 90-second version that can stretch to 3 minutes, so the unknown limit doesn't force a recut. Ask Product Space for the limit today.

### 10. Rubric: most points don't depend on this choice. Severity: Manageable, but urgent

| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Wispr usage | 20 | Depends on footage, not idea | Build footage can't be recreated. **It must be recording now** |
| Prototype and UX | 20 | Weak as carded, good if thin | Breadth threatens polish |
| AI integration | 20 | Medium, high with plan search and precedent | Persona prose alone is a wrapper |
| Problem understanding | 15 | Good | Cash, udhaar and Indian formats are real, though the evidence is thin |
| LinkedIn | 15 + bonus | Strongest gain | Name and clip are shareable |
| Innovation | 10 | Good, but only 10 points | Don't overspend here |

Business (who pays, and whether a big player copies it) is not on the rubric. Skip it apart from one line: ₹999/yr, unbiased because it sells no products (`REPORT.md` section 5).

## Kill criteria

All times IST on 2026-10-31. Each has a named consequence.

| By | Test | If it fails |
|---|---|---|
| Now | Screen recording of the build is running | Stop and start it. Nothing else matters as much |
| 14:40 | 20 Hinglish phrases through Flow: at least 18 amounts exact | At 15–17: always confirm, demo uses digits-style speech. Below 15: English-with-numbers demo, no Hinglish claim |
| 15:20 | All ledger fixtures pass | Drop card bills and EMI to a fixed line. Keep cash and lending, the builder's own cases |
| 15:40 | A what-if moves a goal date, from code alone | Cut per-person UI to a read-only list. Everything else waits on this |
| 16:05 | 8 of 10 unseen multi-entry rambles parse with no edit | One entry per dictation, and drop the "ramble" claim. Do not show the good take as typical |
| 16:45 | Dictate, get 3 plans, rule, date moves, undo: works once unassisted | Cut the voices: plans table and ruling, "panchayat" as label only |
| 17:05 | Same test, with voices cut | **Pivot** to the I-5/I-1 spine (ledger, goal engine and parser carry over) |
| 16:55 | 10 attack prompts: no named security reaches the screen | Template lines only, no LLM prose in the panchayat |
| Any time | Rejection validator fires on over 1 in 10 lines, or panchayat takes over 15 s | Collapse to one call with templates |
| 17:15 | SMS and CSV work; PDF on the one layout | PDF last. If it fails, say "PDF not finished" in the video. Don't fake it |
| 17:45 | All 8 required items fire on seed data | Skip item 11 entirely. Q&A and price are not required |
| 17:59 | Price: 5 of 5 runs return the right figure from the one source, or say unverified | Typed price the user confirms. No "live" wording |
| 17:59 | **Feature freeze** | No new features, even if the price is one prompt away. 18:00–19:59 is polish and retests |
| 20:30 | One complete, unedited take exists | Ship the shortest working path with jump cuts |

## One pivot that would survive

**Keep the name; drop "an app for every financial decision".** Build I-5's spine, with the panchayat as its what-if screen: statements arrive by import, you talk only about what the bank can't see, and when a big expense lands, code finds 3 plans, affected goals argue using your own reasons and past rulings, and your ruling becomes precedent. That is the thin column above. It keeps the memorable clip, stays in the window, and falls back to the I-5/I-1 backup with no restart.
