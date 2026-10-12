import { periodTopicsToolSchema } from "./plan-schema";
import { computePeriods, daysBetween, type PeriodSlot } from "./periods";
import type { PlanInput } from "./plan-input";
import type { LearningPlan, PlanPeriod, PlanTopic, Priority } from "./types";
import { ollama, isOllamaAvailable, OLLAMA_MODEL, extractToolArguments } from "@/lib/llm/ollama-client";

export type GenerateRealPlanOptions = {
  /** Topics already mastered (from a prior plan, re-planning) — skip these entirely. */
  alreadyMastered?: string[];
  /** Topics planned before but not yet done — worth prioritizing early. */
  stillPending?: string[];
  /** Free-text context from the student (illness, a busier week, etc.) extracted from their own words. */
  studentNote?: string;
};

function buildSystemPrompt(
  input: PlanInput,
  slot: PeriodSlot,
  periodIndex: number,
  totalPeriods: number,
  coveredSoFar: string[],
  opts: GenerateRealPlanOptions,
) {
  const scaleHint =
    totalPeriods <= 2
      ? "This is a short, narrow run (like a single unit test) — 1-2 focused topics, no padding."
      : "This is part of a longer syllabus — spread proportional coverage across periods, with the heaviest, most foundational material earlier.";

  const coveredHint =
    coveredSoFar.length > 0
      ? `\nAlready covered in earlier periods of THIS plan (do not repeat these, move to new ground): ${coveredSoFar.join("; ")}.`
      : "";

  const masteredHint =
    opts.alreadyMastered && opts.alreadyMastered.length > 0
      ? `\nThe student has already mastered these from before — do not plan time on them again: ${opts.alreadyMastered.join("; ")}.`
      : "";

  const pendingHint =
    opts.stillPending && opts.stillPending.length > 0
      ? `\nThese were planned before but never got done — the student is behind on them, prioritize fitting them in, especially in the earliest periods: ${opts.stillPending.join("; ")}.`
      : "";

  const groundingHint = input.syllabusText
    ? `\n\nThe student provided this material to study from — ground every topic strictly in this content, not your general knowledge of the subject. Use its own terminology and structure:\n"""\n${input.syllabusText.slice(0, 4000)}\n"""`
    : "";

  const noteHint = opts.studentNote
    ? `\nThe student's own words about what's changed: "${opts.studentNote}". Let this realistically shape pacing — e.g. ease up if they mention being overwhelmed or sick, don't just ignore it.`
    : "";

  return `You are a study planner inside a student app, writing real study content — not placeholder text. The student is preparing for: "${input.examName}" (context: ${input.goal}). They have ${input.hoursPerDay} hours/day available, studying ${input.studyDays === "daily" ? "every day" : "on weekdays"}.

This is period ${periodIndex + 1} of ${totalPeriods}: "${slot.label}", ${slot.dateRangeLabel} (${slot.studyDayCount} study days). ${scaleHint}${coveredHint}${masteredHint}${pendingHint}${noteHint}${groundingHint}

Rules:
${
  input.syllabusText
    ? "- Base topics on the provided material above — do not substitute general subject knowledge for it."
    : `- If "${input.examName}" is a known standardized test, professional certification, or board exam (e.g. CFA, a national board exam, a university course with a standard syllabus), you almost certainly know its real domain/topic structure from your training — use the ACTUAL domain names and their real published or realistically-estimated exam weightings. Do not invent a generic structure when a real one exists.`
}
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
  opts: GenerateRealPlanOptions,
): Promise<{ topics: PlanTopic[]; milestone?: string } | null> {
  const response = await ollama.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(input, slot, periodIndex, totalPeriods, coveredSoFar, opts) },
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
  opts: GenerateRealPlanOptions,
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generatePeriodTopics(input, slot, periodIndex, totalPeriods, coveredSoFar, opts);
      if (result) return result;
    } catch (err) {
      console.error(`period ${periodIndex} attempt ${attempt} failed`, err);
    }
  }
  return null;
}

export type GenerateRealPlanResult =
  | { ok: true; plan: LearningPlan }
  | { ok: false; reason: string };

export async function generateRealPlan(
  input: PlanInput,
  opts: GenerateRealPlanOptions = {},
): Promise<GenerateRealPlanResult> {
  if (!(await isOllamaAvailable())) {
    return { ok: false, reason: "ollama_unavailable" };
  }

  const today = new Date();
  const target = new Date(input.targetDate);
  const slots = computePeriods(today, target, input.studyDays);

  try {
    const periods: PlanPeriod[] = [];
    const coveredSoFar: string[] = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const result = await generatePeriodWithRetry(input, slot, i, slots.length, coveredSoFar, opts);
      if (!result) {
        return { ok: false, reason: `period_${i}_failed` };
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

    return { ok: true, plan };
  } catch (err) {
    console.error("plan generation failed", err);
    return { ok: false, reason: "generation_error" };
  }
}
