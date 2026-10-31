"use client";

import { useState } from "react";
import type { TAppState, TImportResponse, TMonthlyReview, TNextMonthResponse, TNotice } from "@/contract/schemas";
import { dateTime, humanize, inr, month } from "./format";
import { Avatar, categoryEmoji, Ring } from "./pictures";
import { AnimatedMonth, Badge, Elapsed, Empty, SimulatedBadge, SourceBadge } from "./ui";

export type ImportArgs = { kind: "sms" | "csv" | "pdf"; text?: string; file?: File; password?: string };

const NOTICE_ICON: Record<TNotice["kind"], string> = {
  price_change: "📈",
  possibly_unused: "😴",
  drift: "🚨",
  condition_fired: "⚖️",
  rule_applied: "🧠",
  heavy_expense: "💸",
};

/** Some bodies open by repeating the title. Say it once. */
function bodyWithoutTitle(n: TNotice): string {
  const prefix = `${n.title}. `;
  return n.body.startsWith(prefix) ? n.body.slice(prefix.length) : n.body;
}

function NoticeCard({ notice, simulated, goal, movedFrom }: {
  notice: TNotice;
  simulated: boolean;
  goal: TAppState["goals"][number] | undefined;
  movedFrom: string | undefined;
}) {
  const fired = notice.kind === "condition_fired";
  return (
    <li className={`notice ${fired ? "is-fired" : ""}`}>
      <Avatar emoji={NOTICE_ICON[notice.kind]} size={48} />
      <div className="notice-main">
        <h3 className="notice-title">{notice.title}</h3>
        <p>{bodyWithoutTitle(notice)}</p>
        {fired && goal && movedFrom ? <AnimatedMonth from={movedFrom} value={goal.projectedMonth} className="notice-month" /> : null}
        {simulated ? <SimulatedBadge /> : null}
      </div>
    </li>
  );
}

/** Bubble area follows the amount, so the biggest spend is simply the biggest circle. */
function Review({ review, simulated }: { review: TMonthlyReview; simulated: boolean }) {
  const top = Math.max(...review.byCategory.map((c) => c.amount), 1);
  const savedPct = review.income > 0 ? Math.max(0, (review.saved / review.income) * 100) : 0;
  return (
    <section className="review" aria-label="Monthly review">
      <div className="review-head">
        <h2>🎉 {month(review.month)} recap</h2>
        <span className="row-gap">{simulated ? <SimulatedBadge /> : null}<SourceBadge source={review.source} /></span>
      </div>
      <div className="review-top">
        <Ring percent={savedPct} emoji="🐷" size={112} stroke={11} track="var(--canvas)" label={`Saved ${Math.round(savedPct)}% of income`} />
        <dl className="review-figures">
          <div><dt>💼 Came in</dt><dd>{inr(review.income)}</dd></div>
          <div><dt>🧾 Went out</dt><dd>{inr(review.spend)}</dd></div>
          <div><dt>🐷 Saved</dt><dd>{inr(review.saved)} · {Math.round(savedPct)}%</dd></div>
        </dl>
      </div>
      <p className="review-prose">{review.prose}</p>
      <ul className="bubbles" aria-label="Where the money went">
        {[...review.byCategory].sort((a, b) => b.amount - a.amount).slice(0, 8).map((c) => {
          const size = 58 + 54 * Math.sqrt(c.amount / top);
          return (
            <li key={c.category}>
              <span className="bubble" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">{categoryEmoji(c.category)}</span>
              <b>{inr(c.amount)}</b>
              <span className="muted small">{humanize(c.category)}</span>
            </li>
          );
        })}
      </ul>
      {review.highlights.length > 0 ? (
        <ul className="review-highlights">{review.highlights.map((h) => <li key={h}>✨ {h}</li>)}</ul>
      ) : null}
    </section>
  );
}

function ImportControls({ busy, result, onImport }: {
  busy: ImportArgs["kind"] | null;
  result: TImportResponse | null;
  onImport: (a: ImportArgs) => void;
}) {
  const [sms, setSms] = useState("");
  const [smsOpen, setSmsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const disabled = busy !== null;
  return (
    <section className="import" aria-label="Import">
      <div className="row-head"><h2>Bring in your statements</h2><Badge>Synthetic data</Badge></div>
      <div className="import-tiles">
        <button type="button" className="import-tile" disabled={disabled} aria-expanded={smsOpen} onClick={() => setSmsOpen((v) => !v)}>
          <span className="import-icon" aria-hidden="true">💬</span><b>Paste SMS</b>
        </button>
        <label className={`import-tile ${disabled ? "is-disabled" : ""}`}>
          <span className="import-icon" aria-hidden="true">📄</span><b>Upload CSV</b>
          <input type="file" accept=".csv,text/csv" disabled={disabled} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport({ kind: "csv", file });
            e.target.value = "";
          }} />
        </label>
        <label className={`import-tile ${disabled ? "is-disabled" : ""}`}>
          <span className="import-icon" aria-hidden="true">🧾</span><b>Upload PDF</b>
          <input type="file" accept=".pdf,application/pdf" disabled={disabled} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport({ kind: "pdf", file, password: password || undefined });
            e.target.value = "";
          }} />
        </label>
      </div>
      {smsOpen ? (
        <div className="sms-box">
          <textarea aria-label="Paste SMS" rows={3} value={sms} onChange={(e) => setSms(e.target.value)} placeholder="Rs.640 debited from A/c XX1234 to SWIGGY…" />
          <button type="button" className="btn btn-primary btn-wide" disabled={disabled || !sms.trim()} onClick={() => { onImport({ kind: "sms", text: sms }); setSms(""); setSmsOpen(false); }}>Import SMS</button>
        </div>
      ) : null}
      <label className="field">
        <span className="muted small">🔒 PDF password, if it has one</span>
        <input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      {busy ? (
        <div role="status" aria-live="polite" className="import-busy">
          <span className="typing"><i /><i /><i /></span> Reading your {busy.toUpperCase()} <Elapsed />
        </div>
      ) : null}

      {result && !busy ? (
        <div className="import-result" role="status">
          <p className="import-added">✅ <b>{result.added}</b> added · {result.duplicates} {result.duplicates === 1 ? "duplicate" : "duplicates"} skipped</p>
          {result.needsReview.length > 0 ? (
            <details>
              <summary>{result.needsReview.length} to look at</summary>
              <ul className="import-list">
                {result.needsReview.map((t, i) => <li key={`${t.date}-${i}`}>{t.narration} · {inr(Math.abs(t.amount))}</li>)}
              </ul>
            </details>
          ) : null}
          {result.unparsed.length > 0 ? (
            <details>
              <summary>{result.unparsed.length} couldn&apos;t be read</summary>
              <ul className="import-list muted">{result.unparsed.map((t) => <li key={t}>{t}</li>)}</ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function NoticesTab({ state, nextMonth, simMonths, movedFrom, nextBusy, importBusy, importResult, onNextMonth, onImport }: {
  state: TAppState;
  nextMonth: TNextMonthResponse | null;
  simMonths: Set<string>;
  movedFrom: Record<string, string>;
  nextBusy: boolean;
  importBusy: ImportArgs["kind"] | null;
  importResult: TImportResponse | null;
  onNextMonth: () => void;
  onImport: (a: ImportArgs) => void;
}) {
  const fromRun = new Set(nextMonth?.notices.map((n) => n.id));
  const seen = new Set<string>();
  const notices = [...(nextMonth?.notices ?? []), ...state.notices]
    .filter((n) => (seen.has(n.id) ? false : Boolean(seen.add(n.id))))
    .sort((a, b) => Number(b.kind === "condition_fired") - Number(a.kind === "condition_fired"));
  const review = nextMonth?.review ?? state.review;
  const goalById = (id: string | null) => state.goals.find((g) => g.id === id);

  return (
    <div className="notices view">
      <div className="notices-left">
        <button type="button" className="next-card" disabled={nextBusy} onClick={onNextMonth} data-testid="next-month">
          <span className="next-icon" aria-hidden="true">⏭️</span>
          <span>
            <b>{nextBusy ? <>Running the month <Elapsed /></> : "Import next month"}</b>
            <span className="next-sub">Simulated, to show what happens next</span>
          </span>
        </button>
        {nextMonth && !nextBusy ? <p className="center"><SimulatedBadge /> {month(nextMonth.month)} imported</p> : null}

        <div className="row-head"><h1 className="page-title">Alerts</h1></div>
        {notices.length === 0 ? (
          <Empty title="All quiet 😌">Alerts and nudges land here after an import.</Empty>
        ) : (
          <ul className="notice-list">
            {notices.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                simulated={fromRun.has(n.id) || simMonths.has(n.createdAt.slice(0, 7))}
                goal={goalById(n.goalId)}
                movedFrom={n.goalId ? movedFrom[n.goalId] : undefined}
              />
            ))}
          </ul>
        )}

        <section aria-label="Past rulings" className="precedents">
          <div className="row-head"><h2>⚖️ Your past rulings</h2></div>
          {state.panchayats.length === 0 ? (
            <p className="muted empty-note">Your first ruling gets remembered for next time.</p>
          ) : (
            <ul className="people">
              {state.panchayats.map((p) => (
                <li key={p.id} className="person">
                  <span className="act-main">
                    <b>{p.label}</b>
                    <span className="act-sub">{p.rulingQuote ? `“${p.rulingQuote}”` : "No ruling given"}</span>
                    <span className="act-sub">{dateTime(p.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="notices-right">
        {review ? <Review review={review} simulated={simMonths.has(review.month)} /> : (
          <section className="review"><Empty title="No recap yet">Import a month to see your first recap.</Empty></section>
        )}
        <ImportControls busy={importBusy} result={importResult} onImport={onImport} />
      </div>
    </div>
  );
}
