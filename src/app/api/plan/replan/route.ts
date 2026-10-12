import { NextResponse } from "next/server";

import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import { generateRealPlan } from "@/lib/plan/generate-real-plan";
import type { PlanInput } from "@/lib/plan/plan-input";
import { getActiveUserId } from "@/lib/active-user";
import { getLatestPlanRecord, savePlan } from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(req: Request) {
  const userId = await getActiveUserId();
  const record = getLatestPlanRecord(userId);
  if (!record) {
    return NextResponse.json({ error: "No existing plan to re-plan from." }, { status: 400 });
  }

  let targetDate: string;
  let hoursPerDay: number;
  let studyDays: "daily" | "weekdays";
  let syllabusText: string | undefined;

  try {
    const body = await req.json();
    targetDate = typeof body?.targetDate === "string" ? body.targetDate : "";
    hoursPerDay = Number(body?.hoursPerDay);
    studyDays = body?.studyDays === "weekdays" ? "weekdays" : "daily";
    syllabusText =
      typeof body?.syllabusText === "string" && body.syllabusText.trim().length > 0
        ? body.syllabusText.trim().slice(0, 6000)
        : undefined;

    if (!targetDate || Number.isNaN(new Date(targetDate).getTime())) {
      return NextResponse.json({ error: "A valid target date is required." }, { status: 400 });
    }
    if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 16) {
      return NextResponse.json({ error: "Hours per day must be between 0 and 16." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const now = new Date();
  const allTopics = record.plan.periods.flatMap((p) => p.topics.map((t) => ({ ...t, periodEnd: p.endDate })));
  const alreadyMastered = allTopics.filter((t) => t.completed).map((t) => t.title);
  const stillPending = allTopics
    .filter((t) => !t.completed && new Date(t.periodEnd).getTime() < now.getTime())
    .map((t) => t.title);

  const input: PlanInput = {
    goal: record.plan.goal,
    examName: record.plan.examName,
    targetDate,
    hoursPerDay,
    studyDays,
    syllabusText,
  };

  const result = await generateRealPlan(input, { alreadyMastered, stillPending });

  if (!result.ok) {
    const plan = await generateMockPlan(input);
    const id = savePlan(userId, plan, true);
    return NextResponse.json({ id, plan, mocked: true, reason: result.reason });
  }

  const id = savePlan(userId, result.plan, false);
  return NextResponse.json({ id, plan: result.plan, mocked: false });
}
