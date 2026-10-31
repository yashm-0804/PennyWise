"use client";

import { useState } from "react";
import type { TAppState } from "@/contract/schemas";
import { humanize, inr, month, shortDate } from "./format";
import { Money } from "./motion";
import { Avatar, goalEmoji, Initial, Ring, rowEmoji } from "./pictures";
import { cashReason, emiReason, fixedReason, goalReason, leftReason, oweReason, owedReason, ringReason, rowReason, safetyReason, spareReason, spentReason } from "./reasons";
import { Badge, Empty } from "./ui";
import { Why } from "./Why";

type Row = TAppState["rows"][number];
type Filter = "all" | "spent" | "other";

const FIRST_ROWS = 8;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "spent", label: "Spending" },
  { id: "other", label: "Cash & people" },
];

export const SUGGESTIONS = [
  { emoji: "🍔", text: "Swiggy pe 450 gaye" },
  { emoji: "🤝", text: "Rohit ko 2000 udhar diye" },
  { emoji: "🤔", text: "What if I cut dining by 30%?" },
  { emoji: "💻", text: "Laptop died, new one is 70 thousand, need it this month" },
];

/** Why a row isn't spend, in a word or two. This is the point of the ledger. */
function notSpendReason(kind: string): string {
  if (kind === "withdrawal") return "Moved to cash";
  if (kind === "lend") return "Owed to you";
  if (kind === "borrow") return "You owe";
  if (kind === "repay_in" || kind === "repay_out") return "Repayment";
  if (kind === "income") return "Income";
  if (kind === "card_bill") return "Card bill";
  return "Not spend";
}

const SOURCE_LABEL: Record<Row["source"], string> = {
  dictation: "You said this", sms: "From SMS", csv: "From CSV", pdf: "From PDF", seed: "Sample data", simulated: "Simulated month",
};

function Activity({ row, fresh, busy, index, onUndo, onTreatment }: {
  row: Row;
  fresh: boolean;
  busy: boolean;
  index: number;
  onUndo: (eventId: string) => void;
  onTreatment: (eventId: string, t: "transfer" | "spend") => void;
}) {
  const [open, setOpen] = useState(false);
  const quiet = !row.countsAsSpend || row.reversed;
  return (
    <li className={`act ${open ? "is-open" : ""} ${fresh ? "is-fresh" : ""} ${row.reversed ? "is-reversed" : ""}`} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
      <div className="act-head">
        <button type="button" className="act-open" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Avatar emoji={rowEmoji(row)} />
          <span className="act-main">
            <b className="act-title">{row.label}</b>
            <span className="act-sub">
              {shortDate(row.date)}
              {row.category ? ` · ${humanize(row.category)}` : ""}
              {quiet && !row.reversed ? ` · ${notSpendReason(row.kind)}` : ""}
              {row.reversed ? " · Undone" : ""}
            </span>
          </span>
        </button>
        <Why reason={rowReason(row)} className={`act-amount ${quiet ? "is-quiet" : ""}`}>{inr(row.amount)}</Why>
      </div>
      {row.source === "simulated" ? <div className="act-tag"><Badge tone="sim">Simulated month</Badge></div> : null}
      {open ? (
        <div className="act-more">
          <p className="muted">{SOURCE_LABEL[row.source]}{row.flag ? ` · ${row.flag}` : ""}</p>
          {row.sourceQuote ? <p className="bubble-quote">“{row.sourceQuote}”</p> : null}
          {row.kind === "withdrawal" && !row.reversed ? (
            <div className="toggle" role="group" aria-label="Treat this withdrawal as">
              <button type="button" disabled={busy} aria-pressed={!row.countsAsSpend} onClick={() => onTreatment(row.eventId, "transfer")}>🏧 Moved to cash</button>
              <button type="button" disabled={busy} aria-pressed={row.countsAsSpend} onClick={() => onTreatment(row.eventId, "spend")}>💸 Spent</button>
            </div>
          ) : null}
          {!row.reversed ? <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => onUndo(row.eventId)}>↩️ Undo this</button> : null}
        </div>
      ) : null}
    </li>
  );
}

export function KhataTab({ state, freshIds, busy, onUndo, onTreatment, onSuggest, onGoals, resetControl }: {
  state: TAppState;
  freshIds: string[];
  busy: boolean;
  onUndo: (eventId: string) => void;
  onTreatment: (eventId: string, t: "transfer" | "spend") => void;
  onSuggest: (text: string) => void;
  onGoals: () => void;
  resetControl: React.ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const rows = [...state.rows]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((r) => filter === "all" || (filter === "spent" ? r.countsAsSpend : !r.countsAsSpend));
  const shown = showAll ? rows : rows.slice(0, FIRST_ROWS);
  const people = state.people.filter((p) => p.owesMe !== 0 || p.iOwe !== 0);
  const p = state.profile;
  const left = p.monthlyIncome - p.monthSpend;
  const leftPct = p.monthlyIncome > 0 ? (Math.max(0, left) / p.monthlyIncome) * 100 : 0;

  return (
    <div className="home">
      <section className="band band-ink" aria-label={`Money ${left < 0 ? "over" : "left"} in ${month(state.simMonth)}`}>
        <div className="band-inner hero">
          <div className="hero-top">
            <div className="hero-text">
              <p className="caption hero-kicker">{left < 0 ? "Over" : "Left"} in {month(state.simMonth)}</p>
              <p className={`hero-amount ${left < 0 ? "is-over" : ""}`}><Why reason={leftReason(state)}><Money value={left} fromZero /></Why></p>
              <p className="hero-sub"><Why reason={spentReason(state)}>Spent {inr(p.monthSpend)} of {inr(p.monthlyIncome)}</Why></p>
            </div>
            <Why reason={ringReason(state)} className="why-plain">
              <Ring
                percent={leftPct}
                size={104}
                stroke={10}
                track="var(--accent-5)"
                center={<span className="hero-ring-pct">{Math.round(leftPct)}%</span>}
                label={`${Math.round(leftPct)}% of this month's income is left`}
              />
            </Why>
          </div>
          <ul className="tiles" aria-label="Your money profile">
            <li className="tile"><span className="tile-icon" aria-hidden="true">🏠</span><span className="tile-label">Fixed costs</span><Why reason={fixedReason(state)}><b><Money value={p.fixedCosts} /></b></Why></li>
            <li className="tile"><span className="tile-icon" aria-hidden="true">🛟</span><span className="tile-label">Safety fund</span><Why reason={safetyReason(state)}><b><Money value={p.emergencyFund} /></b></Why></li>
            <li className="tile"><span className="tile-icon" aria-hidden="true">🌱</span><span className="tile-label">Spare a month</span><Why reason={spareReason(state)}><b><Money value={p.monthlySurplus} /></b></Why></li>
          </ul>
        </div>
      </section>

      <div className="view">
        <section aria-label="Goals">
          <div className="row-head"><h2>Your goals</h2><button type="button" className="text-link" onClick={onGoals}>See all</button></div>
          <div className="goal-strip">
            {state.goals.map((g, i) => {
              const pct = g.target > 0 ? (g.earmarked / g.target) * 100 : 0;
              return (
                <div key={g.id} className="goal-chip" style={{ animationDelay: `${i * 70}ms` }}>
                  <button type="button" className="goal-chip-open" onClick={onGoals}>
                    <Ring percent={pct} emoji={goalEmoji(g.name, g.type)} size={84} stroke={8} track="var(--canvas)" label={`${g.name}: ${Math.round(pct)}% saved`} />
                    <b>{g.name}</b>
                  </button>
                  <Why reason={goalReason(g)}><span className="goal-chip-num">{Math.round(pct)}% · {month(g.projectedMonth)}</span></Why>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label="Try saying">
          <div className="row-head"><h2>Try saying</h2></div>
          <div className="chips chips-scroll">
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s.text} className="chip" onClick={() => onSuggest(s.text)}><span aria-hidden="true">{s.emoji}</span> {s.text}</button>
            ))}
          </div>
        </section>

        <section aria-label="Cash and people">
          <div className="row-head"><h2>Cash and people</h2></div>
          <ul className="people">
            <li className="person">
              <Avatar emoji="💵" />
              <span className="act-main"><b>Cash in hand</b><span className="act-sub">{state.cash.unexplained > 0 ? `${inr(state.cash.unexplained)} not explained yet` : "All explained"}</span></span>
              <Why reason={cashReason(state)} className="act-amount"><Money value={state.cash.balance} /></Why>
            </li>
            {people.flatMap((x) => [
              x.owesMe > 0 ? (
                <li key={`${x.person}-in`} className="person">
                  <Initial name={x.person} />
                  <span className="act-main"><b>{x.person}</b><span className="act-sub">owes you</span></span>
                  <Why reason={owedReason(x.person, state)} className="act-amount">{inr(x.owesMe)}</Why>
                </li>
              ) : null,
              x.iOwe > 0 ? (
                <li key={`${x.person}-out`} className="person">
                  <Initial name={x.person} />
                  <span className="act-main"><b>{x.person}</b><span className="act-sub">you owe</span></span>
                  <Why reason={oweReason(x.person)} className="act-amount">{inr(x.iOwe)}</Why>
                </li>
              ) : null,
            ])}
            {state.emis.map((e) => (
              <li key={e.name} className="person">
                <Avatar emoji="📅" />
                <span className="act-main"><b>{e.name}</b><span className="act-sub">{e.instalmentsLeft} EMIs left</span></span>
                <Why reason={emiReason(e)} className="act-amount">{inr(e.monthly)}</Why>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Your ledger">
          <div className="row-head"><h2>Your ledger</h2></div>
          <div className="filters" role="group" aria-label="Show">
            {FILTERS.map((f) => (
              <button type="button" key={f.id} className="filter" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>
          <p className="muted hint-line">Press and hold a number to see why. Tap a row for details.</p>
          {rows.length === 0 ? (
            <Empty title="Your ledger is empty">Say what happened: “ATM se 10 hazaar nikale.”</Empty>
          ) : (
            <ul className="acts" key={filter}>
              {shown.map((r, i) => (
                <Activity key={r.eventId} row={r} index={i} fresh={freshIds.includes(r.eventId)} busy={busy} onUndo={onUndo} onTreatment={onTreatment} />
              ))}
            </ul>
          )}
          {rows.length > FIRST_ROWS ? (
            <button type="button" className="btn btn-quiet btn-wide" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show less" : `Show all ${rows.length}`}</button>
          ) : null}
        </section>

        <p className="home-foot">{resetControl}</p>
      </div>
    </div>
  );
}
