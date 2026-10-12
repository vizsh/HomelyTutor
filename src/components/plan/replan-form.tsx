"use client";

import { useState } from "react";
import { ArrowLeft, RotateCcw, FileText, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LearningPlan, StudyDays } from "@/lib/plan/types";
import { toLocalISODate } from "@/lib/format-local-date";

const HOURS_OPTIONS: { label: string; value: number }[] = [
  { label: "< 1 hr", value: 0.5 },
  { label: "1–2 hrs", value: 1.5 },
  { label: "2–4 hrs", value: 3 },
  { label: "4+ hrs", value: 5 },
];

export type ReplanInput = {
  targetDate: string;
  hoursPerDay: number;
  studyDays: StudyDays;
  syllabusText?: string;
  progressNote?: string;
};

export function ReplanForm({
  plan,
  doneCount,
  totalCount,
  onBack,
  onSubmit,
  pending,
}: {
  plan: LearningPlan;
  doneCount: number;
  totalCount: number;
  onBack: () => void;
  onSubmit: (input: ReplanInput) => void;
  pending: boolean;
}) {
  const [targetDate, setTargetDate] = useState(toLocalISODate(new Date(plan.targetDate)));
  const [hoursPerDay, setHoursPerDay] = useState<number | null>(plan.hoursPerDay);
  const [studyDays, setStudyDays] = useState<StudyDays>(plan.studyDays);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [progressNote, setProgressNote] = useState("");

  const canSubmit = targetDate && hoursPerDay !== null;

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      targetDate,
      hoursPerDay: hoursPerDay!,
      studyDays,
      syllabusText: syllabusText.trim() || undefined,
      progressNote: progressNote.trim() || undefined,
    });
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

      <div>
        <h2 className="font-serif text-xl">Re-plan from here</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {doneCount} of {totalCount} topics marked done. I&apos;ll build a fresh schedule for what&apos;s
          left, prioritizing anything you fell behind on.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="progressNote" className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          Tell me what happened
        </Label>
        <textarea
          id="progressNote"
          value={progressNote}
          onChange={(e) => setProgressNote(e.target.value)}
          placeholder="e.g. 'I nailed the ethics section but never got to fixed income. Been a rough week, sick for a few days.'"
          rows={3}
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
        />
        <p className="text-xs text-muted-foreground">
          Optional, in your own words — I&apos;ll match what you mention to your actual topics and factor
          it in alongside the checkboxes below.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="replanDate">New target date</Label>
        <Input
          id="replanDate"
          type="date"
          min={toLocalISODate(new Date())}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Hours available per day now</Label>
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
                studyDays === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {d === "daily" ? "Every day" : "Weekdays only"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {!showSyllabus ? (
          <button
            type="button"
            onClick={() => setShowSyllabus(true)}
            className="flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-3.5" />
            Paste updated syllabus or notes (optional)
          </button>
        ) : (
          <>
            <Label htmlFor="replanSyllabus">Syllabus or notes (optional)</Label>
            <textarea
              id="replanSyllabus"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
            />
          </>
        )}
      </div>

      <Button onClick={submit} disabled={!canSubmit || pending} size="lg" className="mt-2">
        <RotateCcw className="size-4" />
        {pending ? "Rebuilding your plan…" : "Rebuild the rest of my plan"}
      </Button>
    </div>
  );
}
