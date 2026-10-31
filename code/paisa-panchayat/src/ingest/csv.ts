import type { TRawTxn } from "@/contract/schemas";
import { buildStatementTxn, FURNITURE } from "./rows";

/** RFC 4180 records, tolerating stray quotes mid-field. A quote that never closes is treated as a literal character. */
export function splitCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, "");
  const records: string[][] = [];
  let pos = 0;
  while (pos < s.length) {
    const { fields, next } = readRecord(s, pos);
    records.push(fields);
    pos = next;
  }
  return records;
}

function readRecord(s: string, start: number): { fields: string[]; next: number } {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = start;
  for (; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"' && field.trim() === "") { field = ""; inQuotes = true; }
    else if (c === ",") { fields.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      fields.push(field);
      return { fields, next: c === "\r" && s[i + 1] === "\n" ? i + 2 : i + 1 };
    } else field += c;
  }
  if (inQuotes) {
    // Unterminated quote: without this, one bad cell would swallow every row after it.
    const end = s.slice(start).search(/\r|\n/);
    const line = end < 0 ? s.slice(start) : s.slice(start, start + end);
    const after = end < 0 ? s.length : start + end + (s.slice(start + end, start + end + 2) === "\r\n" ? 2 : 1);
    return { fields: line.split(",").map((f) => f.replace(/"/g, "")), next: after };
  }
  fields.push(field);
  return { fields, next: i };
}

const COLUMNS = {
  date: ["date", "txndate", "transactiondate"],
  narration: ["narration", "description", "particulars"],
  debit: ["debit", "withdrawal", "withdrawalamt"],
  credit: ["credit", "deposit", "depositamt"],
  reference: ["reference", "refno", "chqrefno"],
} as const;
type Column = keyof typeof COLUMNS;
const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

function findColumns(row: string[]): Record<Column, number> | null {
  const heads = row.map(norm);
  const at = (c: Column) => heads.findIndex((h) => (COLUMNS[c] as readonly string[]).includes(h));
  const cols = { date: at("date"), narration: at("narration"), debit: at("debit"), credit: at("credit"), reference: at("reference") };
  return cols.date >= 0 && cols.narration >= 0 && cols.debit >= 0 && cols.credit >= 0 ? cols : null;
}

/**
 * A row with too many cells usually has an unquoted comma. Amount fragments ("1" + "250.00") are rejoined first,
 * from the right; whatever is still over must have come from the narration. A wrong guess fails amount parsing later.
 */
function repairRow(fields: string[], width: number, narrationAt: number): string[] {
  const f = [...fields];
  for (let i = f.length - 2; i > narrationAt && f.length > width; i--) {
    if (/^\d{1,3}$/.test(f[i].trim()) && /^\d{2,3}(?:,\d{2,3})*(?:\.\d{1,2})?$/.test(f[i + 1].trim())) {
      f.splice(i, 2, `${f[i].trim()},${f[i + 1].trim()}`);
    }
  }
  while (f.length > width && narrationAt + 1 < f.length) {
    f.splice(narrationAt, 2, `${f[narrationAt]},${f[narrationAt + 1]}`);
  }
  return f;
}

export function parseCsv(text: string): { txns: TRawTxn[]; unparsed: string[] } {
  const rows = splitCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  const headerAt = rows.findIndex((r) => findColumns(r));
  if (headerAt < 0) {
    return { txns: [], unparsed: rows.length ? ["No header row with date, narration, debit and credit columns was found."] : [] };
  }
  const cols = findColumns(rows[headerAt])!;
  const width = rows[headerAt].length;
  const txns: TRawTxn[] = [];
  const unparsed: string[] = [];
  for (const raw of rows.slice(headerAt + 1)) {
    const r = raw.length > width ? repairRow(raw, width, cols.narration) : raw;
    const cell = (i: number) => (i >= 0 ? r[i] ?? "" : "").trim();
    const txn = buildStatementTxn(
      { date: cell(cols.date), narration: cell(cols.narration), debit: cell(cols.debit), credit: cell(cols.credit), reference: cell(cols.reference) },
      "csv",
    );
    if (txn) txns.push(txn);
    else if (!FURNITURE.test(raw.join(" "))) unparsed.push(raw.join(",").trim());
  }
  return { txns, unparsed };
}
