import { NextResponse } from "next/server";

import { quizToolSchema } from "@/lib/practice/quiz-schema";
import { generateMockQuiz } from "@/lib/practice/generate-mock-quiz";
import type { QuizSet } from "@/lib/practice/types";
import { ollama, isOllamaAvailable, OLLAMA_MODEL, extractToolArguments } from "@/lib/llm/ollama-client";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a quiz writer inside a study app. Given a topic, or notes the learner pasted in, write a multiple-choice quiz that genuinely tests understanding, not trivia recall.

Rules:
- If the input looks like pasted notes/material, write questions grounded in that material specifically.
- If it's just a topic name, write questions covering the core, load-bearing ideas a competent learner would need to know.
- Exactly 4 options per question, one correct. Distractors should be plausible, not jokes.
- Never use "all of the above" or "none of the above".
- Write a short, direct explanation for the correct answer.
- 5-8 questions, ordered roughly easy to hard.
- Call emit_quiz exactly once with the full set.`;

export async function POST(req: Request) {
  let topic: string;
  try {
    const body = await req.json();
    topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!topic || topic.length > 6000) {
    return NextResponse.json(
      { error: "Topic/notes must be a non-empty string under 6000 characters." },
      { status: 400 },
    );
  }

  if (!(await isOllamaAvailable())) {
    const quiz = await generateMockQuiz(topic);
    return NextResponse.json({ quiz, mocked: true, reason: "ollama_unavailable" });
  }

  async function attempt(): Promise<QuizSet | null> {
    const response = await ollama.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Topic or notes:\n\n${topic}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: quizToolSchema.name,
            description: quizToolSchema.description,
            parameters: quizToolSchema.input_schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: quizToolSchema.name } },
    });

    const quiz = extractToolArguments<QuizSet>(response.choices[0]?.message ?? {}, quizToolSchema.name);
    return quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz : null;
  }

  // One retry costs nothing (free, local compute) and meaningfully improves
  // the odds of real output over demo-fallback when the model's first
  // attempt comes back malformed.
  for (let i = 0; i < 2; i++) {
    try {
      const quiz = await attempt();
      if (quiz) return NextResponse.json({ quiz, mocked: false });
    } catch (err) {
      console.error(`quiz generation attempt ${i} failed`, err);
    }
  }

  const quiz = await generateMockQuiz(topic);
  return NextResponse.json({ quiz, mocked: true, reason: "generation_failed" });
}
