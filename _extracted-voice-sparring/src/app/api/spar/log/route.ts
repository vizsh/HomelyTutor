import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/active-user";
import { saveSparSession } from "@/lib/db/queries";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const scenario = typeof body?.scenario === "string" ? body.scenario : "";
  const exchangeCount = typeof body?.exchangeCount === "number" ? body.exchangeCount : 0;

  if (!scenario) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = await getActiveUserId();
  saveSparSession(userId, scenario, exchangeCount);

  return NextResponse.json({ ok: true });
}
