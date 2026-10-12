import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { DUMMY_USERS } from "@/lib/db/dummy-users";
import { ACTIVE_USER_COOKIE } from "@/lib/active-user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const userId = typeof body?.userId === "string" ? body.userId : "";

  if (!DUMMY_USERS.some((u) => u.id === userId)) {
    return NextResponse.json({ error: "Unknown user" }, { status: 400 });
  }

  const store = await cookies();
  store.set(ACTIVE_USER_COOKIE, userId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
