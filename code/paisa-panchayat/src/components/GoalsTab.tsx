"use client";

import { useState } from "react";
import type { TAppState, TGoalView, TPriceCheck } from "@/contract/schemas";
import { NEVER_MONTH, projectMonth } from "@/engine/dates";
import { dateTime, inr, month, monthIndex, monthsBetween, shortUrl } from "./format";
import { BigMoney } from "./motion";
import { goalEmoji, Ring } from "./pictures";
import { AnimatedMonth, Badge, Empty } from "./ui";

type GoalWithPrice = TGoalView & { price?: TPriceCheck | null };

const STEP = 50000;
const MAX_EXTRA = 1000000;

function lateness(g: TGoalView): { text: string; late: boolean } {
  const d = monthsBetween(g.targetMonth, g.projectedMonth);
  if (d === 0) return { text: "🙂 On time", late: false };
  if (d > 0) return { text: `⏳ ${d} mo late`, late: true };
  return { text: `🚀 ${-d} mo early`, late: false };
}

function PriceLine({ goal, price }: { goal: TGoalView; price: TPriceCheck | null }) {
  if (price) {
    const pct = Math.round((goal.earmarked / price.price) * 1000) / 10;
    return (
      <div className="goal-price">
        <Ring percent={pct} size={60} stroke={7} center={<span className="ring-small">{Math.round(pct)}%</span>} label={`${pct}% saved at today's price`} />
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
  return <p className="muted small goal-hint">Ask Buggy for today&apos;s price</p>;
}

/** Drag to see the date move. It's worked out in the browser with the engine's own formula and never saved. */
function SaveMore({ goal, simMonth }: { goal: TGoalView; simMonth: string }) {
  const [extra, setExtra] = useState(0);
  const raw = projectMonth(simMonth, goal.target, goal.earmarked, goal.monthlyContribution + extra);
  const when = extra === 0 || monthIndex(raw) > monthIndex(goal.projectedMonth) ? goal.projectedMonth : raw;
  const sooner = monthsBetween(when, goal.projectedMonth);
  const filled = (extra / MAX_EXTRA) * 100;
  return (
    <div className="save-more">
      <label htmlFor={`more-${goal.id}`} className="save-more-label">
        {extra === 0 ? "What if you saved more each month?" : <>Save <b>{inr(extra)}</b> more a month</>}
      </label>
      <input
        id={`more-${goal.id}`}
        type="range"
        min={0}
        max={MAX_EXTRA}
        step={STEP}
        value={extra}
        style={{ background: `linear-gradient(to right, var(--accent) ${filled}%, var(--canvas) ${filled}%)` }}
        onChange={(e) => setExtra(Number(e.target.value))}
      />
      {extra > 0 && when !== NEVER_MONTH ? (
        <p className="save-more-result" key={when}>
          <b>{month(when)}</b> · {sooner > 0 ? `${sooner} mo sooner` : "same month"} <span className="muted small">· just a what-if</span>
        </p>
      ) : null}
    </div>
  );
}

export function GoalsTab({ state, prices, onSuggest }: { state: TAppState; prices: Record<string, TPriceCheck>; onSuggest: (text: string) => void }) {
  const goals = state.goals as GoalWithPrice[];
  if (goals.length === 0) return <div className="view"><Empty title="No goals yet">Say one: “Goa trip by June, 40 thousand.”</Empty></div>;

  return (
    <section aria-label="Goals">
      <header className="glass glass-head page-head">
        <h1 className="page-title">Your goals</h1>
        <p className="page-figure"><BigMoney value={goals.reduce((sum, g) => sum + g.earmarked, 0)} fromZero /></p>
        <p className="muted small">saved across {goals.length} {goals.length === 1 ? "goal" : "goals"}</p>
      </header>
      <div className="view goals-screen">
      <ul className="goal-cards">
        {goals.map((g, i) => {
          const late = lateness(g);
          const pct = g.target > 0 ? Math.min(100, Math.round((g.earmarked / g.target) * 100)) : 0;
          const price = prices[g.id] ?? g.price ?? null;
          return (
            <li key={g.id} className="goal-card glass" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="goal-card-top">
                <Ring percent={pct} emoji={goalEmoji(g.name, g.type)} size={104} stroke={10} label={`${g.name}: ${pct}% saved`} />
                <div className="goal-card-text">
                  <h3>{g.name}</h3>
                  <p className="goal-pct">{pct}% saved</p>
                  <p className="muted small">{inr(g.earmarked)} of {inr(g.target)}</p>
                </div>
              </div>
              <div className="goal-when">
                <span className="caption muted">You&apos;ll get there</span>
                <AnimatedMonth value={g.projectedMonth} className="goal-month" />
                <span className={late.late ? "pill pill-late" : "pill"}>{late.text}</span>
              </div>
              {g.reasonQuote ? <p className="bubble-quote">“{g.reasonQuote}”</p> : null}
              <SaveMore goal={g} simMonth={state.simMonth} />
              <PriceLine goal={g} price={price} />
            </li>
          );
        })}
      </ul>
      <button type="button" className="chip chip-add" onClick={() => onSuggest("New goal: Bike by December 2027, 90 thousand")}><span aria-hidden="true">➕</span> Say a new goal</button>
      </div>
    </section>
  );
}
