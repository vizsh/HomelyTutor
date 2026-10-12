"use client";

import { useRouter } from "next/navigation";
import { FileText, GraduationCap, Video, Dumbbell, BookOpen, ListChecks, Flag, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PlanPeriod, ResourceKind } from "@/lib/plan/types";
import { priorityStyle } from "@/lib/plan/priority-style";
import { cn } from "@/lib/utils";

const resourceIcon: Record<ResourceKind, LucideIcon> = {
  docs: FileText,
  course: GraduationCap,
  video: Video,
  practice: Dumbbell,
  book: BookOpen,
};

export function PeriodCard({
  period,
  index,
  onToggleTopic,
}: {
  period: PlanPeriod;
  index: number;
  onToggleTopic?: (topicId: string, completed: boolean) => void;
}) {
  const router = useRouter();

  function testOnTopic(title: string, summary: string) {
    router.push(`/practice?topic=${encodeURIComponent(`${title} — ${summary}`)}`);
  }

  return (
    <div id={`period-${period.id}`} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-xs text-foreground">
            {index + 1}
          </span>
          <div>
            <h3 className="font-serif text-base leading-tight">{period.label}</h3>
            <p className="text-xs text-muted-foreground">{period.dateRangeLabel}</p>
          </div>
        </div>
        {period.milestone && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
            <Flag className="size-3.5" />
            {period.milestone}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {period.topics.map((topic) => (
          <div key={topic.id} className="flex gap-3 border-l-2 border-border pl-4">
            {onToggleTopic && (
              <button
                type="button"
                onClick={() => onToggleTopic(topic.id, !topic.completed)}
                aria-pressed={Boolean(topic.completed)}
                aria-label={topic.completed ? "Mark as not done" : "Mark as done"}
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  topic.completed
                    ? "border-success bg-success text-success-foreground"
                    : "border-border text-transparent hover:border-primary/40",
                )}
              >
                <Check className="size-3" />
              </button>
            )}
            <div className="flex-1">
              {topic.domain && (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {topic.domain}
                  {topic.examWeight && <span className="text-accent-foreground"> · {topic.examWeight} of exam</span>}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <h4 className={cn("text-sm font-medium", topic.completed && "text-muted-foreground line-through")}>
                  {topic.title}
                </h4>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    priorityStyle[topic.priority].badge,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", priorityStyle[topic.priority].dot)} />
                  {priorityStyle[topic.priority].label}
                </span>
                <span className="text-[11px] text-muted-foreground">{topic.estimatedHours}h</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{topic.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topic.resources.map((resource, idx) => {
                  const Icon = resourceIcon[resource.kind];
                  const chipClass =
                    "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground";
                  return resource.url ? (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(chipClass, "hover:bg-secondary/70 underline-offset-2 hover:underline")}
                    >
                      <Icon className="size-3.5" />
                      {resource.label}
                    </a>
                  ) : (
                    <span key={idx} className={chipClass}>
                      <Icon className="size-3.5" />
                      {resource.label}
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => testOnTopic(topic.title, topic.summary)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ListChecks className="size-3.5" />
                  Test me on this
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
