export const DUMMY_USERS = [
  {
    id: "u-maya",
    name: "Maya",
    tagline: "Switching into web development",
    avatarInitials: "MA",
  },
  {
    id: "u-devon",
    name: "Devon",
    tagline: "Studying for CFA Level I",
    avatarInitials: "DV",
  },
  {
    id: "u-priya",
    name: "Priya",
    tagline: "Studying for a biology exam",
    avatarInitials: "PR",
  },
] as const;

export const DEFAULT_USER_ID = DUMMY_USERS[0].id;
export const ACTIVE_USER_COOKIE = "active_user_id";
