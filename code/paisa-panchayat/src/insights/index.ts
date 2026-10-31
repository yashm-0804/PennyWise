import type { InsightsModule } from "@/contract/modules";
import { driftNudges } from "./drift";
import { answerMunshi } from "./munshi";
import { runNextMonth } from "./nextMonth";
import { readApplePrice } from "./price";
import { detectRecurring } from "./recurring";
import { monthlyReview } from "./review";

export { answerMunshi, detectRecurring, driftNudges, monthlyReview, readApplePrice, runNextMonth };
export { parseApplePrice } from "./price";

/** Compile-time proof that these exports match the contract. */
export const insights: InsightsModule = { detectRecurring, driftNudges, monthlyReview, runNextMonth, readApplePrice, answerMunshi };
