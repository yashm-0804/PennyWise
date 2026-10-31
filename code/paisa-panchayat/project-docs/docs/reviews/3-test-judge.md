# Judge review: Paisa Panchayat (pre-video state)

2026-10-31 · Rubric: OFFICIAL (as given in prompt) · Blind: yes. No earlier scores were in the prompt. No video or build footage exists; Wispr and LinkedIn are scored on the evidence available.

## Scorecard
| Criterion | Weight | Score /10 | Evidence |
|---|---|---|---|
| Wispr Flow usage | 20 | 5 | Only proof is an all-time Insights screenshot (30,508 words, 434 AI prompts, 2-day streak). It isn't tied to this build and shows no dictated spec or fix. The app has no speech code and says "Speech goes through Wispr Flow" over a text box. That fits the rules, but a judge sees a textarea. The "Flow's text beside the result" beat doesn't exist on screen. With no footage, this is a claim. |
| Prototype quality & UX | 20 | 8 | Distinctive, coherent UI. The 3-plan table with per-goal date deltas, the ruling diff with the conditional ("If bonus under ₹50,000: Goa to Jul 2027"), the Khata with quoted phrases, a cash wallet that counts the withdrawal once, and the "Modelled scenario, not advice" box all look finished. The simulated month fires the condition (Jul 2027). "Synthetic data" and "Simulated month" are labelled honestly. Minus: bottom assumption chips are clipped, and the Notices screen is dense. |
| AI integration | 20 | 7 | Sound design: code computes every number and Gemini does goal voices, parsing and prose. Real replies stay in character ("Plan A mein ₹10,000 de dunga, agar Flat bhi de", "Cover 4.1 se 3.0"). The weak spots: the refusal screen shows a "Template line", so the guardrail's visible wording isn't AI. Code carries "MOCK" stand-ins for every Gemini call. The Munshi is not free-form (function calling is a cut stretch item). The ~2.1k lines in agents/engine are real, but the AI is narrow and the screenshots are all fake mode. |
| Problem understanding | 15 | 8 | Hits nearly every required item: SMS/CSV/PDF import, correction rules ("Rahul → rent, 10×, Undo"), subscription alerts (Cult Gym possibly unused, Hotstar price change), a profile strip, a goal planner with what-if ("moves no money"), drift nudges, a monthly sabha, guardrails. Cash, lent money and EMIs show real Indian context. Thin: drift nudges and the monthly review are barely visible, and goal target dates are only shown as outputs. |
| LinkedIn content & engagement | 15 | 3 | One post, generic and intent-only ("I'm building..."). No screenshot, number or demo clip, and no result post. The closing question is a decent hook. Engagement is unknown. One day-of post is the floor; winners post 3-5 with visuals. |
| Innovation & creativity | 10 | 8 | The goals-argue-and-you-rule metaphor with precedent and conditional rulings is memorable and not another budgeting chatbot. The Hinglish voice of the goals is charming. |
| **Weighted** | 100 | **6.5 (64.5/100)** | 1.0 + 1.6 + 1.4 + 1.2 + 0.45 + 0.8 |

## What would raise the score
1. Record the video with the Flow indicator visible and real Gemini (no "Test reply" badges). Show Flow text appearing, one self-corrected take, and a bug fixed by voice → Wispr +3 (about +6 pts), Prototype +0.5. About 3 h.
2. Post 3-4 more LinkedIn posts with the 15-second ruling clip, a Flow stats screenshot from this build, and a "what I learned dictating" post. Tag the hosts, ask for comments → LinkedIn +3 to +4 (about +5 pts). About 1.5 h.
3. Replace the "Template line" on the refusal with a real Gemini reply that passes the guardrail, and show one unscripted Munshi question → AI +1 (+2 pts). About 1.5 h.
4. Show a second, different ruling live (not the scripted Goa/June one) to answer the "scripted" doubt → AI/Innovation +0.5 (about +1.5 pts). About 0.5 h.
5. Surface the drift nudge and the monthly review as a clear beat, and unclip the assumption chips → Problem/Prototype +0.5 (about +1.5 pts). About 1 h.

## Red flags
- No video and no build footage: the largest criterion (Wispr, 20) has no evidence tied to this build. The insights screenshot is all-time.
- Every screenshot is fake AI mode. The real Gemini replies were captured only for the main scene, so the other flows (Munshi, imports, review wording) are unproven with real AI.
- Scripted look: the demo is a fixed sequence on seeded data, and the next month comes from a fixed JSON file. It is labelled, but a judge may call it a canned demo.
- Demo-fit risk: the bonus of ₹42,000 happens to land under the ₹50,000 condition, and the conditional path is the single demo path.
- The parsers cover 5 SMS templates, 1 CSV layout and 1 PDF layout, all written from synthetic samples. Real messy statements would likely break them.
- The Goa reply is a conditional ("agar Flat bhi de") and the Panchayat screen tags it "Opposes Plan A". Check that the video doesn't contradict it.
- Only one LinkedIn post, with no visuals.

## How it compares
Typical submission: a chat UI over an LLM, categorising a CSV, with a thin voice story. This is clearly above that on product depth, honesty and originality. A likely winner shows the same product plus evidence: a tight video with Flow visibly in use, build-by-voice clips, several LinkedIn posts with real engagement, and live real-AI output with no test badges. Today the product is roughly finalist-grade (7-8), but the submission evidence (Wispr plus LinkedIn, 35% of the score) is at 3-5. If items 1 and 2 are done well, the total could move from about 65 to about 76.
