"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const HOLD_MS = 350;
const WIDTH = 280;

/** A figure that explains itself: hover on a laptop, press and hold (or tap) on a phone, focus with a keyboard. */
export function Why({ reason, children, className = "" }: { reason: string; children: ReactNode; className?: string }) {
  const [at, setAt] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const pinned = useRef(false);
  const self = useRef<HTMLSpanElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Lifting a finger after a hold also sends a click. It mustn't close what the hold just opened. */
  const held = useRef(false);
  const id = useId();

  const show = () => {
    const box = self.current?.getBoundingClientRect();
    if (!box) return;
    const width = Math.min(WIDTH, window.innerWidth - 16);
    const below = box.top < 150;
    setAt({
      left: Math.max(8, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - width - 8)),
      top: below ? box.bottom + 8 : box.top - 8,
      below,
    });
  };
  const hide = () => { pinned.current = false; setAt(null); };

  useEffect(() => {
    if (!at) return;
    const away = (e: Event) => { if (!self.current?.contains(e.target as Node)) hide(); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("scroll", hide, true);
    };
  }, [at]);

  useEffect(() => () => clearTimeout(hold.current), []);

  return (
    <span
      ref={self}
      className={`why ${className}`}
      tabIndex={0}
      role="button"
      aria-describedby={at ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={() => { if (!pinned.current) setAt(null); }}
      onFocus={show}
      onBlur={hide}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        held.current = false;
        hold.current = setTimeout(() => { held.current = true; pinned.current = true; show(); }, HOLD_MS);
      }}
      onPointerUp={() => clearTimeout(hold.current)}
      onPointerCancel={() => clearTimeout(hold.current)}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        if (held.current) { held.current = false; return; }
        if (at && pinned.current) hide();
        else { pinned.current = true; show(); }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); if (at) hide(); else show(); }
      }}
    >
      {children}
      {at ? (
        <span
          id={id}
          role="tooltip"
          className={`why-tip ${at.below ? "is-below" : ""}`}
          style={{ left: at.left, top: at.top, width: Math.min(WIDTH, window.innerWidth - 16) }}
        >
          {reason}
        </span>
      ) : null}
    </span>
  );
}
