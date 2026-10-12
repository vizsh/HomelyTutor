import type { LearningPlan, Priority, PlanPeriod } from "./types";
import { computePeriods, daysBetween } from "./periods";
import type { PlanInput } from "./plan-input";

const PRIORITY_CYCLE: Priority[] = ["high", "medium", "low"];

/**
 * Fallback generator — used when no ANTHROPIC_API_KEY is configured, or the
 * real generation call fails. Deliberately generic per-topic content (not
 * domain facts) so it never presents something wrong as a real study plan;
 * the period structure and date math are real either way.
 */
export async function generateMockPlan(input: PlanInput): Promise<LearningPlan> {
  const today = new Date();
  const target = new Date(input.targetDate);
  const slots = computePeriods(today, target, input.studyDays);

  const periods: PlanPeriod[] = slots.map((slot, i) => {
    const topicCount = slot.studyDayCount <= 3 ? 1 : 2;
    const topics = Array.from({ length: topicCount }).map((_, j) => {
      const priority = PRIORITY_CYCLE[(i + j) % 3];
      return {
        id: `${slot.id}-t${j + 1}`,
        title: `${input.examName} — core topic ${i + 1}.${j + 1}`,
        summary:
          priority === "high"
            ? "Foundational, heavily-weighted material — build this first and revisit it."
            : priority === "medium"
              ? "Standard coverage — solid, expected material for this stage."
              : "Lighter pass — useful but lower-stakes for this exam.",
        priority,
        estimatedHours: Math.max(1, Math.round(slot.studyDayCount * input.hoursPerDay * (0.5 / topicCount))),
        resources: [
          { kind: "docs" as const, label: "Syllabus reference material" },
          { kind: "practice" as const, label: "Practice questions" },
        ],
      };
    });

    const isCheckpoint = (i + 1) % 4 === 0 || i === slots.length - 1;

    return {
      id: slot.id,
      label: slot.label,
      dateRangeLabel: slot.dateRangeLabel,
      startDate: slot.startDate,
      endDate: slot.endDate,
      topics,
      milestone: isCheckpoint
        ? i === slots.length - 1
          ? "Final review + full mock test"
          : "Checkpoint: revise everything so far"
        : undefined,
    };
  });

  const allTopics = periods.flatMap((p) => p.topics);
  const priorityBreakdown = { high: 0, medium: 0, low: 0 };
  for (const t of allTopics) priorityBreakdown[t.priority] += t.estimatedHours;

  return {
    goal: input.goal,
    examName: input.examName,
    targetDate: target.toISOString(),
    daysRemaining: daysBetween(today, target),
    hoursPerDay: input.hoursPerDay,
    studyDays: input.studyDays,
    totalStudyHours: allTopics.reduce((sum, t) => sum + t.estimatedHours, 0),
    priorityBreakdown,
    periods,
  };
}
