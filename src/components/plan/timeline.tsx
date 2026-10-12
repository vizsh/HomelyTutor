import { FileText, GraduationCap, Video, Dumbbell, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { LearningPlan, ResourceKind } from "@/lib/plan/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const resourceIcon: Record<ResourceKind, LucideIcon> = {
  docs: FileText,
  course: GraduationCap,
  video: Video,
  practice: Dumbbell,
  book: BookOpen,
};

export function PlanTimeline({ plan }: { plan: LearningPlan }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your path to</p>
          <h2 className="font-serif text-2xl capitalize">{plan.goal}</h2>
        </div>
        <Badge variant="accent">{plan.totalDurationLabel}</Badge>
      </div>

      <ol className="relative flex flex-col gap-8">
        <div
          aria-hidden
          className="absolute top-2 bottom-2 left-[15px] w-px bg-border"
        />
        {plan.stages.map((stage, i) => (
          <li key={stage.id} className="relative flex gap-5 pl-0">
            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card font-serif text-sm text-primary">
              {i + 1}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg leading-tight">
                  {stage.title}
                </h3>
                <Badge variant="outline">{stage.durationLabel}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {stage.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stage.resources.map((resource, idx) => {
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
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
