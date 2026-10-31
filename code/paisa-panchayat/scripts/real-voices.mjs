// Spends about 5 real calls. Usage: node scripts/real-voices.mjs http://localhost:3100
const base = process.argv[2] ?? "http://localhost:3100";
const post = async (path, body) => {
  const t = Date.now();
  const res = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${data.error}`);
  console.log(path, `${Date.now() - t}ms`);
  return data;
};
await post("/api/reset");
const laptop = await post("/api/dictate", { text: "Laptop died, new one is 70 thousand, need it this month" });
console.log(laptop.llm_source, JSON.stringify(laptop.items.map((i) => [i.type, i.amount_rupees, i.payee, i.category, i.account, i.status, i.messages])));
const { panchayat: p } = await post("/api/confirm", { utteranceId: laptop.utteranceId, items: laptop.items });
for (const v of p.voices) console.log(`${v.goalName} [${v.source}] ${JSON.stringify(v.stances)}\n   ${v.line}`);
const text = "Goa moves to June, and if the bonus is under 50 thousand, July";
const preview = await post("/api/ruling", { panchayatId: p.id, text });
console.log(JSON.stringify(preview.ops), preview.questions, preview.diff.map((d) => `${d.goalName} ${d.beforeMonth}>${d.afterMonth}`).join(", "));
