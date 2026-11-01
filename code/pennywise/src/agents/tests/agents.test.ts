import { beforeEach, describe, expect, it, vi } from "vitest";
import { fillPlaceholders, parseRuling, runGoalAgents, validateLine, writeProse } from "../index";
import { GOALS, PANCHAYAT, sheet } from "./helpers";

const h = vi.hoisted(() => ({ calls: [] as { role: string; system: string; input: string }[], reply: null as null | ((req: { role: string; input: string }) => unknown), gate: null as null | Promise<void> }));
vi.mock("@/lib/llm", () => ({
  llmJson: async (req: { role: string; system: string; input: string; schema: { parse: (x: unknown) => unknown }; fake: () => unknown }) => {
    h.calls.push(req);
    if (h.gate) await h.gate;
    if (h.reply) return { data: req.schema.parse(h.reply(req)), source: "gemini", model: "test" };
    return { data: req.schema.parse(req.fake()), source: "fake", model: "fake" };
  },
}));
beforeEach(() => { h.calls.length = 0; h.reply = null; h.gate = null; });

describe("validateLine (AI-4)", () => {
  const s = sheet();
  const ok = (l: string) => validateLine(l, s);
  it.each([
    "Tumne kaha tha {reason_quote}. {flat_delay_months} ka nuksan mat do.",
    "Ek baat suno, yeh plan band kar do.",
    "Rohit ke saath tera bara kharcha mat jodo.",
    "{goal_name} ko Emergency Fund se mat jodo.",
    "Woh EMI chali jaati hai har baar.",
    "Ek chai ka sip liya, phir socha.",
    "आपने कहा था {reason_quote}। इस plan को देखिए।",
  ])("accepts %s", (l) => expect(ok(l)).toEqual({ ok: true, reasons: [] }));

  it.each([
    ["Mujhe 4 mahine mat do", "digit"], ["Mujhe ४ mahine mat do", "digit"], ["₹ mat do", "money_symbol"],
    ["Paanch hazaar mat lo", "number_word"], ["Do mahine ka nuksan hai", "number_word"], ["Ek saal ruk jao", "number_word"], ["Saath hazaar kam hain", "number_word"],
    ["Half kharcha mat karo", "number_word"], ["पाँच महीने रुक जाओ", "number_word"], ["Seventy thousand bahut hai", "number_word"],
    ["Yeh {made_up} hai", "unknown_placeholder"], ["Yeh {constructor} hai", "unknown_placeholder"], ["Yeh {precedent_quote} hai", "unknown_placeholder"], ["Yeh {broken hai", "malformed"],
    ["INE002A01018 lo", "deny:isin"], ["INFY le lo", "deny:ticker"], ["Mirae se poochho", "deny:fund_house"], ["Yeh paisa SIP mein daalo", "deny:sip"], ["sip kar lo", "deny:sip"],
    ["S.I.P. shuru karo", "deny:sip"], ["ETF lo", "deny:etf"], ["FD mein daalo", "deny:fd"], ["liquid fund mein rakho", "deny:fund"], ["HDFC mutual lo", "deny:brand_security"],
    ["Reliance ke shares bech do", "deny"], ["म्यूचुअल फंड लो", "deny"],
    ["khap ka faisla hai", "banned"], ["hukka-paani band", "banned"], ["biradari kya kahegi", "banned"], ["jaati ka sawaal hai", "banned"], ["izzat ka sawaal hai", "banned"], ["Brahmin goal hai", "banned"], ["Sharma ji ka goal", "banned"], ["जाति मत देखो", "banned"],
    ["yeh line bahut lambi hai aur chalti jaati hai isme chauda se zyada shabd hain dekho toh sahi", "too_long"],
  ])("rejects %s (%s)", (l, reason) => {
    const r = ok(l);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(" ")).toContain(reason);
  });

  it("counts 13 words as under 14, and 14 as too long", () => {
    expect(ok(Array(13).fill("nahi").join(" ")).ok).toBe(true);
    expect(ok(Array(14).fill("nahi").join(" ")).reasons).toContain("too_long");
  });
});

describe("fillPlaceholders (AI-4)", () => {
  it("substitutes code-held values and quotes", () => {
    expect(fillPlaceholders({ stances: [], line: "Tumne kaha tha {reason_quote}. {flat_delay_months} mat do." }, sheet()))
      .toBe("Tumne kaha tha “Deposit ke liye, apna ghar chahiye”. 4 months mat do.");
  });
  it("is single-pass, so a value stays literal", () => {
    const s = sheet({ placeholders: { a: "{b} $&", b: "x" } });
    expect(fillPlaceholders({ stances: [], line: "{a}" }, s)).toBe("{b} $&");
  });
  it("leaves no unknown placeholder on screen", () => {
    expect(fillPlaceholders({ stances: [], line: "Yeh {nope} hai" }, sheet())).toBe("Yeh hai");
  });
});

describe("runGoalAgents (AI-3)", () => {
  const sheets = [
    sheet({ goalId: "g-flat", goalName: "Flat" }),
    sheet({ goalId: "g-goa", goalName: "Goa", reasonQuote: "College ke doston ke saath", placeholders: { goa_delay_months: "2 months" } }),
    sheet({ goalId: "g-emergency", goalName: "Emergency Fund", reasonQuote: "Job gayi toh chhe mahine chalna chahiye", placeholders: { cover_left: "2.1 months" } }),
  ];

  it("makes one call per sheet, in parallel, each seeing only its own sheet", async () => {
    let open = () => {};
    h.gate = new Promise((r) => { open = r; });
    const pending = runGoalAgents(sheets);
    await Promise.resolve();
    expect(h.calls).toHaveLength(3); // All started before any has answered.
    open();
    await pending;
    expect(h.calls[1].input).toContain("College ke doston");
    expect(h.calls[1].input).not.toContain("Deposit ke liye");
    expect(h.calls[1].input).not.toContain("Job gayi");
    expect(h.calls[0].input).not.toContain("goa_delay_months");
  });

  it("caps at 3 goals, returning voices that pass, with code's values filled in", async () => {
    const voices = await runGoalAgents([...sheets, sheet({ goalId: "g-x", goalName: "X" })]);
    expect(voices).toHaveLength(3);
    expect(h.calls).toHaveLength(3);
    expect(voices[0]).toMatchObject({ goalId: "g-flat", source: "fake" });
    expect(voices[0].line).toContain("“Deposit ke liye");
    expect(voices[0].line).toContain("4 months");
    expect(voices[0].stances).toEqual([{ planId: "A", stance: "oppose" }, { planId: "B", stance: "defend" }]);
    expect(new Set(voices.map((v) => v.line)).size).toBe(3);
  });

  it("retries once on a bad line, feeding back the reasons", async () => {
    let n = 0;
    h.reply = () => ({ stances: [{ planId: "A", stance: "oppose" }], line: n++ === 0 ? "Mujhe 4 mahine mat do" : "Yeh plan nahi chalega." });
    const [v] = await runGoalAgents([sheet()]);
    expect(h.calls).toHaveLength(2);
    expect(h.calls[1].input).toContain("digit");
    expect(v).toMatchObject({ line: "Yeh plan nahi chalega.", source: "gemini" });
  });

  it("uses a template after two bad lines", async () => {
    h.reply = () => ({ stances: [], line: "Liquid fund mein 5000 daalo" });
    const [v] = await runGoalAgents([sheet()]);
    expect(h.calls).toHaveLength(2);
    expect(v.source).toBe("template");
    expect(v.line).toContain("Deposit ke liye");
    expect(v.line).not.toMatch(/fund/i);
  });

  it("writes the template in Devanagari for a Devanagari speaker", async () => {
    h.reply = () => ({ stances: [], line: "5000 daalo" });
    const [v] = await runGoalAgents([sheet({ reasonQuote: "घर के लिए", placeholders: {} })]);
    expect(v).toMatchObject({ source: "template", line: "आपने कहा था “घर के लिए”। इस plan को ध्यान से देखिए।" });
  });

  it("repairs a bad stance without spending a retry", async () => {
    h.reply = () => ({ stances: [{ planId: "Z", stance: "defend" }, { planId: "B", stance: "concede" }], line: "Yeh plan nahi chalega." });
    const [v] = await runGoalAgents([sheet()]);
    expect(h.calls).toHaveLength(1);
    expect(v.stances).toEqual([{ planId: "A", stance: "oppose" }, { planId: "B", stance: "concede" }]);
  });

  it("a thrown model chain falls back for that goal only, with no retry", async () => {
    h.reply = (req) => { if (req.role.includes("g-goa")) throw new Error("429"); return { stances: [], line: "Yeh plan nahi chalega." }; };
    const voices = await runGoalAgents(sheets);
    expect(voices.map((v) => v.source)).toEqual(["gemini", "template", "gemini"]);
    expect(h.calls).toHaveLength(3);
  });
});

describe("parseRuling (AI-5)", () => {
  it("parses the demo ruling into move_goal plus add_condition", async () => {
    const r = await parseRuling("Goa moves to June, and if the bonus is under 50 thousand, July", PANCHAYAT, GOALS);
    expect(r.questions).toEqual([]);
    expect(r.ops).toEqual([
      { op: "move_goal", goalId: "g-goa", toMonth: "2027-06" },
      { op: "add_condition", condition: { field: "bonus", cmp: "lt", amount: 5000000, then: { goalId: "g-goa", toMonth: "2027-07" }, quote: "if the bonus is under 50 thousand, July" } },
    ]);
  });

  it("a second, different ruling produces different ops", async () => {
    const a = await parseRuling("Goa moves to June, and if the bonus is under 50 thousand, July", PANCHAYAT, GOALS);
    const b = await parseRuling("Plan B, Flat ko March 2030 kar do, iPhone bonus tak ruk jaaye", PANCHAYAT, GOALS);
    expect(b.ops).toEqual([
      { op: "choose_plan", planId: "B" },
      { op: "move_goal", goalId: "g-flat", toMonth: "2030-03" },
      { op: "hold_goal", goalId: "g-iphone", until: "bonus" },
    ]);
    expect(b.ops).not.toEqual(a.ops);
  });

  it("reads Devanagari, and inherits a unit", async () => {
    const hi = await parseRuling("गोवा को जून कर दो, और अगर बोनस ५० हज़ार से कम हो तो जुलाई", PANCHAYAT, GOALS);
    expect(hi.ops.map((o) => o.op)).toEqual(["move_goal", "add_condition"]);
    const inherit = await parseRuling("bonus 60 hazaar aayega, Goa ko June kar do, agar bonus 50 se kam ho toh July", PANCHAYAT, GOALS);
    const cond = inherit.ops.find((o) => o.op === "add_condition");
    expect(cond).toMatchObject({ condition: { amount: 5000000 } });
  });

  it.each([
    ["Goa ko June kar do, but if the bonus is under 50, July", "move_goal"],
    ["Goa ko aage kar do", null],
    ["Goa June ya July", null],
    ["June kar do", null],
    ["Plan Z theek hai", null],
    ["agar salary kam ho toh Goa July", null],
    ["dekh lo jo theek lage", null],
  ])("asks instead of guessing: %s", async (text, keeps) => {
    const r = await parseRuling(text, PANCHAYAT, GOALS);
    expect(r.questions.length).toBeGreaterThan(0);
    expect(r.ops.map((o) => o.op)).toEqual(keeps ? [keeps] : []);
  });

  it("code rejects model ops that don't trace back to the ruling", async () => {
    h.reply = () => ({
      ops: [
        { op: "move_goal", goalId: "g-made-up", toMonth: "2027-06" },
        { op: "move_goal", goalId: "g-flat", toMonth: "2027-06" }, // Flat was never said.
        { op: "choose_plan", planId: "Z" },
        { op: "add_condition", condition: { field: "bonus", cmp: "lt", amount: 9900000, then: { goalId: "g-goa", toMonth: "2027-07" }, quote: "if the bonus is under 50 thousand, July" } },
        { op: "move_goal", goalId: "g-goa", toMonth: "2031-06" }, // Code recomputes a year nobody said.
      ],
      questions: [],
    });
    const r = await parseRuling("Goa moves to June, and if the bonus is under 50 thousand, July", PANCHAYAT, GOALS);
    expect(r.ops).toEqual([{ op: "move_goal", goalId: "g-goa", toMonth: "2027-06" }]);
    expect(r.questions.length).toBeGreaterThan(0);
  });

  it("makes one model call", async () => {
    await parseRuling("Goa moves to June", PANCHAYAT, GOALS);
    expect(h.calls).toHaveLength(1);
  });
});

describe("writeProse (AI-7)", () => {
  it("fills facts in the fake", async () => {
    const r = await writeProse("review", { saved: "₹32,600" }, "fallback");
    expect(r.source).toBe("fake");
    expect(r.text).toContain("₹32,600");
  });
  it("retries once then uses the fallback on bad prose", async () => {
    h.reply = () => ({ text: "Isme 5000 SIP karo" });
    expect(await writeProse("buggy", { saved: "₹1" }, "Hisaab dekho")).toEqual({ text: "Hisaab dekho", source: "template" });
    expect(h.calls).toHaveLength(2);
  });
  it("handles fact labels that aren't placeholder names", async () => {
    h.reply = (req) => { expect(req.input).toContain("fact_1"); return { text: "Aaj ke hisaab se {fact_1} hai." }; };
    expect((await writeProse("buggy", { "Against ₹99,900 today": "41.5%" }, "x")).text).toBe("Aaj ke hisaab se 41.5% hai.");
  });
  it("uses a safe line if even the fallback is unsafe", async () => {
    h.reply = () => { throw new Error("429"); };
    const r = await writeProse("review", {}, "Reliance ke shares lo");
    expect(r.source).toBe("template");
    expect(r.text).not.toMatch(/reliance/i);
  });
});
