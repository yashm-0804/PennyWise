import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RawTxn } from "@/contract/schemas";
import { parseSms } from "./sms";

// All messages are synthetic approximations. Passing here says nothing about real bank templates.
describe("parseSms", () => {
  it("reads a UPI debit: amount, date, payee, VPA, reference", () => {
    const { txns, unparsed } = parseSms("Sent Rs.5,000.00 From Kalpit Bank A/C *1234 To rahul.k@okaxis On 05/10/26 Ref 628100000106. Not You? Call 1800");
    expect(unparsed).toEqual([]);
    expect(txns[0]).toMatchObject({
      amount: 500000, date: "2026-10-05", payee: "rahul.k@okaxis", vpa: "rahul.k@okaxis",
      reference: "628100000106", account: "bank", source: "sms",
    });
    expect(RawTxn.parse(txns[0]).vpa).toBe("rahul.k@okaxis");
  });

  it("keeps the name and VPA apart when both are given", () => {
    const { txns } = parseSms("Sent Rs.250 From Kalpit Bank A/C *1234 To Rahul K (rahul.k@okaxis) On 12/10/26 Ref 111222333");
    expect(txns[0]).toMatchObject({ amount: 25000, payee: "Rahul K", vpa: "rahul.k@okaxis" });
  });

  it("reads the other two UPI layouts", () => {
    const { txns } = parseSms([
      "Acct XX123 debited with INR 250.00 on 12-Oct-26; Some Merchant credited. UPI:123456789012",
      "Dear UPI user A/C X1234 debited by 250.0 on date 12Oct26 trf to Some Shop Refno 123456789013",
    ].join("\n"));
    expect(txns.map((t) => [t.amount, t.date, t.payee, t.reference])).toEqual([
      [25000, "2026-10-12", "Some Merchant", "123456789012"],
      [25000, "2026-10-12", "Some Shop", "123456789013"],
    ]);
  });

  it("reads card spends as the card account, with no reference, despite a 'never share OTP' line", () => {
    const { txns, unparsed } = parseSms([
      "Spent Rs.1,499.00 on Kalpit Bank Credit Card XX4321 at AMAZON on 16-10-2026. Not you? Call 1800. Never share OTP or CVV.",
      "INR 649.00 spent on Kalpit Bank Card XX4321 on 20-Oct-26 at SPOTIFY. Avl Lmt: INR 88,000.00",
    ].join("\n"));
    expect(unparsed).toEqual([]);
    expect(txns.map((t) => [t.amount, t.date, t.payee, t.account, t.reference])).toEqual([
      [149900, "2026-10-16", "AMAZON", "card", null],
      [64900, "2026-10-20", "SPOTIFY", "card", null],
    ]);
  });

  it("joins a message that breaks across lines, and strips a sender prefix", () => {
    const { txns } = parseSms("VM-KALPIT: Sent Rs.250.00\nFrom Kalpit Bank A/C *1234\nTo ZOMATO\nOn 12/10/26\nRef 123456789012\nNot You? Call 1800");
    expect(txns).toHaveLength(1);
    expect(txns[0]).toMatchObject({ amount: 25000, payee: "ZOMATO", reference: "123456789012" });
  });

  it.each([
    ["OTP with an amount and merchant", "483921 is your OTP for a transaction of Rs.12,000.00 at CROMA on Card XX4321. Do not share it."],
    ["OTP phrased like a spend", "Spent Rs.500.00 on Kalpit Bank Card XX4321 at AMAZON on 16-10-2026. OTP is 123456"],
    ["promotion", "Festive offer! Get flat Rs.2,000 cashback on Kalpit Bank Credit Card. Spend Rs.20,000 by 31-Oct-26."],
    ["loan promotion", "You are pre-approved for a personal loan of Rs.5,00,000. Apply now."],
    ["pre-debit notice", "Rs.399.00 will be debited on 28/10/26 for HOTSTAR via e-mandate on Card XX4321."],
    ["declined spend", "Spent Rs.2,300.00 on Kalpit Bank Card XX4321 at MYNTRA on 16-10-2026 was declined."],
    ["credit, which is unsupported", "Acct XX123 credited with INR 250.00 on 12-Oct-26; from Rahul. UPI:123456789012"],
    ["impossible date", "Sent Rs.250 From Kalpit Bank A/C *1234 To ZOMATO On 31/02/26 Ref 123456"],
  ])("sends a %s to unparsed", (_label, msg) => {
    const { txns, unparsed } = parseSms(msg);
    expect(txns).toEqual([]);
    expect(unparsed).toEqual([msg]);
  });

  it("handles the sample file", () => {
    const { txns, unparsed } = parseSms(readFileSync("seed/samples/sms.txt", "utf8"));
    expect(txns).toHaveLength(5);
    expect(unparsed).toHaveLength(5);
    expect(unparsed.join(" ")).not.toContain("SYNTHETIC");
    expect(txns.every((t) => t.date.startsWith("2026-10"))).toBe(true);
    for (const t of txns) RawTxn.parse(t);
  });
});
