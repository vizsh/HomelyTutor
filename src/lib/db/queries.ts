import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { learningPlans, quizAttempts } from "./schema";
import type { LearningPlan } from "@/lib/plan/types";
import type { QuizSet } from "@/lib/practice/types";

export function savePlan(userId: string, plan: LearningPlan, mocked: boolean) {
  const id = randomUUID();
  db.insert(learningPlans)
    .values({
      id,
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
  return id;
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

export function getLatestPlanRecord(userId: string): { id: string; plan: LearningPlan } | null {
  const row = db
    .select()
    .from(learningPlans)
    .where(eq(learningPlans.userId, userId))
    .orderBy(desc(learningPlans.createdAt))
    .limit(1)
    .get();

  if (!row) return null;
  try {
    return { id: row.id, plan: JSON.parse(row.planJson) as LearningPlan };
  } catch {
    return null;
  }
}

export function getLatestPlan(userId: string): LearningPlan | null {
  return getLatestPlanRecord(userId)?.plan ?? null;
}

/** Toggles a topic's completion within a stored plan. Scoped to the owning
 * user so one user can't mutate another's plan by guessing an id. */
export function setTopicCompletion(
  userId: string,
  planId: string,
  periodId: string,
  topicId: string,
  completed: boolean,
) {
  const row = db
    .select()
    .from(learningPlans)
    .where(eq(learningPlans.id, planId))
    .get();

  if (!row || row.userId !== userId) return false;

  const plan = JSON.parse(row.planJson) as LearningPlan;
  const period = plan.periods.find((p) => p.id === periodId);
  const topic = period?.topics.find((t) => t.id === topicId);
  if (!topic) return false;

  topic.completed = completed;
  db.update(learningPlans).set({ planJson: JSON.stringify(plan) }).where(eq(learningPlans.id, planId)).run();
  return true;
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
