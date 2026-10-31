"use client";

import type { TAppState, TGoalView, TPriceCheck } from "@/contract/schemas";
import { dateTime, inr, month, monthsBetween, shortUrl } from "./format";
import { goalColor, goalEmoji, Ring } from "./pictures";
import { AnimatedMonth, Badge, Empty } from "./ui";

type GoalWithPrice = TGoalView & { price?: TPriceCheck | null };

function lateness(g: TGoalView): { text: string; late: boolean } {
  const d = monthsBetween(g.targetMonth, g.projectedMonth);
  if (d === 0) return { text: "🙂 On time", late: false };
  if (d > 0) return { text: `⏳ ${d} mo late`, late: true };
  return { text: `🚀 ${-d} mo early`, late: false };
}

function PriceLine({ goal, price, color }: { goal: TGoalView; price: TPriceCheck | null; color: string }) {
  if (price) {
    const pct = Math.round((goal.earmarked / price.price) * 1000) / 10;
    return (
      <div className="goal-price">
        <Ring percent={pct} color={color} size={62} stroke={7} center={<span className="ring-small">{Math.round(pct)}%</span>} label={`${pct}% saved at today's price`} />
        <p>
          <b>{pct}%</b> at today&apos;s <b>{inr(price.price)}</b>
          {price.cached ? <> <Badge>Cached</Badge></> : null}
          <br />
          <span className="muted small">{price.label} · {dateTime(price.checkedAt)} · <a href={price.sourceUrl} target="_blank" rel="noreferrer">{shortUrl(price.sourceUrl).split("/")[0]}</a></span>
        </p>
      </div>
    );
  }
  if (!goal.priceUrl) return null;
  return <p className="muted small goal-hint">📒 Ask Munshi for today&apos;s price</p>;
}

export function GoalsTab({ state, prices, onSuggest }: { state: TAppState; prices: Record<string, TPriceCheck>; onSuggest: (text: string) => void }) {
  const goals = state.goals as GoalWithPrice[];
  if (goals.length === 0) return <Empty title="No goals yet">Say one: “Goa trip by June, 40 thousand.”</Empty>;

  return (
    <section aria-label="Goals" className="goals-screen">
      <div className="row-head"><h2 className="screen-title">Your goals</h2></div>
      <ul className="goal-cards">
        {goals.map((g) => {
          const late = lateness(g);
          const pct = g.target > 0 ? Math.min(100, Math.round((g.earmarked / g.target) * 100)) : 0;
          const price = prices[g.id] ?? g.price ?? null;
          const color = goalColor(goals, g.id);
          return (
            <li key={g.id} className="goal-card">
              <Ring percent={pct} color={color} emoji={goalEmoji(g.name, g.type)} size={128} stroke={12} label={`${g.name}: ${pct}% saved`} />
              <h3>{g.name}</h3>
              <p className="goal-pct">{pct}% saved</p>
              <p className="muted">{inr(g.earmarked)} of {inr(g.target)}</p>
              <div className="goal-when">
                <span className="muted small">You&apos;ll get there</span>
                <AnimatedMonth value={g.projectedMonth} className="goal-month" />
                <span className={late.late ? "pill pill-late" : "pill"}>{late.text}</span>
              </div>
              {g.reasonQuote ? <p className="bubble-quote">“{g.reasonQuote}”</p> : null}
              <PriceLine goal={g} price={price} color={color} />
            </li>
          );
        })}
      </ul>
      <button type="button" className="chip chip-add" onClick={() => onSuggest("New goal: Bike by December 2027, 90 thousand")}><span aria-hidden="true">➕</span> Say a new goal</button>
    </section>
  );
}
