"use client";

import { useState } from "react";
import { ArrowLeft, Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanInput } from "@/lib/plan/plan-input";
import type { StudyDays } from "@/lib/plan/types";

const HOURS_OPTIONS: { label: string; value: number }[] = [
  { label: "< 1 hr", value: 0.5 },
  { label: "1–2 hrs", value: 1.5 },
  { label: "2–4 hrs", value: 3 },
  { label: "4+ hrs", value: 5 },
];

function todayISODate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function DetailsForm({
  goal,
  onBack,
  onSubmit,
  pending,
}: {
  goal: string;
  onBack: () => void;
  onSubmit: (input: PlanInput) => void;
  pending: boolean;
}) {
  const [examName, setExamName] = useState(goal);
  const [targetDate, setTargetDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState<number | null>(null);
  const [studyDays, setStudyDays] = useState<StudyDays>("daily");

  const canSubmit = examName.trim().length > 0 && targetDate && hoursPerDay !== null;

  function submit() {
    if (!canSubmit) return;
    onSubmit({ goal, examName: examName.trim(), targetDate, hoursPerDay: hoursPerDay!, studyDays });
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="examName">What&apos;s this for?</Label>
        <Input
          id="examName"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder="e.g. Physics unit test, JEE Main, French final"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="targetDate">When is it?</Label>
        <Input
          id="targetDate"
          type="date"
          min={todayISODate()}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>How much time can you give it per day?</Label>
        <div className="flex flex-wrap gap-2">
          {HOURS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setHoursPerDay(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                hoursPerDay === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Which days?</Label>
        <div className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary p-1">
          {(["daily", "weekdays"] as StudyDays[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setStudyDays(d)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                studyDays === d
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {d === "daily" ? "Every day" : "Weekdays only"}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={submit} disabled={!canSubmit || pending} size="lg" className="mt-2">
        <Compass className="size-4" />
        {pending ? "Building your plan…" : "Build my plan"}
      </Button>
    </div>
  );
}
