"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { TAppState, TMunshiResponse } from "@/contract/schemas";
import { dateTime, humanize, inr, shortUrl } from "./format";
import { CloseIcon, SendIcon } from "./icons";
import { useTypingPulse, Wave } from "./motion";
import { Avatar, categoryEmoji, Ring } from "./pictures";
import { Badge, Elapsed, SourceBadge } from "./ui";

export type MunshiEntry = { id: number; question: string; res: TMunshiResponse };

const QUESTIONS = [
  { emoji: "🤝", text: "Maine kisko udhar diya hai?" },
  { emoji: "🍔", text: "Is mahine sabse zyada kahan kharch hua?" },
  { emoji: "📅", text: "Mera EMI kitna jaata hai?" },
  { emoji: "📱", text: "Mera iPhone wala plan kitna pahuncha, aur price badha kya?" },
];

export function Answer({ entry, state }: { entry: MunshiEntry; state: TAppState }) {
  const { question, res } = entry;
  const refused = res.intent === "refused";
  const goal = res.price ? state.goals.find((g) => g.id === res.price!.goalId) : undefined;
  const planned = goal && goal.target > 0 ? Math.round((goal.earmarked / goal.target) * 1000) / 10 : null;
  const today = goal && res.price ? Math.round((goal.earmarked / res.price.price) * 1000) / 10 : null;
  return (
    <article className="chat-turn">
      <p className="chat-me">{question}</p>
      <div className="chat-munshi">
        <Avatar emoji={refused ? "🙅" : "🐞"} size={40} />
        <div className="chat-bubble">
          <div className="chat-tags">
            {refused ? <Badge tone="block">Won&apos;t name a security</Badge> : null}
            <SourceBadge source={res.source} />
          </div>
          <p className="chat-text">{res.answer}</p>
          {goal && res.price && planned !== null && today !== null ? (
            <>
              <div className="ring-pair">
                <figure><Ring percent={planned} size={96} stroke={10} center={<span className="ring-small">{planned}%</span>} label={`${planned}% of the planned price`} /><figcaption>Planned {inr(goal.target)}</figcaption></figure>
                <span className="ring-arrow" aria-hidden="true">→</span>
                <figure><Ring percent={today} size={96} stroke={10} center={<span className="ring-small">{today}%</span>} label={`${today}% of today's price`} /><figcaption>Today {inr(res.price.price)}</figcaption></figure>
              </div>
              <p className="muted small">
                {res.price.label} · {res.price.variant} · {dateTime(res.price.checkedAt)}
                {res.price.cached ? <> <Badge>Cached</Badge></> : null}{" "}
                <a href={res.price.sourceUrl} target="_blank" rel="noreferrer">{shortUrl(res.price.sourceUrl).split("/")[0]}</a>
              </p>
            </>
          ) : res.facts.length > 0 ? (
            <ul className="fact-chips">
              {res.facts.map((f) => <li key={f.label}><span className="muted small">{f.label}</span><b>{f.value}</b></li>)}
            </ul>
          ) : null}
          {res.scenario ? (
            <div className="scenario">
              <p className="scenario-head">🧮 Modelled scenario, not advice</p>
              <p>{res.scenario}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Buggy's chat window. (Munshi is its old name, still used inside the code.) It floats over any screen, with its own text box for Wispr Flow to type into. */
export function MunshiChat({ state, entries, working, busy, onSend, onAsk, onClose, onUndoRule, inputRef }: {
  state: TAppState;
  entries: MunshiEntry[];
  working: string | null;
  busy: boolean;
  onSend: (text: string) => void;
  onAsk: (text: string) => void;
  onClose: () => void;
  onUndoRule: (ruleId: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [text, setText] = useState("");
  const [typing, pingTyping] = useTypingPulse();
  const end = useRef<HTMLDivElement>(null);
  const chronological = [...entries].reverse();

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [entries.length, working]);
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [inputRef]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = () => {
    const raw = text.trim();
    if (!raw || busy) return;
    setText("");
    onSend(raw);
  };

  return (
    <div className="chat-layer">
      <button type="button" className="chat-scrim" aria-label="Close Buggy" tabIndex={-1} onClick={onClose} />
      <section className="chat-window" role="dialog" aria-label="Chat with Buggy">
        <header className="chat-head glass">
          <Avatar emoji="🐞" size={44} tint="goal" />
          <div className="chat-head-text">
            <b>Buggy</b>
            <span className="small">Ask about spending, lending, EMIs, cash or goals</span>
          </div>
          <button type="button" className="chat-close" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </header>

        <div className="chat-scroll">
          {chronological.length === 0 && !working ? <p className="chat-hello">👋 I keep your file. What do you want to know?</p> : null}
          {chronological.map((e) => <Answer key={e.id} entry={e} state={state} />)}
          {working ? (
            <article className="chat-turn" role="status" aria-live="polite">
              <p className="chat-me">{working}</p>
              <div className="chat-munshi"><Avatar emoji="🐞" size={40} tint="goal" /><div className="chat-bubble"><span className="typing"><i /><i /><i /></span> <Elapsed /></div></div>
            </article>
          ) : null}
          <div className="chips">
            {QUESTIONS.map((q) => (
              <button type="button" key={q.text} className="chip" disabled={busy} onClick={() => onAsk(q.text)}><span aria-hidden="true">{q.emoji}</span> {q.text}</button>
            ))}
          </div>
          <details className="learned">
            <summary>🧠 What I&apos;ve learned from you ({state.rules.length})</summary>
            {state.rules.length === 0 ? (
              <p className="muted small">Correct me once and I&apos;ll remember: “Rahul ko jo jaata hai woh rent hai.”</p>
            ) : (
              <ul className="people">
                {state.rules.map((r) => (
                  <li key={r.id} className="person rule">
                    <Avatar emoji={categoryEmoji(r.category)} size={42} />
                    <span className="act-main">
                      <b>{r.pattern} → {humanize(r.category)}</b>
                      {r.reasonQuote ? <span className="act-sub">“{r.reasonQuote}”</span> : null}
                      <span className="act-sub">Used {r.appliedCount}×{r.minAmount !== null && r.maxAmount !== null ? ` · ${inr(r.minAmount)} to ${inr(r.maxAmount)}` : ""}</span>
                    </span>
                    <button type="button" className="btn-link" onClick={() => onUndoRule(r.id)}>Undo</button>
                  </li>
                ))}
              </ul>
            )}
          </details>
          <div ref={end} />
        </div>

        <form className="bar chat-bar" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Wave active={typing} />
          <label className="visually-hidden" htmlFor="munshi-input">Ask Buggy</label>
          <textarea
            id="munshi-input"
            ref={inputRef}
            className="bar-input"
            rows={1}
            value={text}
            placeholder="Ask Buggy anything…"
            onChange={(e) => { setText(e.target.value); pingTyping(); }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="bar-send" aria-label="Ask" disabled={!text.trim() || busy}>{busy ? "…" : <SendIcon />}</button>
        </form>
      </section>
    </div>
  );
}
