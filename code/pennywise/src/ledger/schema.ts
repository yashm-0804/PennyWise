import type { DatabaseSync } from "node:sqlite";

export const DEFAULT_SIM_MONTH = "2026-10";

/** Children come before parents, so dropping in this order respects foreign keys. */
const TABLES = [
  "ruling_effects", "rule_changes", "postings", "earmarks", "conditions", "price_checks", "utterances", "notices", "rules", "recurring",
  "panchayats", "goals", "profile", "sim_clock", "events", "accounts",
];

/** All money columns are integer paise. A posting's sign: positive is a debit, negative a credit. */
const DDL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('bank','cash','card','person','emi','expense','income','opening')),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  source_quote TEXT,
  reversal_of TEXT REFERENCES events(id),
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  account TEXT,
  category TEXT,
  payee TEXT,
  reference TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_date ON events(date);
CREATE INDEX IF NOT EXISTS events_reversal ON events(reversal_of);
CREATE TABLE IF NOT EXISTS postings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL REFERENCES events(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  amount INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS postings_event ON postings(event_id);
CREATE INDEX IF NOT EXISTS postings_account ON postings(account_id);
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  min_amount INTEGER,
  max_amount INTEGER,
  reason_quote TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('commodity','date','budget','emergency')),
  target INTEGER NOT NULL,
  monthly_contribution INTEGER NOT NULL,
  target_month TEXT NOT NULL,
  floor_month TEXT,
  reduction_amount INTEGER NOT NULL DEFAULT 0,
  reduction_months INTEGER NOT NULL DEFAULT 0,
  reason_quote TEXT,
  variant TEXT,
  price_url TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS earmarks (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  amount INTEGER NOT NULL,
  label TEXT NOT NULL,
  event_id TEXT REFERENCES events(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profile (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS recurring (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('subscription','emi')),
  monthly INTEGER NOT NULL,
  total_instalments INTEGER,
  paid_before INTEGER NOT NULL DEFAULT 0,
  principal INTEGER,
  started TEXT,
  event_id TEXT REFERENCES events(id)
);
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  goal_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS panchayats (
  id TEXT PRIMARY KEY,
  trigger_json TEXT NOT NULL,
  plans_json TEXT NOT NULL,
  voices_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ruling_id TEXT,
  ruling_text TEXT,
  ops_json TEXT,
  ruled_at TEXT
);
CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  panchayat_id TEXT NOT NULL REFERENCES panchayats(id),
  condition_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','fired','not_met')),
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS ruling_effects (panchayat_id TEXT PRIMARY KEY, effects_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rule_changes (rule_id TEXT NOT NULL, event_id TEXT NOT NULL, old_category TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS price_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  price INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  label TEXT NOT NULL,
  checked_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS utterances (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  parsed_json TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sim_clock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  month TEXT NOT NULL
);
`;

export function initSchema(db: import("node:sqlite").DatabaseSync): void {
  db.exec(DDL);
  db.prepare("INSERT OR IGNORE INTO sim_clock (id, month) VALUES (1, ?)").run(DEFAULT_SIM_MONTH);
}

/** Drops every table and recreates them empty. */
export function resetDb(db: DatabaseSync): void {
  for (const table of TABLES) db.exec(`DROP TABLE IF EXISTS ${table}`);
  initSchema(db);
}
