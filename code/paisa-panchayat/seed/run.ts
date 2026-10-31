/** npm run seed: resets the database at DB_PATH and fills it with the synthetic demo data. */
import { existsSync } from "node:fs";
import { getDb } from "../src/lib/db";
import { getState } from "../src/ledger";
import { seedDemo } from "./index";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const db = getDb();
seedDemo(db);
const state = getState(db);
console.log(`Seeded synthetic data: ${state.rows.length} rows, ${state.goals.length} goals, month ${state.simMonth}`);
for (const g of state.goals) console.log(`  ${g.name}: ${g.projectedMonth}`);
