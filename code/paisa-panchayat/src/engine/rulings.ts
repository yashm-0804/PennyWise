/** Rulings: previewing touches nothing; applying is the only thing that makes a panchayat real. */
import type { DatabaseSync } from "node:sqlite";
import type { TAppState, TGoalDiff, TNotice, TPanchayat, TPlan, TPlanAction, TRulingOp, TTrigger } from "@/contract/schemas";
import { Condition } from "@/contract/schemas";
import {
  addCondition, addEarmark, addNotice, defaultDate, findGoal, getRulingId, getState, listRulings, moveGoal, openEmi, pendingConditions,
  postInstalment, recordRuling, undoEvent, resolveCondition, setGoalReduction, setProfileValue, tx,
} from "@/ledger";
import { getProfileValue, postEvent } from "@/ledger/post";
import { formatInr, maxMonth, monthLabel, monthsBetween, projectMonth } from "./dates";
import { emergencyFloor, emiInstalment } from "./plans";

const MONTH = /^\d{4}-\d{2}$/;
const TRIGGER_CATEGORY = "shopping";

function chosenPlan(panchayat: TPanchayat, ops: TRulingOp[]): TPlan | null {
  const op = ops.find((o) => o.op === "choose_plan");
  if (!op || op.op !== "choose_plan") return null;
  return panchayat.plans.find((p) => p.id === op.planId) ?? null;
}

/** The dates a ruling would produce, computed from the state. Writes nothing. */
export function previewRuling(state: TAppState, panchayat: TPanchayat, ops: TRulingOp[]): TGoalDiff[] {
  const after = new Map<string, string>();
  for (const i of chosenPlan(panchayat, ops)?.impacts ?? []) after.set(i.goalId, i.afterMonth);
  for (const op of ops) {
    const g = "goalId" in op ? state.goals.find((x) => x.id === op.goalId) : undefined;
    if (!g) continue;
    const current = after.get(g.id) ?? g.projectedMonth;
    if (op.op === "move_goal") {
      // A ruling can't make a goal earlier than its money allows.
      const funded = projectMonth(state.simMonth, g.target, g.earmarked - givenBy(panchayat, ops, g.id), g.monthlyContribution);
      after.set(g.id, maxMonth(funded, op.toMonth));
    } else if (op.op === "hold_goal" && MONTH.test(op.until)) {
      const held = Math.max(0, monthsBetween(state.simMonth, op.until));
      after.set(g.id, maxMonth(current, projectMonth(state.simMonth, g.target, g.earmarked - givenBy(panchayat, ops, g.id) - held * g.monthlyContribution, g.monthlyContribution)));
    }
  }
  return state.goals.flatMap((g) => {
    const afterMonth = after.get(g.id);
    return afterMonth && afterMonth !== g.projectedMonth ? [{ goalId: g.id, goalName: g.name, beforeMonth: g.projectedMonth, afterMonth }] : [];
  });
}

function givenBy(panchayat: TPanchayat, ops: TRulingOp[], goalId: string): number {
  return chosenPlan(panchayat, ops)?.impacts.find((i) => i.goalId === goalId)?.amountGiven ?? 0;
}

function applyAction(db: DatabaseSync, state: TAppState, plan: TPlan, a: TPlanAction): void {
  const label = `Panchayat plan ${plan.id}`;
  if (a.kind === "delay_goal") {
    const given = plan.impacts.find((i) => i.goalId === a.goalId)?.amountGiven ?? 0;
    if (given > 0) addEarmark(db, a.goalId, -given, label);
  } else if (a.kind === "draw_emergency") {
    const fund = state.goals.find((g) => g.type === "emergency");
    if (fund) addEarmark(db, fund.id, -a.amount, label);
  } else if (a.kind === "reduce_contribution") {
    setGoalReduction(db, a.goalId, a.amount, a.months);
  }
  // use_surplus, reduce_budget, emi and defer_expense change how the expense is paid, or nothing stored: see postTrigger.
}

/** Posts the heavy expense the way the chosen plan pays for it. On an EMI the full price never counts. */
function postTrigger(db: DatabaseSync, panchayat: TPanchayat, plan: TPlan | null): void {
  const t = panchayat.trigger;
  const emi = plan?.actions.find((a) => a.kind === "emi");
  if (emi && emi.kind === "emi") {
    const monthly = emiInstalment(t.amount, emi.annualRatePercent, emi.months);
    const date = defaultDate(db);
    const planId = openEmi(db, { name: t.label, monthly, instalments: emi.months, principal: t.amount, date, sourceQuote: t.quote });
    postInstalment(db, { planId, label: t.label, amount: monthly, date, source: "dictation", sourceQuote: t.quote });
    setProfileValue(db, "fixed_costs", String(getState(db).profile.fixedCosts + monthly));
    return;
  }
  const defer = plan?.actions.find((a) => a.kind === "defer_expense");
  const date = defer && defer.kind === "defer_expense" ? `${defer.toMonth}-15` : defaultDate(db);
  postEvent(db, {
    kind: "expense", date, source: "dictation", sourceQuote: t.quote, label: t.label, amount: t.amount, account: "bank",
    category: TRIGGER_CATEGORY, payee: t.label, postings: [[`expense:${TRIGGER_CATEGORY}`, t.amount], ["bank", -t.amount]],
  });
}

type GoalColumns = { id: string; target_month: string; floor_month: string | null; reduction_amount: number; reduction_months: number };

function maxRowid(db: DatabaseSync, table: string): number {
  return (db.prepare(`SELECT COALESCE(MAX(rowid), 0) AS n FROM ${table}`).get() as { n: number }).n;
}

function idsAfter(db: DatabaseSync, table: string, rowid: number): string[] {
  return (db.prepare(`SELECT id FROM ${table} WHERE rowid > ?`).all(rowid) as { id: string }[]).map((r) => r.id);
}

/** Plans are computed when a panchayat convenes, so another ruling may have spent the same money since. */
function assertStillAffordable(state: TAppState, plan: TPlan | null): void {
  if (!plan) return;
  const stale = `Close this and say it again, so the plans are worked out from today's numbers.`;
  for (const a of plan.actions) {
    if (a.kind !== "draw_emergency") continue;
    const fund = state.goals.find((g) => g.type === "emergency");
    if (fund && fund.earmarked - a.amount < emergencyFloor(state)) {
      throw new Error(`An earlier ruling already used this money. Plan ${plan.id} would take the ${fund.name} below its floor. ${stale}`);
    }
  }
  for (const i of plan.impacts) {
    const goal = state.goals.find((g) => g.id === i.goalId);
    if (goal && plan.actions.some((a) => a.kind === "delay_goal" && a.goalId === i.goalId) && goal.earmarked < i.amountGiven) {
      throw new Error(`An earlier ruling already used this money. ${goal.name} no longer has ${formatInr(i.amountGiven)} to give. ${stale}`);
    }
  }
}

/** Undoing any row a ruling posted undoes the whole ruling, so no money stays moved with no expense behind it. Returns false if the row isn't from a ruling. */
export function undoRulingForEvent(db: DatabaseSync, eventId: string): boolean {
  const rows = db.prepare("SELECT panchayat_id, effects_json FROM ruling_effects").all() as { panchayat_id: string; effects_json: string }[];
  for (const row of rows) {
    const e = JSON.parse(row.effects_json) as { goals: GoalColumns[]; fixedCosts: string | null; eventIds: string[]; earmarkIds: string[]; recurringIds: string[] };
    if (!e.eventIds.includes(eventId)) continue;
    tx(db, () => {
      for (const id of e.eventIds) undoEvent(db, id);
      for (const id of e.earmarkIds) db.prepare("DELETE FROM earmarks WHERE id = ?").run(id);
      for (const id of e.recurringIds) db.prepare("DELETE FROM recurring WHERE id = ?").run(id);
      for (const g of e.goals) {
        db.prepare("UPDATE goals SET target_month = ?, floor_month = ?, reduction_amount = ?, reduction_months = ? WHERE id = ?")
          .run(g.target_month, g.floor_month, g.reduction_amount, g.reduction_months, g.id);
      }
      setProfileValue(db, "fixed_costs", e.fixedCosts);
      db.prepare("DELETE FROM conditions WHERE panchayat_id = ?").run(row.panchayat_id);
      db.prepare("UPDATE panchayats SET ruling_id = NULL, ruling_text = NULL, ops_json = NULL, ruled_at = NULL WHERE id = ?").run(row.panchayat_id);
      db.prepare("DELETE FROM ruling_effects WHERE panchayat_id = ?").run(row.panchayat_id);
    });
    return true;
  }
  return false;
}

/** All or nothing. Ruling on an already ruled panchayat returns the first ruling and changes nothing, so a double tap can't post twice. */
export function applyRuling(db: DatabaseSync, panchayat: TPanchayat, text: string, ops: TRulingOp[]): string {
  return tx(db, () => {
    const existing = getRulingId(db, panchayat.id);
    if (existing) return existing;
    // A what-if models a future. It records the decision and moves no money.
    if (panchayat.trigger.kind === "whatif") return recordRuling(db, panchayat.id, text, ops);
    const state = getState(db);
    const goalsBefore = db.prepare("SELECT id, target_month, floor_month, reduction_amount, reduction_months FROM goals").all() as GoalColumns[];
    const fixedCosts = getProfileValue(db, "fixed_costs");
    const [eventRow, earmarkRow, recurringRow] = [maxRowid(db, "events"), maxRowid(db, "earmarks"), maxRowid(db, "recurring")];
    const known = (id: string) => {
      if (!state.goals.some((g) => g.id === id)) throw new Error(`Ruling names an unknown goal: ${id}`);
    };
    const chosen = ops.find((o) => o.op === "choose_plan");
    if (chosen && !chosenPlan(panchayat, ops)) throw new Error(`Ruling names an unknown plan: ${chosen.op === "choose_plan" ? chosen.planId : ""}`);
    const plan = chosenPlan(panchayat, ops);
    assertStillAffordable(state, plan);
    for (const a of plan?.actions ?? []) applyAction(db, state, plan!, a);
    if (panchayat.trigger.kind === "expense") postTrigger(db, panchayat, plan);
    for (const i of plan?.impacts ?? []) {
      if (plan!.actions.some((a) => a.kind === "delay_goal" && a.goalId === i.goalId)) moveGoal(db, i.goalId, i.afterMonth);
    }
    for (const op of ops) {
      if (op.op === "move_goal") {
        known(op.goalId);
        moveGoal(db, op.goalId, op.toMonth);
      } else if (op.op === "hold_goal") {
        known(op.goalId);
        if (MONTH.test(op.until)) {
          const g = state.goals.find((x) => x.id === op.goalId)!;
          setGoalReduction(db, g.id, g.monthlyContribution, Math.max(0, monthsBetween(state.simMonth, op.until)));
        }
      } else if (op.op === "add_condition") {
        known(op.condition.then.goalId);
        addCondition(db, panchayat.id, op.condition);
      }
    }
    db.prepare("INSERT OR REPLACE INTO ruling_effects (panchayat_id, effects_json) VALUES (?, ?)").run(panchayat.id, JSON.stringify({
      goals: goalsBefore, fixedCosts,
      eventIds: idsAfter(db, "events", eventRow), earmarkIds: idsAfter(db, "earmarks", earmarkRow), recurringIds: idsAfter(db, "recurring", recurringRow),
    }));
    return recordRuling(db, panchayat.id, text, ops);
  });
}

const words = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 2));

/** The most relevant earlier ruling: shared words in the trigger first, then the closest amount, then the latest. */
export function findPrecedent(db: DatabaseSync, trigger: TTrigger): string | null {
  const want = words(`${trigger.label} ${trigger.quote}`);
  const scored = listRulings(db).map((r, index) => {
    const overlap = [...words(`${r.trigger.label} ${r.trigger.quote}`)].filter((w) => want.has(w)).length;
    return { text: r.text, overlap, gap: Math.abs(r.trigger.amount - trigger.amount), index };
  });
  scored.sort((a, b) => b.overlap - a.overlap || a.gap - b.gap || a.index - b.index);
  return scored[0]?.text ?? null;
}

/**
 * Settles pending conditions against a bonus, once. A condition that isn't met is closed too, so a later
 * call can't fire it. With no bonus known, conditions stay pending.
 */
export function fireConditions(db: DatabaseSync, bonus: number | null): TNotice[] {
  if (bonus == null) return [];
  return tx(db, () => {
    const fired: TNotice[] = [];
    for (const row of pendingConditions(db)) {
      const c = Condition.parse(JSON.parse(row.condition_json));
      const met = c.cmp === "lt" ? bonus < c.amount : bonus >= c.amount;
      if (!met) {
        resolveCondition(db, row.id, "not_met");
        continue;
      }
      moveGoal(db, c.then.goalId, c.then.toMonth);
      resolveCondition(db, row.id, "fired");
      const name = findGoal(db, c.then.goalId)?.name ?? c.then.goalId;
      const relation = c.cmp === "lt" ? "under" : "at least";
      fired.push(addNotice(db, {
        kind: "condition_fired",
        title: "Your ruling applied",
        body: `Bonus was ${formatInr(bonus)}, ${relation} ${formatInr(c.amount)}, so ${name} moves to ${monthLabel(c.then.toMonth)}.`,
        goalId: c.then.goalId,
      }));
    }
    return fired;
  });
}
