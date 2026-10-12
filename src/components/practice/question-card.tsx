"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import type { QuizQuestion } from "@/lib/practice/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function QuestionCard({
  question,
  index,
  total,
  onAnswered,
  onNext,
  isLast,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    onAnswered(i === question.correctIndex);
  }

  const answered = selected !== null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Question {index + 1} of {total}
      </p>
      <h2 className="font-serif text-xl leading-snug">{question.question}</h2>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;

          let stateClass = "border-border hover:border-ring/40 hover:bg-secondary/40";
          if (answered && isCorrect) {
            stateClass = "border-success bg-success/10 text-foreground";
          } else if (answered && isSelected && !isCorrect) {
            stateClass = "border-destructive bg-destructive/10 text-foreground";
          } else if (answered) {
            stateClass = "border-border opacity-60";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={answered}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
                stateClass,
              )}
            >
              {option}
              {answered && isCorrect && (
                <Check className="size-4 shrink-0 text-success" />
              )}
              {answered && isSelected && !isCorrect && (
                <X className="size-4 shrink-0 text-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
          {question.explanation}
        </div>
      )}

      {answered && (
        <Button onClick={onNext} className="self-end">
          {isLast ? "See results" : "Next question"}
        </Button>
      )}
    </div>
  );
}
