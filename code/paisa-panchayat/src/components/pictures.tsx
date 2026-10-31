"use client";

import type { TAppState, TGoalView } from "@/contract/schemas";

type Row = TAppState["rows"][number];

/** Colour follows the goal, never its rank. The order passes the colour-vision validator. */
const GOAL_COLORS = ["#1971C2", "#E8590C", "#00A08A", "#7048E8", "#D6336C"];

export function goalColor(goals: { id: string }[], id: string): string {
  const i = goals.findIndex((g) => g.id === id);
  return GOAL_COLORS[(i < 0 ? 0 : i) % GOAL_COLORS.length];
}

export function goalEmoji(name: string, type?: TGoalView["type"]): string {
  const n = name.toLowerCase();
  if (type === "emergency" || n.includes("emergency")) return "🛟";
  if (/flat|ghar|home|house|deposit/.test(n)) return "🏠";
  if (/goa|trip|travel|vacation/.test(n)) return "🏖️";
  if (/phone/.test(n)) return "📱";
  if (/laptop|macbook/.test(n)) return "💻";
  if (/bike|scooter/.test(n)) return "🏍️";
  if (/car\b/.test(n)) return "🚗";
  if (/fees|college|course/.test(n)) return "🎓";
  return "🎯";
}

const CATEGORY: Record<string, string> = {
  rent: "🏠", groceries: "🛒", dining: "🍔", transport: "🚕", utilities: "💡", shopping: "🛍️", entertainment: "🎬",
  subscriptions: "📺", health: "💊", education: "📚", travel: "✈️", family: "👪", household_help: "🔧", emi: "📅", other: "💸",
};

export function categoryEmoji(category: string | null | undefined): string {
  return (category && CATEGORY[category]) || "💸";
}

const BRANDS: [RegExp, string][] = [
  [/swiggy|zomato|toit|cafe|restaurant/, "🍔"], [/blinkit|dmart|bigbasket|zepto/, "🛒"], [/uber|ola|rapido/, "🚕"],
  [/netflix|hotstar|prime|spotify/, "📺"], [/gym|cult/, "🏋️"], [/laptop/, "💻"], [/phone/, "📱"], [/plumber/, "🔧"],
  [/landlord/, "🏠"], [/amazon|flipkart|myntra/, "📦"], [/bike/, "🏍️"], [/pharmacy|apollo/, "💊"],
];

export function rowEmoji(row: Pick<Row, "kind" | "label" | "category">): string {
  if (row.kind === "withdrawal") return "🏧";
  if (row.kind === "lend") return "🤝";
  if (row.kind === "borrow") return "🙏";
  if (row.kind === "repay_in" || row.kind === "repay_out") return "💚";
  if (row.kind === "income") return "💼";
  if (row.kind === "card_bill") return "💳";
  const label = row.label.toLowerCase();
  return BRANDS.find(([re]) => re.test(label))?.[1] ?? categoryEmoji(row.category);
}

export function Avatar({ emoji, size = 52, tint }: { emoji: string; size?: number; tint?: string }) {
  return (
    <span className="avatar" aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.52, background: tint ? `${tint}1f` : undefined }}>
      {emoji}
    </span>
  );
}

export function Initial({ name }: { name: string }) {
  return <span className="initial" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>;
}

/** A circular progress ring around a big icon. The label always says the number too, so colour is never the only signal. */
export function Ring({ percent, color, emoji, size = 120, stroke = 11, center, label }: {
  percent: number;
  color: string;
  emoji?: string;
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
  label: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(100, percent));
  return (
    <span className="progress-ring" role="img" aria-label={label} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-center" style={{ fontSize: size * 0.34 }}>{center ?? emoji}</span>
    </span>
  );
}
