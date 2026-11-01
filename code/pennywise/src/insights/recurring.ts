import type { DatabaseSync } from "node:sqlite";
import type { InsightsModule } from "@/contract/modules";
import { formatInr } from "@/engine";

type Recurring = ReturnType<InsightsModule["detectRecurring"]>[number];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9@.]+/g, " ").trim();
/** Payees where "no related activity" is a meaningful proxy. A statement can't show usage, so this is never a claim. */
const USAGE_LIKE = /gym|fitness|club|membership/i;

/**
 * Code only. Same normalised payee in three or more different months, one charge a month, and every earlier charge
 * equal: "changed" when the latest differs, "possibly_unused" for a gym-like payee with no other spend in its category.
 */
export function detectRecurring(db: DatabaseSync): Recurring[] {
  const rows = db.prepare(`SELECT e.payee, e.label, e.date, e.amount, e.category FROM events e
    WHERE e.kind = 'expense' AND e.reversal_of IS NULL
      AND NOT EXISTS (SELECT 1 FROM events r WHERE r.reversal_of = e.id)
    ORDER BY e.date`).all() as { payee: string | null; label: string; date: string; amount: number; category: string | null }[];
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = norm(r.payee ?? r.label);
    if (key) groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out: Recurring[] = [];
  for (const list of groups.values()) {
    const months = new Set(list.map((r) => r.date.slice(0, 7)));
    if (months.size < 3 || months.size !== list.length) continue; // not roughly monthly
    const latest = list[list.length - 1];
    const before = new Set(list.slice(0, -1).map((r) => r.amount));
    if (before.size !== 1) continue; // amount not stable
    const base = [...before][0];
    let status: Recurring["status"] = latest.amount !== base ? "changed" : "stable";
    if (status === "stable" && USAGE_LIKE.test(`${latest.payee} ${latest.label}`)) {
      // Only spend that looks like the same activity counts as use; a pharmacy bill says nothing about a gym.
      const others = rows.filter((r) => USAGE_LIKE.test(`${r.payee} ${r.label}`) && norm(r.payee ?? r.label) !== norm(latest.payee ?? latest.label));
      if (others.length === 0) status = "possibly_unused";
    }
    out.push({ payee: latest.payee ?? latest.label, monthly: latest.amount, lastSeen: latest.date, status });
  }
  return out;
}

/** The wording the app shows for a recurring finding. Never states unused as fact. */
export function recurringNotice(r: Recurring, previous?: number): { kind: "price_change" | "possibly_unused"; title: string; body: string } | null {
  if (r.status === "possibly_unused") {
    return { kind: "possibly_unused", title: `${r.payee}: possibly unused`, body: `${r.payee}: possibly unused. No related activity found. Still using it?` };
  }
  if (r.status === "changed" && previous != null) {
    return { kind: "price_change", title: `${r.payee} price changed`, body: `${r.payee} was ${formatInr(previous)} a month, now ${formatInr(r.monthly)}.` };
  }
  return null;
}

/** The earlier stable amount for a "changed" recurring payee. */
export function previousAmount(db: DatabaseSync, payee: string): number | undefined {
  const row = db.prepare(`SELECT amount FROM events WHERE kind = 'expense' AND payee = ? ORDER BY date DESC LIMIT 1 OFFSET 1`).get(payee) as { amount: number } | undefined;
  return row?.amount;
}
