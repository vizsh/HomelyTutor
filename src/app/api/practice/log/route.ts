import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/active-user";
import { saveQuizAttempt } from "@/lib/db/queries";
import type { QuizSet } from "@/lib/practice/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const quiz = body?.quiz as QuizSet | undefined;
  const score = body?.score;
  const mocked = Boolean(body?.mocked);

  if (!quiz || typeof score !== "number" || !Array.isArray(quiz.questions)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = await getActiveUserId();
  saveQuizAttempt(userId, quiz, score, mocked);

  return NextResponse.json({ ok: true });
}
