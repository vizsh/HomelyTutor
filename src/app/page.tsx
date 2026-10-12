import { Compass, ListChecks } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { UnifiedInput } from "@/components/home/unified-input";
import { ModeCard } from "@/components/home/mode-card";
import { ThisWeekCard } from "@/components/home/this-week-card";
import { WeakTopicsCard } from "@/components/home/weak-topics-card";
import { getActiveUser } from "@/lib/active-user";
import { getLatestPlan, getWeakQuizTopics } from "@/lib/db/queries";
import { findCurrentPeriod } from "@/lib/plan/periods";

export default async function Home() {
  const user = await getActiveUser();
  const plan = getLatestPlan(user.id);
  const currentPeriod = plan ? findCurrentPeriod(plan.periods) : null;
  const weakTopics = getWeakQuizTopics(user.id);

  const hasDashboard = Boolean(plan && currentPeriod);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-16 pb-10 md:pt-24">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Good to see you, {user.name}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">
            {hasDashboard ? "Here's where things stand" : "What are we working on today?"}
          </h1>
        </div>

        {hasDashboard && plan && currentPeriod && (
          <ThisWeekCard plan={plan} period={currentPeriod} />
        )}

        {weakTopics.length > 0 && (
          <WeakTopicsCard
            topics={weakTopics.map((t) => ({ topic: t.topic, score: t.score, total: t.total }))}
          />
        )}

        {!hasDashboard && <UnifiedInput />}

        <div className="flex flex-col gap-3">
          {hasDashboard && (
            <p className="text-sm font-medium text-muted-foreground">Or start something new</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              href="/plan"
              icon={Compass}
              title="Plan a path"
              description="Tell me a goal, I'll map the route — stages, sources, timeline."
              accent="var(--secondary)"
            />
            <ModeCard
              href="/practice"
              icon={ListChecks}
              title="Test my knowledge"
              description="Give me a topic or your notes, I'll quiz you on it."
              accent="var(--secondary)"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
