"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListChecks, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { TopicForm } from "@/components/practice/topic-form";
import { QuestionCard } from "@/components/practice/question-card";
import { QuizSummary } from "@/components/practice/quiz-summary";
import { generateQuiz } from "@/lib/practice/generate-quiz";
import type { QuizSet } from "@/lib/practice/types";
import { Progress } from "@/components/ui/progress";

type Stage = "idle" | "loading" | "quiz" | "summary";

function PracticeInner() {
  const searchParams = useSearchParams();
  const prefillTopic = searchParams.get("topic") ?? "";

  const [stage, setStage] = useState<Stage>("idle");
  const [quiz, setQuiz] = useState<QuizSet | null>(null);
  const [mocked, setMocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  async function handleSubmit(topic: string) {
    setStage("loading");
    setError(null);
    try {
      const result = await generateQuiz(topic);
      setQuiz(result.quiz);
      setMocked(result.mocked);
      setCurrentIndex(0);
      setCorrectCount(0);
      setStage("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("idle");
    }
  }

  // Arriving from a Plan stage's "Test me on this" link — skip straight to
  // generating instead of making the user retype what they just clicked.
  useEffect(() => {
    if (prefillTopic) {
      // Triggers a real fetch (quiz generation), not just local state sync —
      // the lint rule can't tell that apart from a plain setState-in-effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSubmit(prefillTopic);
    }
  }, [prefillTopic]);

  function handleAnswered(correct: boolean) {
    if (correct) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (!quiz) return;
    if (currentIndex + 1 >= quiz.questions.length) {
      setStage("summary");
      fetch("/api/practice/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz, score: correctCount, mocked }),
      }).catch(() => {});
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function reset() {
    setStage("idle");
    setQuiz(null);
    setError(null);
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-16 pb-10 md:pt-24">
        {stage === "idle" && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-secondary">
                <ListChecks className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-3xl leading-tight md:text-4xl">
                What should I test you on?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Name a topic, or paste in your own notes to be quizzed on
                them specifically.
              </p>
            </div>
            <TopicForm onSubmit={handleSubmit} pending={false} />
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {stage === "loading" && (
          <div className="flex flex-col gap-3 py-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-secondary/60"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
            <p className="text-center text-sm text-muted-foreground">
              Writing your quiz…
            </p>
          </div>
        )}

        {stage === "quiz" && quiz && (
          <div className="flex flex-col gap-6">
            {mocked && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent-foreground">
                Demo data — make sure{" "}
                <code className="rounded bg-accent/20 px-1 py-0.5 text-xs">ollama serve</code>{" "}
                is running locally to generate a real quiz on your topic.
              </div>
            )}
            <Progress value={(currentIndex / quiz.questions.length) * 100} />
            <QuestionCard
              key={quiz.questions[currentIndex].id}
              question={quiz.questions[currentIndex]}
              index={currentIndex}
              total={quiz.questions.length}
              onAnswered={handleAnswered}
              onNext={handleNext}
              isLast={currentIndex + 1 === quiz.questions.length}
            />
          </div>
        )}

        {stage === "summary" && quiz && (
          <QuizSummary
            topic={quiz.topic}
            score={correctCount}
            total={quiz.questions.length}
            onRestart={reset}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeInner />
    </Suspense>
  );
}
