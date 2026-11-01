import type { DatabaseSync } from "node:sqlite";
import type { TNotice } from "@/contract/schemas";
import { formatInr, monthLabel, projectMonth, monthsBetween } from "@/engine";
import { getState } from "@/ledger";

const OVER_RATIO = 1.25;
const OVER_MIN = 100_000; // 1,000 rupees in paise
/** Fixed or unexplained categories are not drift. */
const FIXED = new Set(["rent", "emi", "other", "utilities", "household_help"]);

/** This month's spend per category against the average of earlier months. Pure code; the notice speaks as the goal it hurts most. */
export function driftNudges(db: DatabaseSync): TNotice[] {
  const state = getState(db);
  const rows = db.prepare(`SELECT substr(e.date, 1, 7) m, a.id acct, SUM(p.amount) s FROM postings p
    JOIN accounts a ON a.id = p.account_id JOIN events e ON e.id = p.event_id
    WHERE a.kind = 'expense' GROUP BY m, acct`).all() as { m: string; acct: string; s: number }[];
  const cur = state.simMonth;
  const earlier = new Set(rows.filter((r) => r.m < cur).map((r) => r.m));
  if (earlier.size === 0) return [];
  const found: { cat: string; spent: number; usual: number; over: number }[] = [];
  for (const cat of new Set(rows.map((r) => r.acct))) {
    const spent = rows.find((r) => r.m === cur && r.acct === cat)?.s ?? 0;
    const usual = Math.round(rows.filter((r) => r.acct === cat && r.m < cur).reduce((t, r) => t + r.s, 0) / earlier.size);
    if (!FIXED.has(cat.replace("expense:", "")) && usual > 0 && spent > usual * OVER_RATIO && spent - usual >= OVER_MIN) found.push({ cat: cat.replace("expense:", ""), spent, usual, over: spent - usual });
  }
  found.sort((a, b) => b.over - a.over);

  const out: TNotice[] = [];
  for (const f of found.slice(0, 2)) {
    // The goal hurt most when this overspend comes out of its savings: the one whose remaining gap this overspend is the largest share of, then the biggest slip.
    const hurt = state.goals
      .map((g) => {
        const now = projectMonth(cur, g.target, g.earmarked, g.monthlyContribution);
        const later = projectMonth(cur, g.target, g.earmarked - f.over, g.monthlyContribution);
        return { g, slip: monthsBetween(now, later), later, share: (g.target - g.earmarked) > 0 ? f.over / (g.target - g.earmarked) : 0 };
      })
      .sort((a, b) => b.share - a.share || b.slip - a.slip || a.g.projectedMonth.localeCompare(b.g.projectedMonth))[0];
    if (!hurt) continue;
    const label = f.cat.replace(/_/g, " ");
    const effect = hurt.slip > 0
      ? `That is ${formatInr(f.over)} less for me, and I slip ${hurt.slip} month${hurt.slip > 1 ? "s" : ""} later, to ${monthLabel(hurt.later)}.`
      : `That is ${formatInr(f.over)} less for me.`;
    out.push({
      id: `drift-${cur}-${f.cat}`,
      kind: "drift",
      title: `Notice from ${hurt.g.name}`,
      body: `${label[0].toUpperCase()}${label.slice(1)} came to ${formatInr(f.spent)} this month, against your usual ${formatInr(f.usual)}. ${effect}`,
      goalId: hurt.g.id,
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}
