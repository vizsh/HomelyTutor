import { Compass, ListChecks } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { UnifiedInput } from "@/components/home/unified-input";
import { ModeCard } from "@/components/home/mode-card";
import { getActiveUser } from "@/lib/active-user";

export default async function Home() {
  const user = await getActiveUser();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-16 pb-10 md:pt-24">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Good to see you, {user.name}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">
            What are we working on today?
          </h1>
        </div>

        <UnifiedInput />

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
    </AppShell>
  );
}
