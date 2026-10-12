import type { LearningPlan, PlanStage } from "./types";

/**
 * Fallback generator — used when no ANTHROPIC_API_KEY is configured, or
 * the real generation call fails. Produces a generic but plausible
 * curriculum shape so the app degrades gracefully instead of breaking.
 */
export async function generateMockPlan(goal: string): Promise<LearningPlan> {
  const topic = goal.trim().replace(/^i want to learn\s*/i, "").replace(/\.$/, "");
  const display = topic.length > 0 ? topic : "this";

  const stages: PlanStage[] = [
    {
      id: "foundations",
      title: `Foundations of ${display}`,
      summary:
        "The core vocabulary and mental model — what the field actually is, and the handful of ideas everything else builds on.",
      durationLabel: "Week 1",
      resources: [
        { kind: "docs", label: "Official getting-started guide" },
        { kind: "video", label: "Beginner crash course" },
      ],
    },
    {
      id: "fundamentals",
      title: "Core fundamentals, hands-on",
      summary:
        "The skills you'll use constantly. Less reading, more doing — small exercises that force you to apply each idea.",
      durationLabel: "Weeks 2–3",
      resources: [
        { kind: "course", label: "Structured intro course" },
        { kind: "practice", label: "Guided exercises" },
      ],
    },
    {
      id: "project",
      title: "First real project",
      summary:
        "A small, complete build that forces you to combine everything so far — this is where it stops being abstract.",
      durationLabel: "Weeks 4–5",
      resources: [
        { kind: "practice", label: "Project walkthrough" },
        { kind: "docs", label: "Reference docs, as needed" },
      ],
    },
    {
      id: "depth",
      title: "Going deeper",
      summary:
        "The parts that separate someone who's dabbled from someone who's competent — edge cases, tradeoffs, the 'why' behind the defaults.",
      durationLabel: "Weeks 6–8",
      resources: [
        { kind: "book", label: "A well-regarded deeper text" },
        { kind: "course", label: "Intermediate course" },
      ],
    },
    {
      id: "practice-loop",
      title: "Build the practice habit",
      summary:
        "Ongoing, lower-intensity reps to keep the skill sharp — this is also where this app's test and practice modes take over.",
      durationLabel: "Ongoing",
      resources: [{ kind: "practice", label: "Recurring practice sessions" }],
    },
  ];

  return {
    goal: display,
    totalDurationLabel: "~2 months to first competence",
    stages,
  };
}
