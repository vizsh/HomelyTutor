import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/active-user";
import { getWeakQuizTopics } from "@/lib/db/queries";

export async function GET() {
  const userId = await getActiveUserId();
  const topics = getWeakQuizTopics(userId).map((t) => ({
    topic: t.topic,
    score: t.score,
    total: t.total,
  }));
  return NextResponse.json({ topics });
}
