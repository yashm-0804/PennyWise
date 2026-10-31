"use client";

import { useEffect, useRef } from "react";
import type { TAppState } from "@/contract/schemas";
import { firstName } from "./account";
import { inr, month } from "./format";
import { BellIcon, GoalIcon, LedgerIcon, PanchayatIcon, ProfileIcon } from "./icons";
import { Answer, type MunshiEntry } from "./MunshiChat";
import { leftReason } from "./reasons";
import { Elapsed } from "./ui";
import { Why } from "./Why";

export type OrbTarget = "khata" | "goals" | "panchayat" | "notices" | "profile";

const ORBS: { id: OrbTarget; label: string; icon: React.ReactNode }[] = [
  { id: "khata", label: "Ledger", icon: <LedgerIcon /> },
  { id: "goals", label: "Goals", icon: <GoalIcon /> },
  { id: "panchayat", label: "Huddle", icon: <PanchayatIcon /> },
  { id: "notices", label: "Nudges", icon: <BellIcon /> },
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
];

/** A bubble for every other section, below the box. */
export function StartOrbs({ noticeCount, huddleOpen, onOpen }: {
  noticeCount: number;
  huddleOpen: boolean;
  onOpen: (target: OrbTarget) => void;
}) {
  return (
    <nav className="orbs" aria-label="Sections">
      {ORBS.map((o, i) => (
        <button type="button" key={o.id} className="orb" style={{ animationDelay: `${120 + i * 60}ms` }} onClick={() => onOpen(o.id)}>
          <span className="orb-disc" aria-hidden="true">
            {o.icon}
            {o.id === "notices" && noticeCount > 0 ? <span className="tab-count">{noticeCount}</span> : null}
            {o.id === "panchayat" && huddleOpen ? <span className="tab-dot" /> : null}
          </span>
          <span className="orb-label">{o.label}</span>
        </button>
      ))}
    </nav>
  );
}

/** The app's front door: one question above the box. Answers appear here without leaving. */
export function StartScreen({ state, name, entries, working, onStartOver }: {
  state: TAppState;
  name: string;
  entries: MunshiEntry[];
  working: string | null;
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
    </div>
  );
}
