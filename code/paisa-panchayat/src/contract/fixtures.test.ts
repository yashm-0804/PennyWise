import { describe, expect, it } from "vitest";
import * as f from "./fixtures";
import * as s from "./schemas";

describe("fixtures match the contract", () => {
  it.each([
    ["state", s.AppState, f.stateFixture],
    ["dictate", s.DictateResponse, f.dictateFixture],
    ["panchayat", s.Panchayat, f.panchayatFixture],
    ["ruling", s.RulingResponse, f.rulingFixture],
    ["munshi", s.MunshiResponse, f.munshiFixture],
    ["refusal", s.MunshiResponse, f.refusalFixture],
    ["import", s.ImportResponse, f.importFixture],
    ["nextMonth", s.NextMonthResponse, f.nextMonthFixture],
  ])("%s", (_name, schema, fixture) => {
    expect(() => schema.parse(fixture)).not.toThrow();
  });
});
