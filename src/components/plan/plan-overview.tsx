"use client";

import { CalendarClock, Clock } from "lucide-react";

import type { LearningPlan } from "@/lib/plan/types";
import { priorityStyle } from "@/lib/plan/priority-style";
import { cn } from "@/lib/utils";

function formatTargetDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function PlanOverview({ plan }: { plan: LearningPlan }) {
  const { high, medium, low } = plan.priorityBreakdown;
  const totalHours = Math.max(1, high + medium + low);
  const segments = [
    { key: "high" as const, hours: high, pct: (high / totalHours) * 100 },
    { key: "medium" as const, hours: medium, pct: (medium / totalHours) * 100 },
    { key: "low" as const, hours: low, pct: (low / totalHours) * 100 },
  ].filter((s) => s.hours > 0);

  const periodsTotalDays = plan.periods.reduce((sum, p) => {
    const days = Math.max(
      1,
      Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000) + 1,
    );
    return sum + days;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Your plan for</p>
        <h2 className="font-serif text-2xl leading-tight">{plan.examName}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={CalendarClock}
          label={plan.daysRemaining === 0 ? "Today" : `${plan.daysRemaining} day${plan.daysRemaining === 1 ? "" : "s"}`}
          sublabel={`left · by ${formatTargetDate(plan.targetDate)}`}
        />
        <Stat icon={Clock} label={`${plan.hoursPerDay}h`} sublabel="per day" />
        <Stat
          icon={Clock}
          label={`${Math.round(plan.totalStudyHours)}h`}
          sublabel="total planned"
        />
      </div>

      {segments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Where the time goes</p>
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
            {segments.map((s) => (
              <div
                key={s.key}
                className={cn(priorityStyle[s.key].bar, "h-full first:rounded-l-full last:rounded-r-full")}
                style={{ width: `${s.pct}%` }}
                title={`${priorityStyle[s.key].label}: ${Math.round(s.hours)}h`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", priorityStyle[s.key].dot)} />
                {priorityStyle[s.key].label} · {Math.round(s.hours)}h
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.periods.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">At a glance</p>
          <div className="flex h-8 w-full gap-0.5">
            {plan.periods.map((p) => {
              const days =
                Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000) + 1;
              const hasHigh = p.topics.some((t) => t.priority === "high");
              return (
                <a
                  key={p.id}
                  href={`#period-${p.id}`}
                  title={`${p.label}: ${p.dateRangeLabel}`}
                  style={{ width: `${(Math.max(1, days) / periodsTotalDays) * 100}%` }}
                  className={cn(
                    "h-full rounded-md transition-opacity hover:opacity-80",
                    hasHigh ? "bg-primary/25" : "bg-secondary",
                    p.milestone && "ring-2 ring-accent/50",
                  )}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  sublabel,
}: {
  icon: typeof CalendarClock;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/60 py-3 text-center">
      <Icon className="size-4 text-primary" />
      <p className="font-serif text-lg leading-none">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}
