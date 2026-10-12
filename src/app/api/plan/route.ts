import { NextResponse } from "next/server";

import { periodTopicsToolSchema } from "@/lib/plan/plan-schema";
import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import { computePeriods, daysBetween, type PeriodSlot } from "@/lib/plan/periods";
import type { PlanInput } from "@/lib/plan/plan-input";
import type { LearningPlan, PlanPeriod, PlanTopic, Priority } from "@/lib/plan/types";
import { getActiveUserId } from "@/lib/active-user";
import { savePlan } from "@/lib/db/queries";
import { ollama, isOllamaAvailable, OLLAMA_MODEL, extractToolArguments } from "@/lib/llm/ollama-client";

export const maxDuration = 60;

function buildSystemPrompt(
  input: PlanInput,
  slot: PeriodSlot,
  periodIndex: number,
  totalPeriods: number,
  coveredSoFar: string[],
) {
  const scaleHint =
    totalPeriods <= 2
      ? "This is a short, narrow run (like a single unit test) — 1-2 focused topics, no padding."
      : "This is part of a longer syllabus — spread proportional coverage across periods, with the heaviest, most foundational material earlier.";

  const coveredHint =
    coveredSoFar.length > 0
      ? `\nAlready covered in earlier periods (do not repeat these, move to new ground): ${coveredSoFar.join("; ")}.`
      : "";

  return `You are a study planner inside a student app, writing real study content — not placeholder text. The student is preparing for: "${input.examName}" (context: ${input.goal}). They have ${input.hoursPerDay} hours/day available, studying ${input.studyDays === "daily" ? "every day" : "on weekdays"}.

This is period ${periodIndex + 1} of ${totalPeriods}: "${slot.label}", ${slot.dateRangeLabel} (${slot.studyDayCount} study days). ${scaleHint}${coveredHint}

Rules:
- If "${input.examName}" is a known standardized test, professional certification, or board exam (e.g. CFA, a national board exam, a university course with a standard syllabus), you almost certainly know its real domain/topic structure from your training — use the ACTUAL domain names and their real published or realistically-estimated exam weightings. Do not invent a generic structure when a real one exists.
- Every topic title must be a real, specific thing a student of this subject would recognize (e.g. "Time Value of Money", "The Krebs Cycle", "Newton's Second Law: F=ma derivation") — never a generic placeholder like "Core topic 1" or "Week 1 material".
- Mark each topic's priority (high/medium/low) based on how heavily it's weighted or how foundational it is for this specific exam.
- For the resource, name one real, well-known resource for this subject (an actual textbook, official curriculum provider, or well-regarded course) by its real name — no URL, you cannot browse the web.
- Only include a milestone if this period genuinely warrants a checkpoint — a mock test, a revision pass. Most periods don't need one.
- Call emit_period_topics exactly once.`;
}

async function generatePeriodTopics(
  input: PlanInput,
  slot: PeriodSlot,
  periodIndex: number,
  totalPeriods: number,
  coveredSoFar: string[],
): Promise<{ topics: PlanTopic[]; milestone?: string } | null> {
  const response = await ollama.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(input, slot, periodIndex, totalPeriods, coveredSoFar) },
      { role: "user", content: "Build this period's topics now." },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: periodTopicsToolSchema.name,
          description: periodTopicsToolSchema.description,
          parameters: periodTopicsToolSchema.input_schema,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: periodTopicsToolSchema.name } },
  });

  const parsed = extractToolArguments<{ topics: PlanTopic[]; milestone?: string }>(
    response.choices[0]?.message ?? {},
    periodTopicsToolSchema.name,
  );

  if (!parsed || !Array.isArray(parsed.topics) || parsed.topics.length === 0) return null;
  return parsed;
}

// Local models occasionally return malformed JSON for a given period; one
// retry costs nothing (it's free, local compute) and meaningfully improves
// the odds of a fully-real plan instead of falling back to the whole thing.
async function generatePeriodWithRetry(
  input: PlanInput,
  slot: PeriodSlot,
  periodIndex: number,
  totalPeriods: number,
  coveredSoFar: string[],
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generatePeriodTopics(input, slot, periodIndex, totalPeriods, coveredSoFar);
      if (result) return result;
    } catch (err) {
      console.error(`period ${periodIndex} attempt ${attempt} failed`, err);
    }
  }
  return null;
}

export async function POST(req: Request) {
  let input: PlanInput;
  try {
    const body = await req.json();
    const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
    const examName = typeof body?.examName === "string" ? body.examName.trim() : goal;
    const targetDate = typeof body?.targetDate === "string" ? body.targetDate : "";
    const hoursPerDay = Number(body?.hoursPerDay);
    const studyDays = body?.studyDays === "weekdays" ? "weekdays" : "daily";

    if (!goal || goal.length > 300 || !examName || examName.length > 200) {
      return NextResponse.json({ error: "Missing or invalid goal/exam name." }, { status: 400 });
    }
    if (!targetDate || Number.isNaN(new Date(targetDate).getTime())) {
      return NextResponse.json({ error: "A valid target date is required." }, { status: 400 });
    }
    if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 16) {
      return NextResponse.json({ error: "Hours per day must be between 0 and 16." }, { status: 400 });
    }

    input = { goal, examName, targetDate, hoursPerDay, studyDays };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userId = await getActiveUserId();
  const today = new Date();
  const target = new Date(input.targetDate);
  const slots = computePeriods(today, target, input.studyDays);

  if (!(await isOllamaAvailable())) {
    const plan = await generateMockPlan(input);
    savePlan(userId, plan, true);
    return NextResponse.json({ plan, mocked: true, reason: "ollama_unavailable" });
  }

  try {
    const periods: PlanPeriod[] = [];
    const coveredSoFar: string[] = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const result = await generatePeriodWithRetry(input, slot, i, slots.length, coveredSoFar);
      if (!result) {
        // One bad period is enough to make the whole plan feel inconsistent —
        // fall back to the fully-mocked plan rather than mixing real and
        // placeholder periods under a single "real" label.
        const plan = await generateMockPlan(input);
        savePlan(userId, plan, true);
        return NextResponse.json({ plan, mocked: true, reason: `period_${i}_failed` });
      }
      periods.push({
        id: slot.id,
        label: slot.label,
        dateRangeLabel: slot.dateRangeLabel,
        startDate: slot.startDate,
        endDate: slot.endDate,
        topics: result.topics,
        milestone: result.milestone,
      });
      coveredSoFar.push(...result.topics.map((t) => t.title));
    }

    const allTopics = periods.flatMap((p) => p.topics);
    const priorityBreakdown: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
    for (const t of allTopics) {
      if (t.priority in priorityBreakdown) priorityBreakdown[t.priority] += t.estimatedHours || 0;
    }

    const plan: LearningPlan = {
      goal: input.goal,
      examName: input.examName,
      targetDate: target.toISOString(),
      daysRemaining: daysBetween(today, target),
      hoursPerDay: input.hoursPerDay,
      studyDays: input.studyDays,
      totalStudyHours: allTopics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      priorityBreakdown,
      periods,
    };

    savePlan(userId, plan, false);
    return NextResponse.json({ plan, mocked: false });
  } catch (err) {
    console.error("plan generation failed", err);
    const plan = await generateMockPlan(input);
    savePlan(userId, plan, true);
    return NextResponse.json({ plan, mocked: true, reason: "generation_error" });
  }
}
