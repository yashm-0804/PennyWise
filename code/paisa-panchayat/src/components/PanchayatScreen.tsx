"use client";

import { useState } from "react";
import type { TAppState, TPanchayat, TRulingResponse, TVoice } from "@/contract/schemas";
import { actionLabel, chosenPlanId, goalNames, opNotes } from "./flow";
import { deltaLabel, inr, month, monthsBetween } from "./format";
import { Avatar, goalColor, goalEmoji, rowEmoji } from "./pictures";
import { AnimatedMonth, Badge, Elapsed, Empty, SourceBadge } from "./ui";

export type OpenPanchayat = {
  data: TPanchayat;
  ruling: { text: string; res: TRulingResponse } | null;
  applied: boolean;
};

const STANCE = { defend: "👍 Backs", concede: "🤝 Can live with", oppose: "✋ Against" } as const;
const planLetter = (i: number) => String.fromCharCode(65 + i);

function triggerEmoji(label: string): string {
  return rowEmoji({ kind: "expense", label, category: null });
}

/** The strongest stance is the one worth showing: what this goal refuses, or else what it accepts at a cost. */
function mainStance(voice: TVoice) {
  return voice.stances.find((s) => s.stance === "oppose") ?? voice.stances.find((s) => s.stance === "concede") ?? voice.stances[0];
}

function VoiceBubble({ voice, plans, goals, index }: { voice: TVoice; plans: TPanchayat["plans"]; goals: TAppState["goals"]; index: number }) {
  const stance = mainStance(voice);
  const planIndex = stance ? plans.findIndex((p) => p.id === stance.planId) : -1;
  const goal = goals.find((g) => g.id === voice.goalId);
  const color = goalColor(goals, voice.goalId);
  return (
    <li className="voice" style={{ animationDelay: `${index * 180}ms` }}>
      <Avatar emoji={goalEmoji(voice.goalName, goal?.type)} size={52} tint={color} />
      <div className="voice-bubble">
        <div className="voice-head">
          <b style={{ color }}>{voice.goalName}</b>
          <SourceBadge source={voice.source} />
        </div>
        <p className="voice-line">{voice.line}</p>
        {stance && planIndex >= 0 ? <p className="voice-stance">{STANCE[stance.stance]} Plan {planLetter(planIndex)}</p> : null}
      </div>
    </li>
  );
}

function PlanCards({ open, state, names, onChoose, busy }: {
  open: OpenPanchayat;
  state: TAppState | null;
  names: Record<string, string>;
  onChoose: (planId: string, label: string) => void;
  busy: boolean;
}) {
  const { data, ruling } = open;
  const chosen = ruling ? chosenPlanId(ruling.res.ops) : null;
  const goals = state?.goals ?? [];
  const assumptions = [...new Set(data.plans.flatMap((p) => p.assumptions).map((a) => a.replace(/^Assumption:\s*/, "")))];
  return (
    <div className="plans">
      <h2 className="plans-title">Pick a plan, or say your own</h2>
      <ul className="plan-cards">
        {data.plans.map((plan, i) => {
          const letter = planLetter(i);
          return (
            <li key={plan.id} className={`plan-card ${plan.id === chosen ? "is-chosen" : ""}`}>
              <div className="plan-top">
                <span className="plan-badge">{letter}</span>
                <b className="plan-title">{plan.title}</b>
              </div>
              {plan.impacts.length === 0 ? (
                <p className="plan-free">🎉 No goal moves</p>
              ) : (
                <ul className="impacts">
                  {plan.impacts.map((impact) => {
                    const goal = goals.find((g) => g.id === impact.goalId);
                    return (
                      <li key={impact.goalId} className="impact">
                        <Avatar emoji={goalEmoji(impact.goalName, goal?.type)} size={44} tint={goalColor(goals, impact.goalId)} />
                        <span className="impact-main">
                          <b>{impact.goalName}</b>
                          <span className="impact-dates"><s>{month(impact.beforeMonth)}</s> → <b>{month(impact.afterMonth)}</b></span>
                        </span>
                        <span className={impact.deltaMonths > 0 ? "impact-delta is-late" : "impact-delta is-early"}>
                          {deltaLabel(impact.deltaMonths)}
                          {impact.amountGiven ? <small>{inr(impact.amountGiven)}</small> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="plan-actions muted small">{plan.actions.map((a) => actionLabel(a, names)).join(" · ")}</p>
              {!open.applied ? (
                <button type="button" className={plan.id === chosen ? "btn btn-primary btn-wide" : "btn btn-quiet btn-wide"} disabled={busy} onClick={() => onChoose(plan.id, `Plan ${letter}`)}>
                  {plan.id === chosen ? "✅ Your pick" : `Choose Plan ${letter}`}
                </button>
              ) : plan.id === chosen ? <p className="plan-picked">✅ Your pick</p> : null}
            </li>
          );
        })}
      </ul>
      {assumptions.length > 0 ? (
        <details className="assumptions">
          <summary>ℹ️ What this assumes ({assumptions.length})</summary>
          <ul>{assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        </details>
      ) : null}
    </div>
  );
}

function RulingPanel({ open, state, names, busy, onApply, onClose }: {
  open: OpenPanchayat;
  state: TAppState | null;
  names: Record<string, string>;
  busy: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  const res = open.ruling!.res;
  const notes = opNotes(res.ops, names);
  const canApply = res.ops.length > 0 && !open.applied && !busy;
  const whatIf = open.data.trigger.kind === "whatif";
  const goals = state?.goals ?? [];

  return (
    <div className={`ruling ${open.applied ? "is-applied" : ""}`}>
      <p className="ruling-kicker">{open.applied ? (whatIf ? "📝 Decision noted" : "🎉 Ruling applied") : "⚖️ Your ruling"}</p>
      <p className="ruling-quote">“{open.ruling!.text}”</p>

      {res.diff.length > 0 ? (
        <ul className="diff">
          {res.diff.map((d) => {
            const delta = monthsBetween(d.beforeMonth, d.afterMonth);
            const goal = goals.find((g) => g.id === d.goalId);
            return (
              <li key={d.goalId} className="diff-row">
                <Avatar emoji={goalEmoji(d.goalName, goal?.type)} size={48} tint={goalColor(goals, d.goalId)} />
                <span className="diff-main">
                  <b>{d.goalName}</b>
                  <span className="diff-months">
                    {open.applied && !whatIf ? (
                      <AnimatedMonth from={d.beforeMonth} value={d.afterMonth} className="diff-after" />
                    ) : (
                      <><s>{month(d.beforeMonth)}</s> → <b className="diff-after">{month(d.afterMonth)}</b></>
                    )}
                  </span>
                </span>
                <span className={delta > 0 ? "impact-delta is-late" : "impact-delta is-early"}>{deltaLabel(delta)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">No date moves.</p>
      )}

      {notes.map((n) => <p key={n} className="ruling-note">🔮 {n}</p>)}
      {res.questions.map((q) => <p key={q} className="ruling-question">🙋 {q}</p>)}
      {res.precedentCited ? <p className="ruling-precedent">📜 Last time you said: “{res.precedentCited}”</p> : null}
      {whatIf && open.applied ? <p className="muted">These dates show what would happen. A what-if moves no money.</p> : null}

      {open.applied ? (
        <button type="button" className="btn btn-quiet btn-wide" onClick={onClose}>{whatIf ? "Done" : "See my goals"}</button>
      ) : (
        <>
          <button type="button" className="btn btn-primary btn-wide btn-big" disabled={!canApply} onClick={onApply} data-testid="apply-ruling">
            {busy ? <>Applying <Elapsed /></> : whatIf ? "Note this decision" : "Apply ruling"}
          </button>
          <p className="muted small center">Not right? Say it again or pick another plan.</p>
        </>
      )}
    </div>
  );
}

/** Stands in while plans and voices are worked out, with the real goals gathering. */
export function PanchayatConvening({ text, state }: { text: string; state: TAppState | null }) {
  const goals = (state?.goals ?? []).slice(0, 4);
  return (
    <section className="panchayat convening" aria-busy="true" role="status" aria-live="polite">
      <div className="trigger-card">
        <p className="trigger-kicker">Calling your goals in <Elapsed /></p>
        <p className="trigger-quote">“{text}”</p>
      </div>
      <div className="gathering">
        {goals.map((g, i) => (
          <span key={g.id} className="gathering-goal" style={{ animationDelay: `${i * 160}ms` }}>
            <Avatar emoji={goalEmoji(g.name, g.type)} size={68} tint={state ? goalColor(state.goals, g.id) : undefined} />
            <b>{g.name}</b>
          </span>
        ))}
      </div>
      <p className="muted center">Finding plans, then each goal has its say.</p>
    </section>
  );
}

export function PanchayatScreen({ open, state, rulingBusy, applyBusy, onApply, onClose, onChoose }: {
  open: OpenPanchayat;
  state: TAppState | null;
  rulingBusy: string | null;
  applyBusy: boolean;
  onApply: () => void;
  onClose: () => void;
  onChoose: (planId: string, label: string) => void;
}) {
  const names = goalNames(state);
  const { trigger, plans, voices, id } = open.data;
  const hasRuling = Boolean(open.ruling);

  return (
    <section className="panchayat" aria-label="Panchayat" data-panchayat={id}>
      <header className="trigger-card">
        <span className="trigger-icon" aria-hidden="true">{trigger.kind === "whatif" ? "🤔" : triggerEmoji(trigger.label)}</span>
        <div className="trigger-main">
          <p className="trigger-kicker">{trigger.kind === "whatif" ? "What if…" : "Big expense"}</p>
          <h1 className="trigger-title">{trigger.label} <span>{inr(trigger.amount)}</span></h1>
          <p className="trigger-quote">“{trigger.quote}”</p>
        </div>
        <div className="trigger-side">
          <p className={open.applied ? "whatif is-applied" : "whatif"}>
            {open.applied ? (trigger.kind === "whatif" ? "Noted. A what-if moves no money." : "✅ Ruling saved") : "What-if: nothing saved yet"}
          </p>
          <button type="button" className="btn-link" onClick={onClose}>{open.applied ? "Close" : "Close without ruling"}</button>
        </div>
      </header>

      <div className="panchayat-body">
        <div className="panchayat-talk">
          {rulingBusy ? (
            <div role="status" aria-live="polite" className="ruling ruling-reading">
              <p className="ruling-kicker">⚖️ Reading your ruling <Elapsed /></p>
              <p className="ruling-quote">“{rulingBusy}”</p>
              <span className="typing"><i /><i /><i /></span>
            </div>
          ) : hasRuling ? (
            <RulingPanel open={open} state={state} names={names} busy={applyBusy} onApply={onApply} onClose={onClose} />
          ) : null}
          {voices.length > 0 ? (
            <>
              <h2 className="plans-title">Your goals have a say</h2>
              <ul className="voice-list">
                {voices.slice(0, 3).map((v, i) => <VoiceBubble key={v.goalId} voice={v} plans={plans} goals={state?.goals ?? []} index={i} />)}
              </ul>
            </>
          ) : plans.length === 0 ? (
            <Empty title="No plan covers this">It&apos;s more than your goals and spare money can absorb. Close this and check the amount.</Empty>
          ) : !hasRuling ? (
            <p className="note-card">😌 No goal loses a month here, so nobody&apos;s arguing.</p>
          ) : null}
        </div>
        <PlanCards open={open} state={state} names={names} onChoose={onChoose} busy={applyBusy || rulingBusy !== null} />
      </div>
    </section>
  );
}
