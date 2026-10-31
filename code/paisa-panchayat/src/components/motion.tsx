"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inr } from "./format";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A figure that rolls to its new value, so a change in the ledger is something you can see happen. */
export function useCountUp(value: number, { fromZero = false, ms = 700 } = {}): number {
  const [shown, setShown] = useState(fromZero ? 0 : value);
  const current = useRef(fromZero ? 0 : value);

  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = reduced() ? 1 : Math.min(1, (now - began) / ms);
      const next = Math.round(start + (value - start) * (1 - (1 - t) ** 3));
      current.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, ms]);

  return shown;
}

export function Money({ value, fromZero = false }: { value: number; fromZero?: boolean }) {
  const shown = useCountUp(value, { fromZero });
  return <span className="money">{inr(shown)}</span>;
}

/** True for a moment after each keystroke, which is how Wispr Flow's typing reaches the page. */
export function useTypingPulse(ms = 700): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ping = useCallback(() => {
    setActive(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [active, ping];
}

/** Bars that dance while words are arriving in the box. It reacts to text, not to a microphone. */
export function Wave({ active }: { active: boolean }) {
  return (
    <span className={`wave ${active ? "is-active" : ""}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}
