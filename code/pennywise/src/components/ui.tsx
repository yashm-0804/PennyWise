"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { month, monthFromIndex, monthIndex } from "./format";

type LlmSource = "gemini" | "cache" | "fake" | "template";

export function Badge({ tone = "plain", children }: { tone?: "plain" | "solid" | "onink" | "ok" | "ask" | "block" | "sim"; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** Marks prose that didn't come live from the model. A live Gemini reply carries no badge. */
export function SourceBadge({ source }: { source: LlmSource }) {
  if (source === "template") return <Badge>Template line</Badge>;
  if (source === "cache") return <Badge>Cached reply</Badge>;
  if (source === "fake") return <Badge>Test reply</Badge>;
  return null;
}

export function SimulatedBadge() {
  return <Badge tone="sim">Simulated month</Badge>;
}

const MAX_TICKS = 12;

/**
 * A month that visibly walks to its new value, one month at a time, on a solid accent block.
 * Stepping and the colour change both survive video compression, where a fade would not.
 * Pass `from` to animate on first mount.
 */
export function AnimatedMonth({ value, from, className = "" }: { value: string; from?: string; className?: string }) {
  const [shown, setShown] = useState(from ?? value);
  const [phase, setPhase] = useState<"still" | "moving" | "landed">("still");
  const current = useRef(from ?? value);

  useEffect(() => {
    if (current.current === value) return;
    const start = monthIndex(current.current);
    const end = monthIndex(value);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ticks = reduced ? 1 : Math.min(Math.abs(end - start), MAX_TICKS);
    const stepMs = Math.max(240, Math.min(520, 2400 / ticks));
    let tick = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    // A short hold first, so the viewer's eye lands on the old date before it moves.
    const timer = setInterval(() => {
      tick += 1;
      setPhase("moving");
      setShown(monthFromIndex(Math.round(start + ((end - start) * tick) / ticks)));
      if (tick >= ticks) {
        clearInterval(timer);
        current.current = value;
        setPhase("landed");
        settle = setTimeout(() => setPhase("still"), 2200);
      }
    }, stepMs);
    return () => {
      clearInterval(timer);
      clearTimeout(settle);
    };
  }, [value]);

  return (
    <span className={`amonth amonth-${phase} ${className}`} data-testid="animated-month">
      <span key={shown} className={phase === "still" ? "" : "amonth-tick"}>{month(shown)}</span>
    </span>
  );
}

/** Elapsed seconds since mount. Agent calls can run past 10 seconds, so the wait is shown plainly. */
function useElapsed(): number {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return s;
}

export function Elapsed() {
  const s = useElapsed();
  return <span className="elapsed">{s}s</span>;
}

export function Working({ title, quote, detail }: { title: string; quote?: string; detail?: string }) {
  return (
    <div className="working view" role="status" aria-live="polite">
      <span className="typing typing-big" aria-hidden="true"><i /><i /><i /></span>
      <h2>{title} <Elapsed /></h2>
      {quote ? <p className="bubble-quote">“{quote}”</p> : null}
      {detail ? <p className="muted">{detail}</p> : null}
    </div>
  );
}

export function ErrorBand({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div className="error-band" role="alert">
      <span><b>That didn’t go through.</b> {message} Nothing was saved.</span>
      <span className="row-gap">
        {onRetry ? <button type="button" className="btn btn-quiet" onClick={onRetry}>Try again</button> : null}
        {onDismiss ? <button type="button" className="text-link" onClick={onDismiss}>Dismiss</button> : null}
      </span>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children ? <div className="muted">{children}</div> : null}
    </div>
  );
}

export function SectionHead({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="section-head">
      <h2 className="display section-title">{title}</h2>
      {aside ? <div className="row-gap">{aside}</div> : null}
    </div>
  );
}
