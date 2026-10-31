"use client";

import { useEffect, useRef } from "react";
import type { TAppState } from "@/contract/schemas";
import { firstName } from "./account";
import { inr, month } from "./format";
import { Answer, type MunshiEntry } from "./MunshiChat";
import { leftReason } from "./reasons";
import { Elapsed } from "./ui";
import { Why } from "./Why";

export type OrbTarget = "khata" | "goals" | "panchayat" | "notices" | "profile";

const ORBS: { id: OrbTarget; label: string; emoji: string }[] = [
  { id: "khata", label: "Ledger", emoji: "📒" },
  { id: "goals", label: "Goals", emoji: "🎯" },
  { id: "panchayat", label: "Huddle", emoji: "🗣️" },
  { id: "notices", label: "Nudges", emoji: "🔔" },
  { id: "profile", label: "Profile", emoji: "👤" },
];

/** The app's front door: one question, one box, and a bubble for everything else. Answers appear here without leaving. */
export function StartScreen({ state, name, entries, working, noticeCount, huddleOpen, onOpen, onStartOver }: {
  state: TAppState;
  name: string;
  entries: MunshiEntry[];
  working: string | null;
  noticeCount: number;
  huddleOpen: boolean;
  onOpen: (target: OrbTarget) => void;
  onStartOver: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const chronological = [...entries].reverse();
  const talking = chronological.length > 0 || working !== null;
  const left = state.profile.monthlyIncome - state.profile.monthSpend;

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [entries.length, working]);

  return (
    <div className="start">
      {talking ? (
        <div className="glass glass-head thread-head">
          <Why reason={leftReason(state)}>{inr(Math.abs(left))} {left < 0 ? "over" : "left"} in {month(state.simMonth)}</Why>
        </div>
      ) : null}
      <div className="start-scroll">
        {!talking ? (
          <div className="greeting glass">
            <span className="coin" aria-hidden="true">₹</span>
            <h1>What can I help with, {firstName(name)}?</h1>
            <p className="greeting-stat">
              <Why reason={leftReason(state)}>{inr(Math.abs(left))} {left < 0 ? "over" : "left"} in {month(state.simMonth)}</Why>
            </p>
          </div>
        ) : (
          <div className="start-thread">
            {chronological.map((e) => <Answer key={e.id} entry={e} state={state} />)}
            {working ? (
              <article className="chat-turn" role="status" aria-live="polite">
                <p className="chat-me">{working}</p>
                <div className="chat-munshi"><span className="coin coin-small" aria-hidden="true">₹</span><div className="chat-bubble"><span className="typing"><i /><i /><i /></span> <Elapsed /></div></div>
              </article>
            ) : null}
            {!working ? <button type="button" className="text-link start-over" onClick={onStartOver}>Start over</button> : null}
            <div ref={end} />
          </div>
        )}
      </div>
      <nav className="orbs" aria-label="Sections">
        {ORBS.map((o, i) => (
          <button type="button" key={o.id} className="orb" style={{ animationDelay: `${120 + i * 60}ms` }} onClick={() => onOpen(o.id)}>
            <span className="orb-disc" aria-hidden="true">
              {o.emoji}
              {o.id === "notices" && noticeCount > 0 ? <span className="tab-count">{noticeCount}</span> : null}
              {o.id === "panchayat" && huddleOpen ? <span className="tab-dot" /> : null}
            </span>
            <span className="orb-label">{o.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
