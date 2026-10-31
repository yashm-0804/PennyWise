# PennyWise

A money ledger you feed by talking. When a big expense threatens your savings goals, the goals argue over how to absorb it, and you make the final call by voice.

Built for the Agentic AI Hackathon by Product Space, in collaboration with Wispr Flow (problem 04, personal finance coach with a living money model). It was built by dictating prompts, specs and fixes with Wispr Flow into Claude Code.

## Mobile app

These screens are the Android and iOS app, previewed on the web at `/phone` in a phone frame. Native builds don't exist yet. The website has its own separate frontend.

## How voice works

The app has no speech code. [Wispr Flow](https://wisprflow.ai) types into a plain text box, and the agent turns that natural speech, in English or Hinglish, into structured entries. Typing works too.

## What it does

- **Ledger:** spending, income, cash, money lent or borrowed, and EMIs, dictated or imported. A cash withdrawal is a transfer, so ₹10,000 withdrawn and paid out counts once. Nothing you dictate is saved until you confirm it; imports are saved straight away, and you can undo any row.
- **Panchayat:** a heavy expense convenes the goals it affects. Code finds up to 3 plans, each goal argues in its own Gemini call, and your spoken ruling changes the dates. Rulings can carry conditions, and they're remembered as precedent.
- **Buggy:** a chat assistant on every screen. Ask about spending, lending, borrowing, EMIs, cash or goals, and Gemini answers from your file; a reply using a figure that isn't in the file is rejected. It re-bases an iPhone goal on Apple India's list price, and it won't name securities.
- **Home figures explain themselves:** hover or press and hold any number on Home to see why it's that value.
- **Imports and alerts:** paste SMS, upload CSV or PDF. Corrections become visible rules. "Import next month" shows recurring-payment alerts, drift nudges and a monthly review.

## Run it

Needs Node 26 or newer, which includes `node:sqlite`.

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open http://localhost:3000/phone.

This starts in fake AI mode with no API key, and replies show a "Test reply" badge. For real AI, add a [Gemini API key](https://aistudio.google.com/apikey) as `GEMINI_API_KEY` in `.env.local` and set `LLM_MODE=real`. Keep the key out of git; `.env.local` is ignored.

Try saying these in the text box:

1. `Laptop died, new one is 70 thousand, need it this month`, then confirm, then rule with `Goa moves to June, and if the bonus is under 50 thousand, July`
2. `ATM se 10 hazaar nikale, 5 hazaar plumber ko, Rohit ko 2000 udhar diye, EMI bhi kat gayi 8400`
3. `Mera iPhone wala plan kitna pahuncha, kitna percent bacha hai, aur price badha kya`
4. `Rahul ko jo jaata hai woh rent hai`, then "Import next month" under Alerts
5. `kaunsa mutual fund lun`

To test imports, use the files in `seed/samples/` (`statement-locked.pdf` has the password `demo1234`).

Run the tests with `npm test`.

## What's real and what isn't

| Part | Status |
|---|---|
| Numbers, plans, dates, rules, alerts | Real, calculated in code. The AI never produces a number |
| Goal voices, entry parsing, ruling parsing, review wording | Real Gemini calls in real mode. A labelled template line appears if a call fails |
| Apple India price | Real fetch of the list price, with its source and time. Labelled "cached" if a later fetch fails |
| Bank data | **Synthetic.** No real person, account or transaction |
| Next month | **Simulated** from `seed/next-month.json`, and labelled on screen |
| SMS and email | Pasted or uploaded, not fetched live. Android SMS or Account Aggregator would be the production route |
| What-ifs | Simulations only. A ruling on a what-if is noted and moves no money |

## Limits

- Parsers cover 5 SMS templates, 1 CSV layout and 1 PDF layout, written from synthetic samples. Real bank formats will vary.
- A plausible wrong amount can only be caught by the person reading the confirm card.
- The guardrail's lists are finite, so it can miss an unusual fund name.
- It educates and models scenarios. It isn't financial, tax or investment advice, and it isn't a Chartered Accountant.
- It's a local, single-user prototype with no sign-in.
