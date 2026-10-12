import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { quizToolSchema } from "@/lib/practice/quiz-schema";
import { generateMockQuiz } from "@/lib/practice/generate-mock-quiz";
import type { QuizSet } from "@/lib/practice/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a quiz writer inside a study app. Given a topic, or notes the learner pasted in, write a multiple-choice quiz that genuinely tests understanding, not trivia recall.

Rules:
- If the input looks like pasted notes/material, write questions grounded in that material specifically.
- If it's just a topic name, write questions covering the core, load-bearing ideas a competent learner would need to know.
- Exactly 4 options per question, one correct. Distractors should be plausible, not jokes.
- Never use "all of the above" or "none of the above".
- Write a short, direct explanation for the correct answer.
- 5-8 questions, ordered roughly easy to hard.
- When ready, call emit_quiz exactly once with the full set. Do not respond with plain text.`;

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const quiz = await generateMockQuiz(topic);
    return NextResponse.json({ quiz, mocked: true });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Topic or notes:\n\n${topic}` }],
      tools: [
        {
          name: quizToolSchema.name,
          description: quizToolSchema.description,
          input_schema: quizToolSchema.input_schema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use" && block.name === quizToolSchema.name,
    );

    if (!toolUse) {
      const quiz = await generateMockQuiz(topic);
      return NextResponse.json({ quiz, mocked: true, reason: "model_did_not_emit_quiz" });
    }

    const quiz = toolUse.input as QuizSet;
    return NextResponse.json({ quiz, mocked: false });
  } catch (err) {
    console.error("quiz generation failed", err);
    const quiz = await generateMockQuiz(topic);
    return NextResponse.json({ quiz, mocked: true, reason: "generation_error" });
  }
}
