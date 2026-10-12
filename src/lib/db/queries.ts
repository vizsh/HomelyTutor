import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { learningPlans, quizAttempts, sparSessions } from "./schema";
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

export function saveSparSession(userId: string, scenario: string, exchangeCount: number) {
  db.insert(sparSessions)
    .values({
      id: randomUUID(),
      userId,
      scenario,
      exchangeCount,
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

  const spars = db
    .select()
    .from(sparSessions)
    .where(eq(sparSessions.userId, userId))
    .orderBy(desc(sparSessions.createdAt))
    .all();

  return { plans, quizzes, spars };
}
