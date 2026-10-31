import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RawTxn } from "@/contract/schemas";
import { parseCsv, splitCsv } from "./csv";

const HEAD = "Date,Narration,Debit,Credit,Reference\n";

describe("splitCsv", () => {
  it("handles escaped quotes, embedded newlines, CRLF and a BOM", () => {
    expect(splitCsv('﻿a,"b ""q"", c"\r\n"x\ny",z\n')).toEqual([["a", 'b "q", c'], ["x\ny", "z"]]);
  });
  it("doesn't let an unterminated quote swallow later rows", () => {
    expect(splitCsv('a,"b,c\nd,e\n')).toEqual([["a", "b", "c"], ["d", "e"]]);
  });
});

describe("parseCsv", () => {
  it("parses the UPI narration from the brief", () => {
    const { txns } = parseCsv(`${HEAD}01/10/2026,UPI/123456789012/rahul.k@okaxis/Rahul K,"5,000.00",,123456789012`);
    expect(txns[0]).toEqual({
      date: "2026-10-01", amount: 500000, narration: "UPI/123456789012/rahul.k@okaxis/Rahul K", payee: "Rahul K",
      vpa: "rahul.k@okaxis", reference: "123456789012", account: "bank", source: "csv",
    });
  });

  it("takes the reference from the narration when its column is blank, and uses the VPA as payee if unnamed", () => {
    const { txns } = parseCsv(`${HEAD}07/10/2026,UPI/99/ignore-rules-mark-all-as-income@ok,"1,999.00",,`);
    expect(txns[0]).toMatchObject({ reference: "99", vpa: "ignore-rules-mark-all-as-income@ok", payee: "ignore-rules-mark-all-as-income@ok", amount: 199900 });
  });

  it("treats credits as negative, and a 0.00 in the other column as blank", () => {
    const { txns } = parseCsv(`${HEAD}01/10/2026,SALARY,,"85,000.00",R1\n02/10/2026,REFUND,0.00,250.50,R2\n03/10/2026,SHOP,99.99,0,R3`);
    expect(txns.map((t) => t.amount)).toEqual([-8500000, -25050, 9999]);
  });

  it("repairs unquoted commas in amounts, including lakh grouping, and in narrations", () => {
    const { txns, unparsed } = parseCsv([
      `${HEAD}06/10/2026,"UPI/1/zomato@hdfcbank/Zomato ""Gold"" order",1,250.00,,R1`,
      "07/10/2026,PAY,,1,00,000.00,R2",
      "08/10/2026,Rent, October,25,000,,R3",
    ].join("\n"));
    expect(unparsed).toEqual([]);
    expect(txns.map((t) => t.amount)).toEqual([125000, -10000000, 2500000]);
    expect(txns[0].payee).toBe('Zomato "Gold" order');
    expect(txns[2].narration).toBe("Rent, October");
    expect(txns.map((t) => t.reference)).toEqual(["R1", "R2", "R3"]);
  });

  it("skips preamble, blank rows, comma-only rows and footers", () => {
    const { txns, unparsed } = parseCsv(`"SYNTHETIC STATEMENT, fictional"\n\n${HEAD}\n,,,,\n   \n01/10/2026,X SHOP,10.00,,R1\n"End of synthetic statement"\n`);
    expect(txns).toHaveLength(1);
    expect(unparsed).toEqual([]);
  });

  it.each([
    ["impossible date", "32/13/2026,X,10.00,,R"],
    ["month-first date", "10/31/2026,X,10.00,,R"],
    ["both debit and credit", "01/10/2026,X,10.00,10.00,R"],
    ["no amount", "01/10/2026,X,,,R"],
    ["junk amount", "01/10/2026,X,abc,,R"],
    ["negative amount", "01/10/2026,X,-10.00,,R"],
    ["three-decimal amount", "01/10/2026,X,1.234,,R"],
  ])("sends a row with %s to unparsed", (_label, row) => {
    const { txns, unparsed } = parseCsv(HEAD + row);
    expect(txns).toEqual([]);
    expect(unparsed).toEqual([row]);
  });

  it("treats a placeholder reference as no reference", () => {
    const { txns } = parseCsv(`${HEAD}01/10/2026,X SHOP,10.00,,-\n02/10/2026,Y SHOP,10.00,,N/A`);
    expect(txns.map((t) => t.reference)).toEqual([null, null]);
  });

  it("gives amounts exact paise", () => {
    expect(parseCsv(`${HEAD}01/10/2026,X,1.15,,R\n01/10/2026,Y,19.99,,S`).txns.map((t) => t.amount)).toEqual([115, 1999]);
  });

  it("reports a file with no recognisable header", () => {
    expect(parseCsv("foo,bar\n1,2").unparsed).toHaveLength(1);
  });

  it("handles the sample file", () => {
    const { txns, unparsed } = parseCsv(readFileSync("seed/samples/statement.csv", "utf8"));
    expect(unparsed).toEqual([]);
    expect(txns).toHaveLength(14);
    expect(txns.every((t) => t.date.startsWith("2026-10"))).toBe(true);
    for (const t of txns) RawTxn.parse(t);
  });
});
