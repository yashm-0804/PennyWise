# Skeptic review: I-2 Say It, See It Move

2026-10-31 · 10h left · Verdict: SERIOUS

No objection is fatal if the team acts on it. The demo line as written is broken for two separate reasons and has to change before anything is built on it. The MUST scope doesn't fit 4 build hours without cuts.

## Steelman

Every finance app stores transactions; few let you change the plan by talking, and none of the ones checked shows the spoken change as a reviewable diff with a deterministic consequence. Keeping the LLM to proposals and the arithmetic to code is a sound way to make LLM output trustworthy on money. One screen shows raw speech, structured change and a moved goal date, so it proves voice input, the living model and agent work in a single shot. No product checked does this exact loop.

## Objections (ranked, most damaging first)

### 1. The MUST scope doesn't fit 4 build hours, and it still omits required behaviour, Severity: Serious
- Evidence:
  - All nine items are required (`REPORT.md` section 3; `HACKATHON.md` checklist). My estimates, assuming thin versions and no rework:

    | Work | Minutes |
    |---|---|
    | Model and version log | 30 |
    | Speech-to-change agent with confidence and questions | 45 |
    | Review UI | 40 |
    | Projection and what-if | 30 |
    | CSV and SMS | 25 |
    | One PDF path | 25 |
    | Categorization and rule learning | 25 |
    | Recurring detection and alerts | 20 |
    | Nudges | 10 |
    | Monthly review | 20 |
    | Guardrails | 10 |
    | Integration and polish | 30 |
    | **Total** | **310, against about 240 available** |

  - All of it has to be dictated, not typed (brief, `research/problem-statements-page.txt` line 23), and proof of that has to be captured along the way.
  - The card lists "recurring detection" but the brief requires "alerts when one changes or goes unused". The card lists "rules" as stored data but has no correction loop that learns them.
  - "Goes unused" has no signal in bank data: a charge looks the same whether or not the service is opened. The report already points to "possibly unused" honesty.
- Why it costs points: Prototype quality and UX (20) and Problem understanding (15). Missing or shallow required items are easy for a judge to spot.
- What would resolve it:
  - Build the core first and treat everything else as thin.
  - Replace "versioned history" with an append-only list of accepted changes and one undo.
  - Replace "confidence levels" with a single "needs your answer" flag.
  - Support exactly one PDF layout, using a synthetic text PDF.
  - Add the two missing items to the plan explicitly.
  - Use the 17:59–19:59 window for hardening only.

### 2. The headline "no wait" is Flow's work, so the product gets no credit for it, Severity: Serious
- Evidence:
  - Wispr's own page says Flow "understands you changed your mind and gives you just the version you meant", with "5 pm, actually 6" becoming "6 pm" ([why-flow](https://wisprflow.ai/why-flow)).
  - A guide gives a near-identical money example: "budget 50K for this, actually, make that 75K" keeps only the final figure ([Sid Saladi](https://sidsaladi.substack.com/p/wispr-flow-101-the-complete-guide)).
  - `REPORT.md` section 7 already concludes this.
  - So the textbox will most likely receive "Rent's going to 34 from January and I want Goa in March." The "raw text" panel then shows a clean sentence, and "32" never reaches the product. I did not run this; it needs the test below.
  - The pages checked don't show Flow exposing the pre-cleanup text to the target app, so the product can't display the correction as a diff.
  - The brief says "your agent has to turn it into clear, structured output" (line 25). A judge who knows Flow will see that the showcased correction belongs to the sponsor's tool.
- Why it costs points: AI integration (20) and Innovation (10). One clean sentence becoming two cards looks like form-filling. If the video implies the agent caught the correction, a sponsor judge can call that out.
- What would resolve it:
  - Dictate the exact line into a plain textarea five times. This takes 2 minutes. If "32" survives some takes, the agent must handle both forms.
  - Credit Flow openly on screen: "Flow fixed what I said. The agent works out what it changes."
  - Move the agent's moment to what Flow can't do: a three-topic ramble, inferring ₹34,000 from "34", resolving which March, and contradicting stored data (see the pivot).

### 3. The demo's date move depends on a number nobody said, Severity: Serious
- Evidence:
  - "I want Goa in March" has no amount, and the projection needs one. My worked example, with assumed inputs of ₹24k/month saved, a ₹4.08L goal and rent rising from ₹30k to ₹34k: the goal lands in Mar 2028 unchanged and in Aug 2028 with a ₹40k Goa trip.
  - At ₹20k for Goa, the date is Jul 2028. That one-month swing equals the effect of rent at 32 instead of 34 (with Goa at ₹40k, also Jul 2028).
  - So the spoken self-correction matters no more than the silent assumption. If the LLM invents the Goa figure, that undercuts the claim that nothing changes without review. If it asks, the one-shot moment becomes two turns.
  - The card also doesn't name the goal that moves, so a viewer sees a date change on an unknown goal.
- Why it costs points: AI integration (20) and Prototype quality and UX (20).
- What would resolve it: Make the clarifying question the feature. The Goa card stays "needs your answer" while the rent card already moves the date, then a spoken "about 40k" moves it again, so the viewer sees two visible moves. Name the goal on screen ("Flat down payment"), and show each change's share of the slip ("rent +3 months, Goa +2 months").

### 4. Ingestion is disconnected from the core idea, Severity: Serious
- Evidence:
  - The card's loop runs from speech to card to model. Uploads, recurring detection, nudges and the monthly review are listed separately and have no defined route into the review step.
  - The brief's what-if example, "cut dining out by 30%" (`REPORT.md` section 3), needs real category totals. If profile numbers are seeded by hand, the required what-if isn't computed from the ingested data.
  - The temptation under time pressure is to fake this link, and a judge watching for a "living money model" would see two apps sharing a tab bar.
- Why it costs points: Problem understanding (15) and Prototype quality and UX (20). The brief's complaint is apps that "categorize and stop"; a disconnected ingester does exactly that.
- What would resolve it: Have one review queue. Every source raises the same change card: speech, statement ("Netflix ₹649 to ₹799"), correction ("always file this as Dining?") and drift. Monthly savings in the projection must come from ingested data. Test: upload a CSV with a higher dining total and check that the goal date moves.

### 5. It's a model editor, and the brief asks for a coach, Severity: Serious
- Evidence:
  - The problem is titled "Personal finance coach". The card has no moment where the product tells you something you didn't ask for, beyond a "nudges" line item.
  - The research has no evidence that people want to review AI changes to a budget or to update budgets by voice. Its problem data covers literacy and household debt (`REPORT.md` section 5). The closest support is low-to-medium confidence complaints about Monarch's "intrusive AI" (section 4).
  - Reviewing cards also adds taps to something voice was meant to make effortless.
  - The Git metaphor should land with this event's PM audience (the listing is "AI Hackathon for Product Managers"), but it means nothing to the end user the product claims to serve. Past Product Space listings reward product thinking (low-to-medium confidence; this panel is unknown).
- Why it costs points: Problem understanding (15) and Innovation (10).
- What would resolve it: Say "pull request" only in the pitch and use "Review changes" in the UI. Auto-apply high-certainty changes with undo, and hold only uncertain or high-impact ones. End each accepted change with one coaching line that models options without advice: "To get back to March 2028 you'd need ₹X more a month; here's what dining at -30% does." Talk to two or three renters today and use their words in the video.

### 6. The closest prior art is not voice, and a judge may name it, Severity: Manageable
- Evidence:
  - No product or hackathon project found does the exact speech-to-reviewable-change-to-recalculated-date loop. That means not found, not proven absent.
  - Copilot Money's Money Assistant reportedly "can suggest changes to budgets, categories and recurring transactions and asks for approval before edits", in beta with a waitlist. This comes from a secondary guide, not Copilot's docs, and no voice is mentioned ([Toolworthy](https://www.toolworthy.ai/blog/best-ai-budgeting-tools)). So the "reviewable AI change" half is not unique.
  - ProjectionLab's What If tests changes against a baseline plan ([help page](https://projectionlab.com/help/using-what-if)), which is the "uncommitted change" concept. No natural-language input was found.
  - Cleo 3.0 has two-way voice and memory ([Cleo](https://web.meetcleo.com/blog/memory-as-a-step-toward-more-human-ai), [coverage](https://techintelpro.com/news/finance/financial-services/cleo-30-launches-as-ai-financial-coach-with-voice-and-memory)), but no proposal-review flow was found. PocketSmith was not checked directly in this pass.
  - Hackathon projects are close on parts. [FoppyAI](https://devjaes.vercel.app/work/hatary-shunko/) logs transactions, goals and budgets by voice, and began as a third-place hackathon prototype (author's claim). [PassionLedger AI](https://dev.to/asprojects_b72f59493f6d93/passionledger-ai-i-turned-my-cashbook-into-a-funding-engine-for-dreams-160p) uses Gemini, a deterministic engine and a what-if simulator. [FinSage](https://devfolio.co/projects/finsage-a55a) has a goal planner with what-if.
  - [ChatGPT personal finance](https://personal-finance-tools.pages.dev/blog/chatgpt-personal-finance-bank-account-plaid-pro-review-2026/) is reported as read-only, US-only and Pro-only, with what-if planning "not here yet". It is the player a judge is most likely to know.
- Why it costs points: Innovation (10). "Voice-updated finance plan" alone isn't novel.
- What would resolve it: Claim the combination, for Indian data, and never "no one does this" (`REPORT.md` section 4). Check Copilot's own page before citing it.

### 7. Sponsor fit is rule-compliant but thin in the product, and the points sit elsewhere, Severity: Manageable
- Evidence:
  - The product is a textarea, so it would behave the same with typing or OS dictation. A sponsor judge sees no Wispr-specific capability. This does meet the rule (`REPORT.md` section 6).
  - The Wispr criterion (20) scores "how you used your voice with Wispr Flow to build", and LinkedIn is another 15 plus the bonus. This idea does nothing for either by itself.
  - `HACKATHON.md` still lists the Flow stats screen as an open question.
- Why it costs points: Wispr Flow usage (20) and LinkedIn (15).
- What would resolve it: Record voice-building clips from the first prompt, with mic audio and the Flow indicator visible. Open the video with a build clip. Show a before and after using Flow's cleaned text plus the agent's output. Post the date-move clip on LinkedIn. Don't chase the Wispr API today; key access is unknown.

### 8. The video may not read clearly, Severity: Manageable
- Evidence:
  - A date string changing is a small visual event, and a compressed video makes it smaller. The length limit is unknown (`HACKATHON.md`).
  - Reportedly, Flow's cleanup runs as a second pass after recording ([overview](https://www.blockchain-council.org/ai/wispr-flow-explained-real-time-speech-to-text-ai-productivity-workflows/)), and text would then appear in a burst after you stop talking. That leaves dead air on screen.
  - Live failure is not the main risk, since the submission is recorded. The risk is a cut-together video that looks staged.
- Why it costs points: Prototype quality and UX (20).
- What would resolve it: Use a timeline bar or chart that visibly moves, with large type. Keep one unedited take of the core flow. Get the core moment into the first 30 seconds, and make a version under 3 minutes in case a limit appears.

### 9. Life changes are rare, so usage and the subscription are weak, Severity: Manageable
- Evidence:
  - The model only changes when something changes: rent perhaps once a year, a goal a few times a year. That gives little reason to open the app weekly. This is my inference, not data.
  - Suggested pricing is about ₹999/yr (`REPORT.md` section 5, low confidence). Copilot costs $95/yr and already has approval-gated changes reported, so voice is a small feature for it to add.
  - The report names Account Aggregator as the production route. From memory, not checked here, data recipients on that network must be entities regulated by a financial regulator, so a small startup may not get direct access.
- Why it costs points: only a small part of Innovation and Problem understanding, since the rubric has no business criterion. It could matter more on an undisclosed Demo Day (past listings mention business innovation).
- What would resolve it: Automated cards from the queue in objection 4 give the weekly reason to return. Check the regulated-entity requirement before saying "AA" in the pitch. Keep the business slide to one line of who pays and why.

## Kill criteria

Assumes the build starts about 14:00 IST.

- **14:15:** Run the Flow test from objection 2. If "32" is removed, drop "no wait" as the agent's claimed feat and rewrite the demo line.
- **15:30:** Dictated text through to card, accept and date move must work end to end with Gemini. If not, cut change types to rent, income, goal and one-off expense, and drop confidence levels and undo.
- **15:30:** Run 10 messy dictated samples, including Hinglish and vague amounts. If fewer than 8 yield correct cards, narrow the schema rather than tuning prompts further.
- **16:30:** If an uploaded CSV can't change a goal date, stop adding features and wire that first.
- **17:00:** Check all nine required items. Any with no working version gets its thin version now, ahead of all polish. Drop the PDF path to one layout, or to a text-extract fallback, if it has taken more than 30 minutes.
- **Any time:** If a Gemini key or quota failure blocks more than 15 minutes, cache responses for the demo inputs and disclose that in the video if they're used.

## One pivot that would survive

Keep the idea and change its centre to **one review queue fed by speech and statements, where the agent checks what you say against what your money shows**.

Example line: "Rent's going up to 34 from January, Goa in March, and I cancelled Hotstar last month." The agent replies: "Your October statement still shows Hotstar at ₹299. Still charged, or cancelled after that?"

Flow can't do this, because it requires the persistent model. It answers objections 2 to 5 together: it is the agent's own work, it uses a clarifying question, it ties ingestion to speech, and it behaves like a coach. It also gives "goes unused" an honest signal, because the user can say so. It adds little scope beyond the queue, needing one comparison between a spoken claim and the recurring list.
