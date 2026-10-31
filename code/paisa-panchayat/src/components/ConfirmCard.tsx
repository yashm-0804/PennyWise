"use client";

import { useState } from "react";
import type { TCheckedItem, TDictateResponse } from "@/contract/schemas";
import { canConfirm, editAmount, ITEM_LABEL, whoField } from "./flow";
import { humanize, inrDigits, parseRupees } from "./format";
import { Avatar, categoryEmoji, rowEmoji } from "./pictures";
import { Badge, Empty, SourceBadge, Working } from "./ui";

const STATUS = {
  ok: { tone: "ok", label: "✅ Looks right" },
  ask: { tone: "ask", label: "👀 Check this" },
  block: { tone: "block", label: "✋ Fix this" },
} as const;

function itemEmoji(item: TCheckedItem): string {
  if (item.type === "correction") return categoryEmoji(item.category);
  if (item.type === "emi") return "📅";
  if (item.type.startsWith("goal")) return "🎯";
  if (item.type === "earmark") return "🐷";
  if (item.type === "unknown") return "🤷";
  if (item.type === "investment_ask") return "🙅";
  return rowEmoji({ kind: item.type, label: item.payee ?? item.source_quote, category: item.category });
}

/** What a row without a person or payee is about, such as "Rent" for a correction. */
function detail(item: TCheckedItem): string | null {
  if (item.type === "correction") {
    return [item.pattern, item.category ? humanize(item.category) : null].filter(Boolean).join(" → ") || null;
  }
  if (item.type === "profile_update" && item.field) return humanize(item.field);
  return item.category && item.category !== "emi" ? humanize(item.category) : null;
}

function AmountField({ item, onChange }: { item: TCheckedItem; onChange: (paise: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (item.amount === null) return <span className="confirm-noamount muted">No amount</span>;
  const shown = draft ?? inrDigits(item.amount);
  const invalid = draft !== null && parseRupees(draft) === null;
  return (
    <label className={`confirm-amount ${invalid ? "is-invalid" : ""}`}>
      <span aria-hidden="true">₹</span>
      <input
        aria-label={`Amount for ${item.source_quote}`}
        inputMode="decimal"
        value={shown}
        size={Math.max(shown.length, 3)}
        onFocus={(e) => { setDraft(shown); e.target.select(); }}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const p = parseRupees(e.target.value);
          if (p !== null) onChange(p);
        }}
      />
    </label>
  );
}

export function ConfirmCard({ reply, saving, onConfirm, onDiscard }: {
  reply: TDictateResponse;
  saving: boolean;
  onConfirm: (items: TCheckedItem[]) => void;
  onDiscard: () => void;
}) {
  const [items, setItems] = useState(reply.items);

  if (saving) {
    return (
      <Working
        title="Saving to the khata"
        quote={reply.raw_text}
        detail="If this is a heavy expense, your goals are being called in."
      />
    );
  }

  const update = (i: number, next: TCheckedItem) => setItems((all) => all.map((it, j) => (j === i ? next : it)));
  const blocked = items.some((i) => i.status === "block");

  return (
    <section className="confirm" aria-label="Confirm entries">
      <header className="confirm-head">
        <div>
          <h2 className="screen-title">Got it right?</h2>
          <p className="muted confirm-sent">You said: {reply.raw_text}</p>
        </div>
        <SourceBadge source={reply.llm_source} />
      </header>

      {items.length === 0 ? (
        <Empty title="Nothing left to save">Say it again, or discard this card.</Empty>
      ) : (
        <ol className="confirm-rows">
          {items.map((item, i) => {
            const field = whoField(item);
            const status = STATUS[item.status];
            const about = detail(item);
            return (
              <li key={`${item.source_quote}-${i}`} className={`confirm-row is-${item.status}`}>
                <Avatar emoji={itemEmoji(item)} size={56} />
                <div className="confirm-source">
                  <p className="confirm-quote">“{item.source_quote}”</p>
                  <p className="confirm-meta">
                    <b>{ITEM_LABEL[item.type]}</b>
                    {field ? (
                      <input
                        className="confirm-who"
                        aria-label={`Name for ${item.source_quote}`}
                        placeholder="Add a name"
                        value={item[field] ?? ""}
                        onChange={(e) => update(i, { ...item, [field]: e.target.value || null })}
                      />
                    ) : null}
                    {about ? <span className="muted">{about}</span> : null}
                  </p>
                  {item.read_as ? <p className="confirm-readas">Read as {item.read_as}</p> : null}
                  {item.messages.map((m) => <p key={m} className={`confirm-msg msg-${item.status}`}>{m}</p>)}
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
                <AmountField item={item} onChange={(p) => update(i, editAmount(item, p))} />
                <button
                  type="button"
                  className="btn-link confirm-remove"
                  aria-label={`Remove ${item.source_quote}`}
                  onClick={() => setItems((all) => all.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <footer className="confirm-foot">
        <span className="muted small">{blocked ? "Fix or remove the marked rows to continue." : "Nothing is saved until you confirm."}</span>
        <span className="row-gap">
          <button type="button" className="btn btn-quiet" onClick={onDiscard}>Discard</button>
          <button type="button" className="btn btn-primary" disabled={!canConfirm(items)} onClick={() => onConfirm(items)}>
            Confirm {items.length > 0 ? `${items.length} ${items.length === 1 ? "entry" : "entries"}` : ""}
          </button>
        </span>
      </footer>
    </section>
  );
}
