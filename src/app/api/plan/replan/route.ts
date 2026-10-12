import { NextResponse } from "next/server";

import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import { generateRealPlan } from "@/lib/plan/generate-real-plan";
import { extractReplanSignal } from "@/lib/plan/extract-replan-signal";
import type { PlanInput } from "@/lib/plan/plan-input";
import { getActiveUserId } from "@/lib/active-user";
import { getLatestPlanRecord, savePlan } from "@/lib/db/queries";

export const maxDuration = 90;

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
  let progressNote: string | undefined;

  try {
    const body = await req.json();
    targetDate = typeof body?.targetDate === "string" ? body.targetDate : "";
    hoursPerDay = Number(body?.hoursPerDay);
    studyDays = body?.studyDays === "weekdays" ? "weekdays" : "daily";
    syllabusText =
      typeof body?.syllabusText === "string" && body.syllabusText.trim().length > 0
        ? body.syllabusText.trim().slice(0, 6000)
        : undefined;
    progressNote =
      typeof body?.progressNote === "string" && body.progressNote.trim().length > 0
        ? body.progressNote.trim().slice(0, 2000)
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
  const checkboxMastered = allTopics.filter((t) => t.completed).map((t) => t.title);
  const overduePending = allTopics
    .filter((t) => !t.completed && new Date(t.periodEnd).getTime() < now.getTime())
    .map((t) => t.title);

  // If the student explained their progress in their own words, map it
  // onto their real topic list and fold it in alongside the checkboxes —
  // either signal alone is fine, both together is strictly better.
  let circumstances = "";
  if (progressNote) {
    const signal = await extractReplanSignal(progressNote, allTopics.map((t) => t.title));
    if (signal) {
      for (const t of signal.masteredTopics) if (!checkboxMastered.includes(t)) checkboxMastered.push(t);
      for (const t of signal.strugglingTopics) if (!overduePending.includes(t)) overduePending.push(t);
      circumstances = signal.circumstances;
    } else {
      // Extraction unavailable/failed — still pass the raw note through as
      // context rather than silently dropping what the student told us.
      circumstances = progressNote;
    }
  }

  const input: PlanInput = {
    goal: record.plan.goal,
    examName: record.plan.examName,
    targetDate,
    hoursPerDay,
    studyDays,
    syllabusText,
  };

  const result = await generateRealPlan(input, {
    alreadyMastered: checkboxMastered,
    stillPending: overduePending,
    studentNote: circumstances || undefined,
  });

  if (!result.ok) {
    const plan = await generateMockPlan(input);
    const id = savePlan(userId, plan, true);
    return NextResponse.json({ id, plan, mocked: true, reason: result.reason });
  }

  const id = savePlan(userId, result.plan, false);
  return NextResponse.json({ id, plan: result.plan, mocked: false });
}
