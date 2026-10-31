import { describe, expect, it } from "vitest";
import { attemptOrder } from "./llm";

const models = ["flash", "lite"];
const ids = (spent: string[], keys = 2) => attemptOrder(keys, models, (id) => spent.includes(id)).map((a) => a.id);

describe("attemptOrder", () => {
  it("tries the stronger model on every key before the next model", () => {
    expect(ids([])).toEqual(["key1:flash", "key2:flash", "key1:lite", "key2:lite"]);
  });
  it("skips a spent pair only", () => {
    expect(ids(["key1:flash"])).toEqual(["key2:flash", "key1:lite", "key2:lite"]);
  });
  it("works with one key, and returns nothing when all are spent", () => {
    expect(ids([], 1)).toEqual(["key1:flash", "key1:lite"]);
    expect(ids(["key1:flash", "key1:lite"], 1)).toEqual([]);
  });
});
