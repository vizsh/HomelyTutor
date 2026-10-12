import type { QuizSet } from "./types";

export type GenerateQuizResult = {
  quiz: QuizSet;
  mocked: boolean;
};

export async function generateQuiz(topic: string): Promise<GenerateQuizResult> {
  const res = await fetch("/api/practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to generate a quiz.");
  }

  return res.json();
}
