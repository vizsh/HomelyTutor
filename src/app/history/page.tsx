import { Compass, ListChecks, History as HistoryIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getActiveUser } from "@/lib/active-user";
import { getUserHistory } from "@/lib/db/queries";
import { formatRelativeTime } from "@/lib/format-relative-time";

export default async function HistoryPage() {
  const user = await getActiveUser();
  const { plans, quizzes } = getUserHistory(user.id);

  const hasNothing = plans.length === 0 && quizzes.length === 0;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 pt-16 pb-10 md:pt-24">
        <div>
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-secondary">
            <HistoryIcon className="size-5 text-primary" />
          </div>
          <h1 className="text-center font-serif text-3xl leading-tight md:text-4xl">
            {user.name}&apos;s progress
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {user.tagline}
          </p>
        </div>

        {hasNothing && (
          <p className="text-center text-sm text-muted-foreground">
            Nothing yet for this demo user — generate a plan or take a quiz
            to see it show up here.
          </p>
        )}

        {plans.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader icon={Compass} label="Learning paths" />
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4">
                <CardContent className="flex items-center justify-between gap-3 p-0">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base">{plan.examName}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.daysRemaining} days out as of generation ·{" "}
                      {formatRelativeTime(new Date(plan.createdAt))}
                    </p>
                  </div>
                  {plan.mocked && <Badge variant="outline">Demo</Badge>}
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {quizzes.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader icon={ListChecks} label="Quiz attempts" />
            {quizzes.map((q) => {
              const pct = Math.round((q.score / q.total) * 100);
              return (
                <Card key={q.id} className="p-4">
                  <CardContent className="flex flex-col gap-2 p-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{q.topic}</p>
                      <span className="shrink-0 text-sm font-medium text-muted-foreground">
                        {q.score}/{q.total}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      indicatorClassName={pct >= 50 ? "bg-success" : "bg-destructive"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(q.createdAt))}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}

      </div>
    </AppShell>
  );
}

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: typeof Compass;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon className="size-4" />
      {label}
    </div>
  );
}
