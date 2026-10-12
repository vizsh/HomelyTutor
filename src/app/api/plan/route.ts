import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { planToolSchema } from "@/lib/plan/plan-schema";
import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import { computePeriods, daysBetween } from "@/lib/plan/periods";
import type { PlanInput } from "@/lib/plan/plan-input";
import type { LearningPlan, PlanPeriod, PlanTopic, Priority } from "@/lib/plan/types";
import { getActiveUserId } from "@/lib/active-user";
import { savePlan } from "@/lib/db/queries";

export const maxDuration = 60;

function buildSystemPrompt(input: PlanInput, slotsDescription: string) {
  return `You are a study planner inside a student app. The student is preparing for: "${input.examName}" (context: ${input.goal}). They have ${input.hoursPerDay} hours/day available, studying ${input.studyDays === "daily" ? "every day" : "on weekdays"}.

Here are the fixed time periods to fill — dates and labels are already decided, do not restate or change them:
${slotsDescription}

Rules:
- Scale to the actual scope. A single unit test or quiz needs only a few focused topics total, not padding. A full syllabus / competitive exam needs proportionally broader coverage spread sensibly across all the periods, with foundational heavily-weighted topics placed early.
- Mark each topic's priority (high/medium/low) based on how heavily it's weighted or how foundational it is for this specific exam — not a generic guess. High-priority, high-weightage topics should appear in earlier periods where possible.
- Use the web_search tool to find real resources (official docs, well-regarded courses, past-paper banks, etc). Only set a "url" you actually verified via search — never invent one.
- Add a milestone (a mock test, revision checkpoint, etc.) to roughly every 3rd-4th period and to the final period — not every period.
- When done, call emit_study_periods exactly once with topics for every period id listed above. Do not respond with plain text.`;
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const plan = await generateMockPlan(input);
    savePlan(userId, plan, true);
    return NextResponse.json({ plan, mocked: true });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const slotsDescription = slots
      .map((s) => `- id "${s.id}": ${s.label}, ${s.dateRangeLabel} (${s.studyDayCount} study days)`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 6000,
      system: buildSystemPrompt(input, slotsDescription),
      messages: [{ role: "user", content: `Build the study periods now.` }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10,
        } satisfies Anthropic.Messages.WebSearchTool20250305,
        {
          name: planToolSchema.name,
          description: planToolSchema.description,
          input_schema: planToolSchema.input_schema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use" && block.name === planToolSchema.name,
    );

    if (!toolUse) {
      const plan = await generateMockPlan(input);
      savePlan(userId, plan, true);
      return NextResponse.json({ plan, mocked: true, reason: "model_did_not_emit_plan" });
    }

    type ModelPeriod = { periodId: string; topics: PlanTopic[]; milestone?: string };
    const modelPeriods = (toolUse.input as { periods: ModelPeriod[] }).periods ?? [];

    const periods: PlanPeriod[] = slots.map((slot, i) => {
      const match = modelPeriods.find((p) => p.periodId === slot.id) ?? modelPeriods[i];
      return {
        id: slot.id,
        label: slot.label,
        dateRangeLabel: slot.dateRangeLabel,
        startDate: slot.startDate,
        endDate: slot.endDate,
        topics: Array.isArray(match?.topics) ? match.topics : [],
        milestone: match?.milestone,
      };
    });

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
