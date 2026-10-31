# Plan review: Paisa Panchayat

2026-10-31 · about 9.1h left · Run read-only under plan mode, by a Plan agent acting as the skeptic. Saved by the main session. Fixes and accepted risks are in `docs/PLAN.md` under "Review changes".

**Verdict: this can ship, but not on the current timings.** The reviewer checked the registry entries, Gemini docs and Apple fetch. It didn't run create-next-app or a build, and the Hinglish failures come from reading the plan's rules, not from running them.

## Must fix, ranked by damage

1. **Hero lines fail the plan's own checks.**
   - "5 plumber ko" means ₹5,000, but 5000 isn't in the text, so the source check blocks it, while a misread ₹5 passes. "Under 50" has the same problem.
   - Banning number words catches "ek" and "kar do", and quoted reasons containing digits also get rejected. That could trip the 1-in-10 rule and collapse the voices.
   - **Fix:** add an inherited-unit rule with "read as ₹5,000" on the card. Make quotes placeholders, and exclude ek/do from the list.

2. **Work has no owner.**
   - Builders cover only M1–M5, leaving M6, M7, M8, seed data and the PDF fixture unassigned. API routes fall to `ui` by directory.
   - M2 (17:00) also lands before the 17:05 pivot gate.
   - **Fix:** core owns seed. Add an `insights` builder (M6, M8) at 16:00, and agents takes M7. Move M2 to 17:45, which uses up the extras window.

3. **16:00 isn't credible; plan for 16:30.**
   - The earlier review's thin estimates for this slice total 110 sequential minutes. M0 won't fit 15 minutes either, and the two-reader check blocks post 1.
   - **Fix, contract must contain:** zod schemas for items, ruling ops (including conditions), plans and fact sheets; fixture JSON for every API response; a fake `llm()` mode and a `globalThis` DB singleton; stub routes owned by main.
   - **Fix, each worktree needs:** its own install, `.env.local`, DB and port.

4. **The Goa line can't be produced.**
   - The data model has no bonus field, and no beat shows the condition firing. "Figures illustrative" also means June may not be feasible.
   - **Fix:** add `expected_bonus`, and put a ₹42,000 bonus in the next-month fixture so a notice moves Goa to July. Add a golden test asserting each beat's numbers.

5. **Testing can use up the quota for takes.**
   - Limits are unpublished. Midnight PT, the documented grounding reset, is 12:30 IST, so if token limits match, nothing resets before the deadline.
   - The structured-output page never names gemini-2.5-flash, though the Interactions page lists it.
   - **Fix:** builders use fake mode. Log calls, and smoke-test `response_format` on all three fallback models.

6. **Install traps.**
   - The create-next-app template pins `typescript ^5` and `@types/node ^20`. Vitest 5 wants `@types/node` ^22 or >=24, and v20 has no sqlite types.
   - **Fix:** use `@types/node` ^24 and keep TypeScript 5 or 6. [TypeScript 7 docs conflict](https://nextjs.org/docs-wip/app/api-reference/config/typescript).
   - **Fix:** before fan-out, run a 10-minute spike: a `node:sqlite` route surviving a dev restart, plus pdfjs legacy build [externalized](https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide).

7. **Subtitles are untooled.**
   - Only iMovie is installed, with no ffmpeg or whisper, and there are three cuts of Hinglish to caption.
   - The plan also says takes from 20:00, first take at 20:30, and finish by 22:30.
   - **Fix:** by 18:00, install ffmpeg and burn a script-derived SRT into a 10-second test clip.
   - **Fix now:** check the form's limits, which may remove a cut. Test that OBS captures the Flow indicator, keep `.env.local` off camera, and plug in (battery 30%).

8. **Storyline gaps against the requirements.**
   - No beat visibly shows the profile, a labelled what-if, or a self-correction.
   - Restart appears only in the 3-minute cut, though the earlier review called it the proof of "persistent".
   - Build-by-voice is 20% of the score but gets about 15 seconds.
   - Beat 5 packs too much into 20 seconds.
   - "Not last month's" looks false, since the earlier review dates the reported hike to August.
   - **Fix:** add a profile strip and a "What-if" label. Dictate a self-correction, and show the raw text if Flow strips it. Put a restart jump cut in every version. Give build footage 25 seconds and let beat 5 run longer. Say "not the price I planned on".

## Accept

- **S1–S7:** probably all cut.
- **Apple price:** a default Node fetch returned the price. Select by SKU, because ₹99,900 is also the page-wide `lowPrice`.
- **Slow calls:** free-tier latency can be covered with jump cuts.
- **Stored interactions:** stored by default and kept for 1 day on free tier, which is fine for synthetic data.
- **Similar ideas:** others may have the same one.
