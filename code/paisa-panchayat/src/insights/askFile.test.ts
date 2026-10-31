import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { applyItem, getState } from "@/ledger";
import type { TCheckedItem } from "@/contract/schemas";
import { seedDemo } from "../../seed";
import { answerWithoutModel, buildFile, inventedNumbers } from "./askFile";
import { answerMunshi } from "./munshi";

let db: DatabaseSync;
const item = (type: TCheckedItem["type"], rupees: number, extra: Partial<TCheckedItem>): TCheckedItem => ({
  type, source_quote: "", amount_rupees: rupees, amount_text: null, read_as: null, person: null, payee: null, category: null, account: "bank",
  goal: null, month: null, reason: null, field: null, pattern: null, question_intent: null, amount: rupees * 100, status: "ok", messages: [], ...extra,
});

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  seedDemo(db);
  applyItem(db, item("lend", 2000, { person: "Rohit" }), "dictation");
  applyItem(db, item("borrow", 5000, { person: "Amit" }), "dictation");
});

const ask = async (text: string) => (await answerMunshi(db, text)).answer;

describe("Munshi answers about the whole file", () => {
  it.each([
    ["Whom have I lent money to?", "Rohit"],
    ["Maine kisko udhar diya hai?", "₹2,000"],
    ["Who do I have to pay back, whom did I borrow from?", "Amit"],
    ["Mera EMI kitna jaata hai?", "₹8,400"],
    ["Where did I spend the most this month?", "rent"],
    ["Is mahine sabse zyada kahan kharch hua?", "rent"],
    ["How much cash do I have?", "cash"],
  ])("%s", async (q, expected) => {
    expect((await ask(q)).toLowerCase()).toContain(expected.toLowerCase());
  });

  it("says so when the file has no answer, rather than guessing", async () => {
    expect(await ask("What is my blood group?")).toContain("nahi mila");
  });

  it("still refuses to name a security", async () => {
    expect((await answerMunshi(db, "kaunsa mutual fund lun")).intent).toBe("refused");
  });
});

describe("inventedNumbers", () => {
  it("rejects a figure the code never produced, and allows ones it did", () => {
    const state = getState(db);
    const file = buildFile(db, state);
    expect(inventedNumbers("Rohit owes you ₹2,000.", file)).toEqual([]);
    expect(inventedNumbers("Rohit owes you ₹2,750.", file)).toEqual(["2750"]);
    expect(inventedNumbers("You have 2 people on your list.", file)).toEqual([]);
  });

  it("the no-model answer only uses the file's figures", () => {
    const state = getState(db);
    const file = buildFile(db, state);
    for (const q of ["kisko udhar diya", "emi", "sabse zyada kahan", "cash", "goal"]) {
      expect(inventedNumbers(answerWithoutModel(q, state, file).answer, file)).toEqual([]);
    }
  });
});
