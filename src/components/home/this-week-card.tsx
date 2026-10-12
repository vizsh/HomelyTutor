import Link from "next/link";
import { CalendarClock, Flag, ArrowRight } from "lucide-react";

import type { LearningPlan, PlanPeriod } from "@/lib/plan/types";
import { priorityStyle } from "@/lib/plan/priority-style";
import { daysBetween } from "@/lib/plan/periods";
import { cn } from "@/lib/utils";

export function ThisWeekCard({ plan, period }: { plan: LearningPlan; period: PlanPeriod }) {
  const daysLeft = daysBetween(new Date(), new Date(plan.targetDate));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{plan.examName}</p>
          <h3 className="font-serif text-lg leading-tight">
            {period.label} <span className="text-muted-foreground font-sans text-sm">· {period.dateRangeLabel}</span>
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
        </div>
      </div>

      {period.milestone && (
        <div className="mb-3 flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground w-fit">
          <Flag className="size-3.5" />
          {period.milestone}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {period.topics.map((topic) => (
          <div key={topic.id} className="flex items-center gap-2.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", priorityStyle[topic.priority].dot)} />
            <span className="flex-1 text-sm">{topic.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{topic.estimatedHours}h</span>
          </div>
        ))}
      </div>

      <Link
        href="/history"
        className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        See full plan <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
