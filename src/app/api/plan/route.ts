import { NextResponse } from "next/server";

import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import { generateRealPlan } from "@/lib/plan/generate-real-plan";
import type { PlanInput } from "@/lib/plan/plan-input";
import { getActiveUserId } from "@/lib/active-user";
import { savePlan } from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(req: Request) {
  let input: PlanInput;
  try {
    const body = await req.json();
    const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
    const examName = typeof body?.examName === "string" ? body.examName.trim() : goal;
    const targetDate = typeof body?.targetDate === "string" ? body.targetDate : "";
    const hoursPerDay = Number(body?.hoursPerDay);
    const studyDays = body?.studyDays === "weekdays" ? "weekdays" : "daily";
    const syllabusText =
      typeof body?.syllabusText === "string" && body.syllabusText.trim().length > 0
        ? body.syllabusText.trim().slice(0, 6000)
        : undefined;

    if (!goal || goal.length > 300 || !examName || examName.length > 200) {
      return NextResponse.json({ error: "Missing or invalid goal/exam name." }, { status: 400 });
    }
    if (!targetDate || Number.isNaN(new Date(targetDate).getTime())) {
      return NextResponse.json({ error: "A valid target date is required." }, { status: 400 });
    }
    if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 16) {
      return NextResponse.json({ error: "Hours per day must be between 0 and 16." }, { status: 400 });
    }

    input = { goal, examName, targetDate, hoursPerDay, studyDays, syllabusText };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userId = await getActiveUserId();
  const result = await generateRealPlan(input);

  if (!result.ok) {
    const plan = await generateMockPlan(input);
    const id = savePlan(userId, plan, true);
    return NextResponse.json({ id, plan, mocked: true, reason: result.reason });
  }

  const id = savePlan(userId, result.plan, false);
  return NextResponse.json({ id, plan: result.plan, mocked: false });
}
