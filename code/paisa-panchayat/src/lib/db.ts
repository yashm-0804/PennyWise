import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const g = globalThis as unknown as { __ppDb?: DatabaseSync };

/** One connection per server process, kept on globalThis so dev reloads reuse it. */
export function getDb(): DatabaseSync {
  if (!g.__ppDb) {
    const path = resolve(process.env.DB_PATH ?? "./data/app.db");
    mkdirSync(dirname(path), { recursive: true });
    g.__ppDb = new DatabaseSync(path);
    g.__ppDb.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  }
  return g.__ppDb;
}
