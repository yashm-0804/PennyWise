// Run with: LLM_MODE=real npx tsx --env-file=.env.local scripts/smoke-agents.ts
// Spends 2 real Gemini calls: one router, one ruling. Checks that the real schemas are accepted.
import { parseRuling, routeUtterance } from "../src/agents";
import { panchayatFixture, stateFixture } from "../src/contract/fixtures";

async function main() {
  const line = "ATM se 10 hazaar nikale, 5 hazaar plumber ko, Rohit ko 2000 udhar diye, EMI bhi kat gayi 8400";
  const start = Date.now();
  const routed = await routeUtterance(line, {
    goals: stateFixture.goals.map((g) => g.name),
    people: ["Rohit"],
    simMonth: "2026-10",
  });
  console.log("router", routed.source, `${Date.now() - start}ms`);
  for (const i of routed.items) console.log(" ", i.type, i.amount_rupees, i.account, `"${i.source_quote}"`);

  const t2 = Date.now();
  const ruling = await parseRuling(
    "Goa moves to June, and if the bonus is under 50 thousand, July",
    panchayatFixture,
    stateFixture.goals.map((g) => ({ id: g.id, name: g.name })),
  );
  console.log("ruling", `${Date.now() - t2}ms`, JSON.stringify(ruling));
}

main().catch((err) => {
  console.error("FAILED", String(err?.message ?? err).slice(0, 500));
  process.exit(1);
});
