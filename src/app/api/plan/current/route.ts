import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/active-user";
import { getLatestPlanRecord } from "@/lib/db/queries";

export async function GET() {
  const userId = await getActiveUserId();
  const record = getLatestPlanRecord(userId);
  return NextResponse.json({ id: record?.id ?? null, plan: record?.plan ?? null });
}
