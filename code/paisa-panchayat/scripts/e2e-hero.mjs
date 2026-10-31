// Drives the demo path through the real API. Usage: node scripts/e2e-hero.mjs http://localhost:3100
const base = process.argv[2] ?? "http://localhost:3100";
const post = async (path, body) => {
  const res = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${data.error}`);
  return data;
};
const inr = (p) => `₹${(p / 100).toLocaleString("en-IN")}`;
const goals = (s) => s.goals.map((g) => `${g.name} ${g.projectedMonth}`).join(" · ");

let { state } = await post("/api/reset");
console.log("seed:", goals(state), "| spend", inr(state.profile.monthSpend), "surplus", inr(state.profile.monthlySurplus));

let t = Date.now();
const laptop = await post("/api/dictate", { text: "Laptop died, new one is 70 thousand, need it this month" });
console.log("\nbeat1 route", laptop.route, laptop.llm_source, `${Date.now() - t}ms`, laptop.items.map((i) => `${i.type} ${i.amount} ${i.status}`).join("; "));
const confirmed = await post("/api/confirm", { utteranceId: laptop.utteranceId, items: laptop.items });
const p = confirmed.panchayat;
console.log("beat2 plans:", p.plans.map((x) => `${x.id}:${x.title} [${x.impacts.map((i) => `${i.goalName} ${i.beforeMonth}>${i.afterMonth}`).join(", ")}]`).join(" | "));
for (const v of p.voices) console.log(`  ${v.goalName} (${v.source}): ${v.line}`);
const rulingText = "Goa moves to June, and if the bonus is under 50 thousand, July";
const preview = await post("/api/ruling", { panchayatId: p.id, text: rulingText });
console.log("preview ops:", JSON.stringify(preview.ops), "questions", preview.questions);
console.log("diff:", preview.diff.map((d) => `${d.goalName} ${d.beforeMonth}>${d.afterMonth}`).join(", "));
const applied = await post("/api/ruling", { panchayatId: p.id, text: rulingText, ops: preview.ops, apply: true });
console.log("applied:", applied.applied, "|", goals(applied.state), "| spend", inr(applied.state.profile.monthSpend));

const ramble = await post("/api/dictate", { text: "ATM se 10 hazaar nikale, 5 hazaar plumber ko, Rohit ko 2000 udhar diye, EMI bhi kat gayi 8400" });
console.log("\nbeat3 route", ramble.route, ramble.items.map((i) => `${i.type} ${i.amount} ${i.status} ${i.messages.join("/")}`).join("; "));
const before = applied.state.profile.monthSpend;
const r3 = await post("/api/confirm", { utteranceId: ramble.utteranceId, items: ramble.items });
console.log("spend added:", inr(r3.state.profile.monthSpend - before), "cash", inr(r3.state.cash.balance), "unexplained", inr(r3.state.cash.unexplained), "people", JSON.stringify(r3.state.people), "errors", r3.errors);

const correction = await post("/api/dictate", { text: "Rahul ko jo jaata hai woh rent hai" });
console.log("\nbeat5 route", correction.route, correction.items.map((i) => `${i.type} ${i.pattern} ${i.category} ${i.status}`).join("; "));
const r5 = await post("/api/confirm", { utteranceId: correction.utteranceId, items: correction.items });
console.log("rules:", r5.state.rules.map((x) => `${x.pattern}>${x.category} [${x.minAmount}-${x.maxAmount}] applied ${x.appliedCount}`).join("; "));

const wi = await post("/api/dictate", { text: "what if I cut dining by 30%" });
console.log("\nwhat-if route", wi.route, wi.items.map((i) => `${i.type} ${i.category} ${i.amount_text}`).join("; "));
const wp = await post("/api/panchayat", { text: "what if I cut dining by 30%", utteranceId: wi.utteranceId });
console.log("what-if plans:", wp.plans.map((x) => `${x.id}:${x.title} [${x.impacts.map((i) => `${i.goalName} ${i.beforeMonth}>${i.afterMonth}`).join(", ")}]`).join(" | "), "voices", wp.voices.length);

const refusal = await post("/api/dictate", { text: "kaunsa mutual fund lun" });
console.log("\nrefusal route", refusal.route);

const ask = await post("/api/munshi", { text: "मैंने last month एक iPhone लेने का plan करा था and मुझे उसकी progress जाननी है, कितना budget इकट्ठा कर लिया है, कितने percentage बाकी है, and whether the price of that iPhone has been hired or not" });
console.log("\nbeat4", ask.intent, ask.source, JSON.stringify(ask.facts), JSON.stringify(ask.price), "\n ", ask.answer);
const fund = await post("/api/munshi", { text: "aur haan, kaunsa mutual fund lun, Reliance ke shares bech du?" });
console.log("\nbeat6", fund.intent, fund.source, "\n ", fund.answer, "\n ", fund.scenario);
const next = await post("/api/next-month");
console.log("\nbeat5 next month", next.month, "rules", JSON.stringify(next.rulesApplied));
for (const n of next.notices) console.log(`  [${n.kind}] ${n.title}: ${n.body}`);
console.log("goals", goals(next.state), "\nreview", next.review.source, next.review.prose, JSON.stringify(next.review.highlights));
const again = await post("/api/next-month");
console.log("second run rows unchanged:", again.state.rows.length === next.state.rows.length);
for (const [kind, file] of [["sms", "seed/samples/sms.txt"], ["csv", "seed/samples/statement.csv"]]) {
  const { readFile } = await import("node:fs/promises");
  const res = await post("/api/import", { kind, text: await readFile(file, "utf8") });
  console.log("import", kind, "added", res.added, "dupes", res.duplicates, "unparsed", res.unparsed.length, "review", res.needsReview.length);
}
const { readFile } = await import("node:fs/promises");
const pdf = await post("/api/import", { kind: "pdf", base64: (await readFile("seed/samples/statement.pdf")).toString("base64") });
console.log("import pdf added", pdf.added, "dupes", pdf.duplicates, "unparsed", pdf.unparsed.length);
