import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import * as schema from "./schema";

// SQLite file on local disk — zero external accounts, zero setup. On
// Vercel's serverless filesystem this resets on redeploy/cold start, which
// is an accepted tradeoff for a non-scaled demo (see project notes); a real
// deploy that needs durable multi-user data would swap this client for a
// hosted Postgres (e.g. Neon) without touching the schema or query code.
const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "app.db"));

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    avatar_initials TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS learning_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    goal TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    target_date TEXT NOT NULL,
    days_remaining INTEGER NOT NULL,
    plan_json TEXT NOT NULL,
    mocked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    mocked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
