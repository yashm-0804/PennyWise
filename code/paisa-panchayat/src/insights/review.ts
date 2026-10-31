import type { DatabaseSync } from "node:sqlite";
import type { TMonthlyReview } from "@/contract/schemas";
import { writeProse } from "@/agents";
import { addMonths, formatInr } from "@/engine";
import { saveReview, spendForMonth } from "@/ledger";

const titleCase = (c: string) => `${c[0].toUpperCase()}${c.slice(1).replace(/_/g, " ")}`;

function byCategory(db: DatabaseSync, month: string): { category: string; amount: number }[] {
  return (db.prepare(`SELECT a.id acct, SUM(p.amount) s FROM postings p JOIN accounts a ON a.id = p.account_id
    JOIN events e ON e.id = p.event_id WHERE a.kind = 'expense' AND substr(e.date, 1, 7) = ? GROUP BY a.id`).all(month) as { acct: string; s: number }[])
    .map((r) => ({ category: r.acct.replace("expense:", ""), amount: r.s }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

export async function monthlyReview(db: DatabaseSync, month: string): Promise<TMonthlyReview> {
  const income = -(db.prepare(`SELECT COALESCE(SUM(p.amount), 0) s FROM postings p JOIN accounts a ON a.id = p.account_id
    JOIN events e ON e.id = p.event_id WHERE a.kind = 'income' AND substr(e.date, 1, 7) = ?`).get(month) as { s: number }).s;
  const spend = spendForMonth(db, month);
  const saved = income - spend;
  const cats = byCategory(db, month);
  const prev = byCategory(db, addMonths(month, -1));

  const highlights: string[] = [];
  if (cats[0]) highlights.push(`Biggest category: ${titleCase(cats[0].category)}, ${formatInr(cats[0].amount)}.`);
  const moves = cats
    .map((c) => ({ c, d: c.amount - (prev.find((p) => p.category === c.category)?.amount ?? 0) }))
    .filter((m) => prev.length > 0 && Math.abs(m.d) >= 50_000)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  if (moves) highlights.push(`${moves.c.category === "emi" ? "EMI" : titleCase(moves.c.category)} was ${formatInr(Math.abs(moves.d))} ${moves.d > 0 ? "more" : "less"} than last month.`);
  if (income > 0) highlights.push(`Saved ${formatInr(saved)}, ${Math.round((saved / income) * 100)}% of income.`);
  const biggest = db.prepare(`SELECT label, amount FROM events WHERE kind = 'expense' AND substr(date, 1, 7) = ? AND reversal_of IS NULL ORDER BY amount DESC LIMIT 1`).get(month) as { label: string; amount: number } | undefined;
  if (biggest) highlights.push(`Largest single expense: ${biggest.label}, ${formatInr(biggest.amount)}.`);

  const top = cats[0] ? titleCase(cats[0].category) : "None";
  const fallback = `Is mahine ${formatInr(income)} aaya, ${formatInr(spend)} kharch hua, aur ${formatInr(saved)} bacha. Sabse bada kharch: ${top}.`;
  const prose = await writeProse("review", { income: formatInr(income), spend: formatInr(spend), saved: formatInr(saved), top_category: top }, fallback);
  const review: TMonthlyReview = { month, income, spend, saved, byCategory: cats, highlights: highlights.slice(0, 4), prose: prose.text, source: prose.source };
  saveReview(db, review);
  return review;
}
