import type { AgentsModule } from "@/contract/modules";
import { checkItems } from "./checks";
import { runGoalAgents } from "./goalAgents";
import { writeProse } from "./prose";
import { routeUtterance } from "./router";
import { parseRuling } from "./ruling";
import { guardrailCheck } from "./safety";
import { fillPlaceholders, validateLine } from "./validator";

export { checkItems, fillPlaceholders, guardrailCheck, parseRuling, routeUtterance, runGoalAgents, validateLine, writeProse };
export { parseAmount, parseAmounts } from "./numbers";

/** Compile-time proof that these exports match the contract. */
export const agents: AgentsModule = {
  routeUtterance, checkItems, runGoalAgents, validateLine, fillPlaceholders, parseRuling, guardrailCheck, writeProse,
};
