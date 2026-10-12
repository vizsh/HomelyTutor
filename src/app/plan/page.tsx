"use client";

import { useEffect, useState } from "react";
import { Compass, TriangleAlert, RotateCcw, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { GoalStep } from "@/components/plan/goal-step";
import { DetailsForm } from "@/components/plan/details-form";
import { ReplanForm, type ReplanInput } from "@/components/plan/replan-form";
import { PlanOverview } from "@/components/plan/plan-overview";
import { PeriodCard } from "@/components/plan/period-card";
import { Button } from "@/components/ui/button";
import { generatePlan } from "@/lib/plan/generate-plan";
import type { PlanInput } from "@/lib/plan/plan-input";
import type { LearningPlan } from "@/lib/plan/types";

type Step = "loading-current" | "goal" | "details" | "loading" | "view" | "replan";

export default function PlanPage() {
  const [step, setStep] = useState<Step>("loading-current");
  const [goal, setGoal] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [mocked, setMocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plan/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.plan && data.id) {
          setPlanId(data.id);
          setPlan(data.plan);
          setStep("view");
        } else {
          setStep("goal");
        }
      })
      .catch(() => setStep("goal"));
  }, []);

  async function handleSubmit(input: PlanInput) {
    setStep("loading");
    setError(null);
    try {
      const result = await generatePlan(input);
      setPlanId(result.id);
      setPlan(result.plan);
      setMocked(result.mocked);
      setStep("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("details");
    }
  }

  async function handleReplan(input: ReplanInput) {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/plan/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to re-plan.");
      setPlanId(data.id);
      setPlan(data.plan);
      setMocked(data.mocked);
      setStep("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("view");
    }
  }

  function toggleTopic(periodId: string, topicId: string, completed: boolean) {
    if (!plan || !planId) return;
    setPlan({
      ...plan,
      periods: plan.periods.map((p) =>
        p.id !== periodId
          ? p
          : { ...p, topics: p.topics.map((t) => (t.id === topicId ? { ...t, completed } : t)) },
      ),
    });
    fetch("/api/plan/topic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, periodId, topicId, completed }),
    }).catch(() => {});
  }

  const allTopics = plan?.periods.flatMap((p) => p.topics) ?? [];
  const doneCount = allTopics.filter((t) => t.completed).length;

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
              onBack={() => setStep(plan ? "view" : "goal")}
              onSubmit={handleSubmit}
              pending={false}
            />
          </>
        )}

        {step === "replan" && plan && (
          <>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <ReplanForm
              plan={plan}
              doneCount={doneCount}
              totalCount={allTopics.length}
              onBack={() => setStep("view")}
              onSubmit={handleReplan}
              pending={false}
            />
          </>
        )}

        {(step === "loading" || step === "loading-current") && (
          <div className="flex flex-col gap-3 py-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
            {step === "loading" && (
              <p className="text-center text-sm text-muted-foreground">
                Researching and building your calendar…
              </p>
            )}
          </div>
        )}

        {step === "view" && plan && (
          <div className="flex flex-col gap-6">
            {mocked && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent-foreground">
                Demo data — make sure{" "}
                <code className="rounded bg-accent/20 px-1 py-0.5 text-xs">ollama serve</code>{" "}
                is running locally to generate a real plan for this topic.
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <PlanOverview plan={plan} />

            {allTopics.length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">
                  {doneCount} of {allTopics.length} topics done
                </span>
                <Button variant="outline" size="sm" onClick={() => setStep("replan")}>
                  <RotateCcw className="size-3.5" />
                  Re-plan from here
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {plan.periods.map((period, i) => (
                <PeriodCard key={period.id} period={period} index={i} onToggleTopic={(topicId, completed) => toggleTopic(period.id, topicId, completed)} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep("goal")}
              className="flex items-center justify-center gap-1.5 self-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <Sparkles className="size-3.5" />
              Start a completely new plan instead
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
