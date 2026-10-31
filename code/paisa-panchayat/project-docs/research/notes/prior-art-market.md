# Prior art and market: research notes

Agentic AI Hackathon (Product Space x Wispr Flow) · researched 2026-10-31 · by hack-researcher
Time-boxed (~10 min). Snippet-level evidence from web search; I did not open most pages. Gaps are stated plainly.

## Key findings
- Fi Money (Google-backed neobank) wound down banking services in March 2026 and pivoted to AI/enterprise; Jupiter dropped its SBM India deal to focus on profitability (source [1],[2], Mar-May 2026) · Med. Lesson: neobank-bundled money apps die on bank-partner economics, so a bank-agnostic coach is a standalone lane.
- axio (ex-Walnut) is SMS-based auto-categorisation, free, no LLM, no voice or AI coach found (source [3], undated blog) · Low-Med.
- ET Money is rules-based recommendations rather than agentic LLM workflows; INDmoney AI is portfolio summaries and alerts, paid tier Rs 999/yr (source [3]) · Low-Med. I found no 2026 launch of an India AI money coach with goals, what-if and voice. This is "not found", not proof none exists.
- Global: Cleo is the closest "AI coach with voice and memory" (Cleo 3.0, Jul 2025) (source [4],[5]); Sacra estimates 2025 revenue about 62% from cash-advance fees and about 35% from subscriptions ($90M), so the AI coach is monetised mainly through lending (source [5]) · Med.
- Monarch users complained about the Goals 3.0 rebuild and about intrusive AI; asks for an AI off switch (source [6], Dec 2025-Jun 2026 Reddit snapshots) · Low-Med.
- Reusable code: `indian-finance-parsers` (pdfplumber, in-memory decrypt, ICICI/SBI card PDFs), `StmtForge` (HDFC/ICICI/SBI card PDFs, tries DOB/PAN passwords via pikepdf, regex then pdfplumber fallback), SMS: `upi_sms_parser` (Dart, MIT), `saurabhgupta050890/transaction-sms-parser` (JS, 2019 samples), FinEE (Python, 50+ regexes, self-claimed 94.5%) (source [7],[8]) · Med.
- RBI e-mandate framework (2026 news): pre-debit notification at least 24h before debit with merchant, amount, date; recurring debits up to Rs 15,000 without fresh OTP; insurance, MF and credit-card bills up to Rs 1 lakh (source [9],[10], Apr-May 2026; news, not the circular) · Med.
- SEBI: Jan 29 2025 circular and FAQs allow investor education but not advice or performance claims; regulated entities cannot associate with unregistered finfluencers (source [11]) · Med.
- DPDP Rules 2025 notified Nov 13/14 2025; most obligations apply after 18 months (about May 2027), so a hackathon prototype is pre-enforcement, but design for consent and minimisation (source [12]) · Med.
- Account Aggregator: 17 licensed AAs, 450-500M cumulative consents, 5.96 crore PFM users, Sahamati self-reported (source [13], Jun-Oct 2026) · Med.

## Answers to the key questions

### 1. Existing products and the gap
- India: axio/Walnut = SMS expense tracker [3]. ET Money = rules-based [3]. INDmoney = portfolio-centric AI [3]. Fi = shut banking [1]. Jupiter = pulled back [2]. I found nothing on CRED, Money Manager or Jupiter goal or what-if features; not researched in time.
- Global: YNAB (Trustpilot 4.6, complaints about learning curve and price), Monarch (small sample 2.1, complaints about sync and auto-categorisation), Copilot ($95/yr, liked) [6]. I found no reported complaints about what-if features, nor evidence that any of them offers conversational what-if simulation. Cleo has voice and memory [4],[5].
- Inference (Low): the gap is a persistent goal-aware model, which categorisers don't have, combined with spoken input and corrections that become rules. Most competitors stop at categorising or portfolio views. Voice-first India finance coaching with what-if was not found.
- Shutdowns: Fi (banking wound down, cash constraints, AI pivot) [1]; Walnut app wound down 2024, continues as axio [3].

### 2. Open-source and formats
- Repos above [7],[8]. Beancount importers for Indian banks exist, but GPL-3.0 and AGPL-3.0 licences restrict copying [7]. Verify licences of FinEE and StmtForge before copying.
- Savings-account PDF parsers for HDFC and SBI in indian-finance-parsers are not PDF-based [7], so the savings-account PDF path likely needs custom pdfplumber work.
- A tutorial warns SMS regexes break when templates change, and UPI autopay may send no SMS, so reconcile with statements [8].
- Real SMS formats and PDF quirks (not sourced, from general knowledge, unverified, Low): HDFC UPI SMS looks like "Sent Rs.250.00 From HDFC Bank A/C *1234 To MERCHANT On 12/10/26 Ref 123456789012"; ICICI "Acct XX123 debited with INR 250.00 on 12-Oct-26; MERCHANT credited. UPI:123456789012"; SBI "Dear UPI user A/C X1234 debited by 250.0 on date 12Oct26 trf to MERCHANT Refno 123456789012". UPI narrations are typically UPI/ref/merchant name/VPA. PDF passwords commonly combine DOB or PAN fragments (StmtForge tries these [7]). Multi-line narrations and split debit/credit columns are common. I found no source for any of these; use as test-data hints only.
- Realistic synthetic statements: I did not find a dedicated public dataset. Inference: generate your own synthetic CSV and SMS, which is faster and safer than hunting.

### 3. Recurring and subscription detection (India)
- RBI rules: pre-debit notice at least 24h ahead, merchant, amount and date; users can edit, pause, cancel; no extra fee [9],[10]. UPI autopay above Rs 15k needs authentication per debit [10]. Cite as news-level, not the circular.
- Inference (Low): detect from statement data by same payee or VPA at a stable amount and roughly monthly or yearly gaps; flag an amount change as a price hike; "unused" can only be proxied (e.g. no related transactions, no matching merchant activity such as food orders), so say "possibly unused" and ask the user by voice. Pre-debit notice SMS can be parsed as an early signal.

### 4. Regulation and guardrails
- SEBI: education allowed; advice, performance claims and specific stock names or live data raise risk; stock-market educators may use only three-month-lagged data [11]. Enforcement example Dec 4 2025 [11]. Final circular text was not verified.
- Safe wording (Inference, Low): "illustrative scenario, not a recommendation"; asset classes and generic categories only; no named securities, funds or "buy/sell"; show assumptions; suggest a SEBI-registered adviser for product choice. Hard-code a refusal and redirect path.
- AA: the legitimate production route for bank data, consent-based [13]. For the demo, use uploaded files and say AA is the production path.
- DPDP: Rules notified Nov 2025, 18-month phase-in; penalties up to Rs 250 crore for security failures (other tiers disputed) [12]. Design points (Inference): consent notice, minimisation, local processing, delete-my-data.
- Prompt injection via narrations (Inference, Low): treat narration text as untrusted data. Pass it in delimited fields, never as instructions; let the LLM output only structured JSON (category, confidence); strip or escape instruction-like text; validate against an allowed category enum; no tool calls triggered by narration content. Show this as a demoable guardrail.

### 5. Market
- Financial literacy: about 27% of Indian adults per NCFE (survey year unclear) [14]; S&P 2015: 76% not literate [14].
- Household debt 45.5% of GDP (Sep 2025, RBI FSR via Business Today, Jul 2026); small-ticket loan delinquency 6.4% in Mar 2026 vs 4.5% two years earlier [15]. Household savings rate figures vary (about 5-6% of GDP net financial vs 34.9% gross) [15]. No millennial or Gen Z-specific or BNPL figures found.
- AA PFM users 5.96 crore [13]. Personal finance app market size in India: not found.
- Monetisation: Cleo mostly cash-advance fees plus subscription $2.99-19.99/mo [5]; INDmoney Pro Rs 999/yr [3]; Copilot $95/yr [6]; Indian apps commonly cross-sell (Inference, Low).

## Things that change how we compete
- Pitch the gap as: neobanks pivoted away from or shut down and categorisers stop at tracking; the unserved piece is a goal-aware living model with voice input and learned corrections.
- Be careful not to claim "no one does this". Say "we found no India product combining these".
- Compliance and injection defence are demoable differentiators for the problem-understanding and AI-integration judging criteria.
- Fastest path: synthetic CSV and SMS plus a small regex parser, with pdfplumber for one PDF format; do not spend hours on bank-specific PDFs.

## Conflicts and uncertainties
- Cleo revenue: Sacra estimate ($280M ARR Jul 2025; subscriptions 35%) vs company-reported figures and older mix (about 59% subscription, 2023) [5]. Trust Sacra's newest mix; low certainty.
- DPDP dates (Nov 13 vs 14; May 12 vs 13 2027) and penalty tiers differ across sources [12]. Trust PIB/Gazette; date framing "about 18 months" is safe.
- AA consent counts: 45 crore (Jun 2026) vs 500M (Sep 2026) are consistent in direction; Sahamati is self-reported [13].
- Savings-rate figures differ by definition [15].
- The e-mandate framework article dates (Apr 2026) come from news; the above-15k details differ between sources [9],[10].

## Open questions
- 2025-2026 India AI money coaches (CRED, Jupiter, Money Manager, startups): not found.
- Real Reddit complaints about India apps: not found.
- Exact current SMS templates and a public synthetic statement dataset: not found.
- Market size and BNPL data: not found.
- Final SEBI circular wording: check sebi.gov.in.

## Sources
1. TechCrunch, India neobank Fi winds down banking services, https://techcrunch.com/2026/03/11/india-neobank-fi-winds-down-banking-services-on-its-platform (2026-03-11, accessed 2026-10-31; via search snippet)
2. Whalesbook, Jupiter abandons SBM India deal, https://www.whalesbook.com/news/English/bankingfinance/Jupiter-Money-Abandons-SBM-India-Deal-to-Focus-on-Profitability/69b275ad17d794d3dcfc3137 (2026, accessed 2026-10-31)
3. Richify, best AI personal finance app, https://www.richify.ai/in/best-ai-personal-finance-app (undated); investortoolkit, https://investortoolkit.pages.dev/best-ai-tools-finance.html (undated); TechCrunch ET Money acquisition, https://techcrunch.com/2024/06/12/indias-360-one-acquires-mutual-fund-app-et-money-for-44m (2024-06-12)
4. Cleo 3.0 launch, https://techintelpro.com/news/finance/financial-services/cleo-30-launches-as-ai-financial-coach-with-voice-and-memory (2025)
5. Sacra Cleo, https://sacra.com/c/cleo (2025-26); https://www.arr.club/cleo/cleo-arr-hits-250m
6. Reddit snapshots and comparisons, https://reddit.sentinel-team.org/subreddits/MonarchMoney/snapshots/2025-12-19T07%3A11%3A21.8753Z ; https://unstar.app/blog/ynab-rocket-money-monarch-everydollar-copilot-budget-apps-ranked-2026 (2026)
7. indian-finance-parsers, https://pypi.org/project/indian-finance-parsers/ ; StmtForge, https://pypi.org/project/stmtforge/0.1.0/ (undated)
8. https://github.com/saurabhgupta050890/transaction-sms-parser ; https://pub.dev/packages/upi_sms_parser/example ; https://pypi.org/project/finee/ ; https://dev.to/automate-archit/automate-your-upi-transaction-tracking-60-lines-of-python-free-works-offline-5gcm (undated)
9. Business Today, RBI e-mandate framework, https://www.businesstoday.in/personal-finance/news/story/rbi-caps-recurring-payments-at-rs15000-without-otp-under-new-e-mandate-framework-526759-2026-04-21 (2026-04-21)
10. Business Today, https://www.businesstoday.in/personal-finance/news/story/rbi-auto-debit-rules-explained-what-new-changes-mean-for-your-upi-and-card-payments-528507-2026-05-02 (2026-05-02); Juspay, https://juspay.io/mandates/docs/mandates/description
11. FoxMandal on SEBI finfluencer FAQs, https://foxmandal.in/news/cutting-ties-with-finfluencers-sebi-distinguishes-between-education-advice/ (2025); Business Standard, https://www.business-standard.com/markets/news/sebi-finfluencer-circular-live-stock-data-market-education-rules-125013000571_1.html (2025-01-30)
12. PIB DPDP Rules, https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf (2025-11); YourStory, https://yourstory.com/2025/11/digital-personal-data-protection-dpdp-rules-2025-rollout-over-18-months
13. Sahamati / press on AA, https://www.newkerala.com/news/a/indias-account-aggregator-ecosystem-facilitates-nearly-38-crore-263.htm (2026-06-24); https://sahamati.org.in/varta-the-sahamati-newsletter-january-2026/
14. NCFE annual report, https://old.ncfe.org.in/images/pdfs/annual_reports/Annual_Report_2022-23.pdf ; Business Standard S&P survey, https://www.business-standard.com/amp/article/pti-stories/76-indians-not-financially-literate-says-s-p-survey-115121500418_1.html (2015)
15. Business Today household debt, https://www.businesstoday.in/latest/economy/story/indias-household-debt-rises-to-45-5-of-gdp-non-housing-retail-loans-account-for-58-4-show-data-544604-2026-07-22 (2026-07-22); https://www.businesstoday.in/latest/economy/story/declining-household-savings-pose-risks-to-indias-credit-growth-engine-report-537507-2026-06-18 (2026-06-18)
