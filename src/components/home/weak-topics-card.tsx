import Link from "next/link";
import { RotateCcw } from "lucide-react";

export function WeakTopicsCard({
  topics,
}: {
  topics: { topic: string; score: number; total: number }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-medium text-muted-foreground">Worth practicing again</p>
      <div className="flex flex-col gap-2.5">
        {topics.map((t) => (
          <div key={t.topic} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{t.topic}</p>
              <p className="text-xs text-muted-foreground">
                Last time: {t.score}/{t.total}
              </p>
            </div>
            <Link
              href={`/practice?topic=${encodeURIComponent(t.topic)}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <RotateCcw className="size-3.5" />
              Practice again
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
