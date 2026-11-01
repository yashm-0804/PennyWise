import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts", "seed/**/*.test.ts"], environment: "node", pool: "forks" },
});
