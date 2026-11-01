import type { TRawTxn } from "@/contract/schemas";
import { buildStatementTxn, FURNITURE } from "./rows";
import { parseDateIso } from "./util";

/**
 * One synthetic layout only (seed/samples/statement.pdf): a table with Date, Narration, Reference, Debit, Credit and
 * Balance headers, right-aligned amounts, and narrations that wrap below the row's first line. Columns come from the
 * header's x-positions, so nothing printed inside a narration can land in the amount or date cells.
 */
interface Item { x: number; y: number; right: number; h: number; str: string }
interface Line { y: number; h: number; items: Item[] }
interface Columns { date: Item; narration: Item; reference: Item | null; debit: Item; credit: Item; balance: Item | null }

const Y_TOLERANCE = 2;
const AMOUNT_EDGE_TOLERANCE = 6;

function groupLines(items: Item[]): Line[] {
  const lines: Line[] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.at(-1);
    if (line && Math.abs(line.y - item.y) <= Y_TOLERANCE) {
      line.items.push(item);
      line.h = Math.max(line.h, item.h);
    } else lines.push({ y: item.y, h: item.h, items: [item] });
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines;
}

/** Joins runs on one line. Chrome splits runs at ligatures ("fi"), so only a real gap counts as a space. */
function joinItems(items: Item[]): string {
  let out = "";
  let prev: Item | null = null;
  for (const item of items) {
    if (prev && item.x - prev.right > 1) out += " ";
    out += item.str;
    prev = item;
  }
  return out.trim();
}

function findColumns(line: Line): Columns | null {
  const find = (word: string) => line.items.find((i) => i.str.trim().toLowerCase() === word) ?? null;
  const [date, narration, debit, credit] = [find("date"), find("narration"), find("debit"), find("credit")];
  if (!date || !narration || !debit || !credit) return null;
  return { date, narration, reference: find("reference"), debit, credit, balance: find("balance") };
}

/** A wrap can fall inside `UPI/<ref>/<vpa>/`, which has no spaces, so joining there mustn't add one. */
export function joinWrapped(prev: string, next: string): string {
  if (/[/@.-]$/.test(prev) || /^[/@.]/.test(next)) return prev + next;
  if (/^UPI\//i.test(prev) && !/\s/.test(prev) && prev.split("/").length < 4) return prev + next;
  return `${prev} ${next}`;
}

interface OpenRow { date: string; narration: string; reference: string; debit: string; credit: string; lastY: number | null }

function cellsOf(line: Line, cols: Columns) {
  const refX = cols.reference?.x ?? cols.debit.x;
  const near = (i: Item, head: Item | null) => head != null && Math.abs(i.right - head.right) <= AMOUNT_EDGE_TOLERANCE;
  const parts = { date: [] as Item[], narration: [] as Item[], reference: [] as Item[], debit: [] as Item[], credit: [] as Item[], balance: [] as Item[] };
  for (const i of line.items) {
    if (near(i, cols.debit)) parts.debit.push(i);
    else if (near(i, cols.credit)) parts.credit.push(i);
    else if (near(i, cols.balance)) parts.balance.push(i);
    else if (i.x < cols.narration.x - 2) parts.date.push(i);
    else if (i.x < refX - 2) parts.narration.push(i);
    else parts.reference.push(i);
  }
  return {
    date: joinItems(parts.date), narration: joinItems(parts.narration), reference: joinItems(parts.reference),
    debit: joinItems(parts.debit), credit: joinItems(parts.credit), balance: joinItems(parts.balance),
  };
}

/** Pure layout parsing, split from pdfjs so it is simple to test. */
export function parseLines(pages: Line[][]): { txns: TRawTxn[]; unparsed: string[] } {
  const txns: TRawTxn[] = [];
  const unparsed: string[] = [];
  let open: OpenRow | null = null;
  const close = () => {
    if (!open) return;
    const row: OpenRow = open;
    open = null;
    const txn = buildStatementTxn(row, "pdf");
    if (txn) txns.push(txn);
    else if (!FURNITURE.test(row.narration)) unparsed.push(`${row.date} ${row.narration} ${row.debit} ${row.credit}`.replace(/\s+/g, " ").trim());
  };
  let foundTable = false;
  for (const lines of pages) {
    let cols: Columns | null = null;
    for (const line of lines) {
      const header = findColumns(line);
      if (header) {
        cols = header;
        foundTable = true;
        if (open) (open as OpenRow).lastY = null; // a row may continue under the repeated header
        continue;
      }
      if (!cols) continue; // page furniture above the table
      const text = joinItems(line.items);
      const c = cellsOf(line, cols);
      if (parseDateIso(c.date)) {
        close();
        open = { date: c.date, narration: c.narration, reference: c.reference, debit: c.debit, credit: c.credit, lastY: line.y };
        continue;
      }
      const narrationOnly = c.narration && !c.date && !c.reference && !c.debit && !c.credit && !c.balance;
      const current = open as OpenRow | null;
      const adjacent = current != null && (current.lastY === null || current.lastY - line.y <= line.h * 1.6);
      if (narrationOnly && adjacent && !FURNITURE.test(text)) {
        current!.narration = joinWrapped(current!.narration, c.narration);
        current!.lastY = line.y;
        continue;
      }
      close();
      if (!FURNITURE.test(text)) unparsed.push(text);
    }
    if (cols === null) close();
  }
  close();
  if (!foundTable) unparsed.push("No statement table was found. Only the one synthetic PDF layout is supported.");
  return { txns, unparsed };
}

export async function parsePdf(bytes: Uint8Array, password?: string): Promise<{ txns: TRawTxn[]; unparsed: string[] }> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // A copy: pdfjs detaches the buffer it is given and rejects Node Buffers.
  const task = getDocument({ data: Uint8Array.from(bytes), password, verbosity: 0 });
  try {
    const doc = await task.promise;
    const pages: Line[][] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      const items: Item[] = [];
      for (const raw of content.items) {
        if (!("str" in raw) || !raw.str.trim()) continue;
        const [x, y] = [raw.transform[4] as number, raw.transform[5] as number];
        items.push({ x, y, right: x + raw.width, h: raw.height || Math.abs(raw.transform[3] as number), str: raw.str });
      }
      pages.push(groupLines(items));
    }
    return parseLines(pages);
  } catch (err) {
    if ((err as { name?: string }).name === "PasswordException") {
      return { txns: [], unparsed: [password ? "The PDF password is incorrect." : "This PDF is password-protected. A password is needed."] };
    }
    return { txns: [], unparsed: ["This file could not be read as a PDF."] };
  } finally {
    await task.destroy();
  }
}
