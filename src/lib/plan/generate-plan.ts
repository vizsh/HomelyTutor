import type { LearningPlan } from "./types";

export type GeneratePlanResult = {
  plan: LearningPlan;
  mocked: boolean;
};

export async function generatePlan(goal: string): Promise<GeneratePlanResult> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to generate a plan.");
  }

  return res.json();
}
