"use client";

import { useState } from "react";
import { Compass, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { GoalStep } from "@/components/plan/goal-step";
import { DetailsForm } from "@/components/plan/details-form";
import { PlanOverview } from "@/components/plan/plan-overview";
import { PeriodCard } from "@/components/plan/period-card";
import { generatePlan } from "@/lib/plan/generate-plan";
import type { PlanInput } from "@/lib/plan/plan-input";
import type { LearningPlan } from "@/lib/plan/types";

type Step = "goal" | "details" | "loading" | "plan";

export default function PlanPage() {
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [mocked, setMocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: PlanInput) {
    setStep("loading");
    setError(null);
    try {
      const result = await generatePlan(input);
      setPlan(result.plan);
      setMocked(result.mocked);
      setStep("plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("details");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-16 pb-10 md:pt-24">
        {step === "goal" && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-secondary">
                <Compass className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-3xl leading-tight md:text-4xl">
                What do you want to learn?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell me the goal, however vague. I&apos;ll map the route — not
                teach it myself.
              </p>
            </div>
            <GoalStep
              onNext={(g) => {
                setGoal(g);
                setStep("details");
              }}
            />
          </>
        )}

        {step === "details" && (
          <>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <DetailsForm
              goal={goal}
              onBack={() => setStep("goal")}
              onSubmit={handleSubmit}
              pending={false}
            />
          </>
        )}

        {step === "loading" && (
          <div className="flex flex-col gap-3 py-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
            <p className="text-center text-sm text-muted-foreground">
              Researching and building your calendar…
            </p>
          </div>
        )}

        {step === "plan" && plan && (
          <div className="flex flex-col gap-6">
            {mocked && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent-foreground">
                Demo data — connect an{" "}
                <code className="rounded bg-accent/20 px-1 py-0.5 text-xs">
                  ANTHROPIC_API_KEY
                </code>{" "}
                to generate real, researched plans.
              </div>
            )}
            <PlanOverview plan={plan} />
            <div className="flex flex-col gap-4">
              {plan.periods.map((period, i) => (
                <PeriodCard key={period.id} period={period} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
