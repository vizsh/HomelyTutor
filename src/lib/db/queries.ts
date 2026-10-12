import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { learningPlans, quizAttempts } from "./schema";
import type { LearningPlan } from "@/lib/plan/types";
import type { QuizSet } from "@/lib/practice/types";

export function savePlan(userId: string, plan: LearningPlan, mocked: boolean) {
  db.insert(learningPlans)
    .values({
      id: randomUUID(),
      userId,
      goal: plan.goal,
      examName: plan.examName,
      targetDate: plan.targetDate,
      daysRemaining: plan.daysRemaining,
      planJson: JSON.stringify(plan),
      mocked,
      createdAt: new Date(),
    })
    .run();
}

export function saveQuizAttempt(userId: string, quiz: QuizSet, score: number, mocked: boolean) {
  db.insert(quizAttempts)
    .values({
      id: randomUUID(),
      userId,
      topic: quiz.topic,
      score,
      total: quiz.questions.length,
      mocked,
      createdAt: new Date(),
    })
    .run();
}

export function getUserHistory(userId: string) {
  const plans = db
    .select()
    .from(learningPlans)
    .where(eq(learningPlans.userId, userId))
    .orderBy(desc(learningPlans.createdAt))
    .all();

  const quizzes = db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .all();

  return { plans, quizzes };
}

export function getLatestPlan(userId: string): LearningPlan | null {
  const row = db
    .select()
    .from(learningPlans)
    .where(eq(learningPlans.userId, userId))
    .orderBy(desc(learningPlans.createdAt))
    .limit(1)
    .get();

  if (!row) return null;
  try {
    return JSON.parse(row.planJson) as LearningPlan;
  } catch {
    return null;
  }
}

/** Topics worth re-practicing: the most recent attempt per distinct topic
 * (so an improved score replaces an old weak one), filtered to genuinely
 * weak ones, weakest first. */
export function getWeakQuizTopics(userId: string, limit = 3) {
  const rows = db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .all();

  const latestByTopic = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByTopic.has(row.topic)) latestByTopic.set(row.topic, row);
  }

  return [...latestByTopic.values()]
    .filter((r) => r.score / r.total < 0.7)
    .sort((a, b) => a.score / a.total - b.score / b.total)
    .slice(0, limit);
}
