import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/active-user";
import { setTopicCompletion } from "@/lib/db/queries";

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const planId = typeof body?.planId === "string" ? body.planId : "";
  const periodId = typeof body?.periodId === "string" ? body.periodId : "";
  const topicId = typeof body?.topicId === "string" ? body.topicId : "";
  const completed = Boolean(body?.completed);

  if (!planId || !periodId || !topicId) {
    return NextResponse.json({ error: "Missing planId, periodId, or topicId." }, { status: 400 });
  }

  const userId = await getActiveUserId();
  const ok = setTopicCompletion(userId, planId, periodId, topicId, completed);
  if (!ok) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
