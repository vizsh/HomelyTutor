import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

function verdict(pct: number) {
  if (pct === 100) return "Clean sweep.";
  if (pct >= 80) return "Strong grasp.";
  if (pct >= 50) return "Getting there — a few gaps to close.";
  return "Rough spot — worth another pass before moving on.";
}

export function QuizSummary({
  topic,
  score,
  total,
  onRestart,
}: {
  topic: string;
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <p className="text-sm text-muted-foreground">
        Results for <span className="capitalize">{topic}</span>
      </p>
      <p className="font-serif text-5xl">
        {score}
        <span className="text-muted-foreground">/{total}</span>
      </p>
      <p className="text-sm font-medium">{verdict(pct)}</p>
      <div className="w-full max-w-xs">
        <Progress value={pct} indicatorClassName={pct >= 50 ? "bg-success" : "bg-destructive"} />
      </div>
      <Button variant="outline" onClick={onRestart} className="mt-2">
        <RotateCcw className="size-4" />
        Test me on something else
      </Button>
    </div>
  );
}
