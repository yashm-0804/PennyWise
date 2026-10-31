"use client";

import type { TAppState } from "@/contract/schemas";
import { signOut } from "./account";
import { inr } from "./format";
import { Avatar } from "./pictures";
import { fixedReason, safetyReason, spareReason } from "./reasons";
import { Why } from "./Why";

const SAY = [
  { emoji: "💼", text: "My income is now 90 thousand a month" },
  { emoji: "🎁", text: "My bonus this year will be 60 thousand" },
];

export function ProfileTab({ state, name, onSuggest, onAskBuggy, resetControl }: {
  state: TAppState;
  name: string;
  onSuggest: (text: string) => void;
  onAskBuggy: () => void;
  resetControl: React.ReactNode;
}) {
  const p = state.profile;
  return (
    <section className="view profile" aria-label="Your profile">
      <div className="profile-head">
        <span className="profile-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="muted small">Prototype account on this device</p>
        </div>
      </div>

      <div>
        <div className="row-head"><h2>Your money profile</h2></div>
        <ul className="people">
          <li className="person"><Avatar emoji="💼" /><span className="act-main"><b>Monthly income</b></span><span className="act-amount">{inr(p.monthlyIncome)}</span></li>
          <li className="person"><Avatar emoji="🏠" /><span className="act-main"><b>Fixed costs</b></span><Why reason={fixedReason(state)} className="act-amount">{inr(p.fixedCosts)}</Why></li>
          <li className="person"><Avatar emoji="🛟" /><span className="act-main"><b>Safety fund</b></span><Why reason={safetyReason(state)} className="act-amount">{inr(p.emergencyFund)}</Why></li>
          <li className="person"><Avatar emoji="🌱" /><span className="act-main"><b>Spare a month</b></span><Why reason={spareReason(state)} className="act-amount">{inr(p.monthlySurplus)}</Why></li>
          <li className="person"><Avatar emoji="🎁" /><span className="act-main"><b>Expected bonus</b></span><span className="act-amount">{p.expectedBonus === null ? "Not set" : inr(p.expectedBonus)}</span></li>
        </ul>
      </div>

      <div>
        <div className="row-head"><h2>Change it by saying it</h2></div>
        <div className="chips">
          {SAY.map((s) => <button type="button" key={s.text} className="chip" onClick={() => onSuggest(s.text)}><span aria-hidden="true">{s.emoji}</span> {s.text}</button>)}
        </div>
      </div>

      <button type="button" className="person profile-row" onClick={onAskBuggy}>
        <Avatar emoji="🐞" tint="goal" />
        <span className="act-main"><b>What Buggy has learned</b><span className="act-sub">{state.rules.length} {state.rules.length === 1 ? "rule" : "rules"} from your corrections</span></span>
        <span aria-hidden="true">›</span>
      </button>

      <p className="muted small">PennyWise educates and models scenarios. It isn&apos;t financial, tax or investment advice, and it isn&apos;t a Chartered Accountant.</p>
      <div className="profile-actions">
        <button type="button" className="btn btn-quiet" onClick={signOut}>Sign out</button>
        <span className="home-foot">{resetControl}</span>
      </div>
    </section>
  );
}
