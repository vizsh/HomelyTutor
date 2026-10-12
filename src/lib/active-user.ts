import { cookies } from "next/headers";

import { DUMMY_USERS, DEFAULT_USER_ID, ACTIVE_USER_COOKIE } from "@/lib/db/dummy-users";

export { ACTIVE_USER_COOKIE };

export async function getActiveUser() {
  const store = await cookies();
  const id = store.get(ACTIVE_USER_COOKIE)?.value ?? DEFAULT_USER_ID;
  return DUMMY_USERS.find((u) => u.id === id) ?? DUMMY_USERS[0];
}

export async function getActiveUserId() {
  const store = await cookies();
  const id = store.get(ACTIVE_USER_COOKIE)?.value ?? DEFAULT_USER_ID;
  return DUMMY_USERS.some((u) => u.id === id) ? id : DEFAULT_USER_ID;
}
