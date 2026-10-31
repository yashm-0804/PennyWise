"use client";

import { useState } from "react";
import { signIn } from "./account";

export function SignIn() {
  const [name, setName] = useState("");
  const ready = name.trim().length > 0;
  return (
    <main className="signin">
      <div className="signin-top glass">
        <span className="coin coin-big" aria-hidden="true">₹</span>
        <h1>Welcome to PennyWise</h1>
        <p className="signin-sub">Talk through your money. Your goals work it out, and you make the call.</p>
      </div>
      <form className="signin-form" onSubmit={(e) => { e.preventDefault(); if (ready) signIn(name); }}>
        <label htmlFor="signin-name" className="caption">What should we call you?</label>
        <input
          id="signin-name"
          autoFocus
          autoComplete="given-name"
          value={name}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn-accent btn-big btn-wide" disabled={!ready}>Continue</button>
      </form>
      <p className="signin-note">Prototype sign-in: there&apos;s no password or account yet. Your name stays on this device, and the data here is synthetic.</p>
    </main>
  );
}
