import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
});

export const learningPlans = sqliteTable("learning_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  goal: text("goal").notNull(),
  examName: text("exam_name").notNull(),
  targetDate: text("target_date").notNull(),
  daysRemaining: integer("days_remaining").notNull(),
  planJson: text("plan_json").notNull(),
  mocked: integer("mocked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  topic: text("topic").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  mocked: integer("mocked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sparSessions = sqliteTable("spar_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  scenario: text("scenario").notNull(),
  exchangeCount: integer("exchange_count").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
