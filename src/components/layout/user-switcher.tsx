"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckIcon,
} from "@/components/ui/dropdown-menu";
import { DUMMY_USERS, DEFAULT_USER_ID, ACTIVE_USER_COOKIE } from "@/lib/db/dummy-users";

function readActiveUserId() {
  if (typeof document === "undefined") return DEFAULT_USER_ID;
  const match = document.cookie.match(new RegExp(`${ACTIVE_USER_COOKIE}=([^;]+)`));
  const id = match?.[1];
  return DUMMY_USERS.some((u) => u.id === id) ? id! : DEFAULT_USER_ID;
}

export function UserSwitcher() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string>(DEFAULT_USER_ID);

  useEffect(() => {
    // Deliberately deferred to an effect: the server always renders the
    // default user (no cookie access during SSR), so reading the real
    // cookie on the client's first render would mismatch the SSR output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(readActiveUserId());
  }, []);

  const active = DUMMY_USERS.find((u) => u.id === activeId) ?? DUMMY_USERS[0];

  async function switchTo(userId: string) {
    if (userId === activeId) return;
    await fetch("/api/user/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setActiveId(userId);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary">
          <Avatar>
            <AvatarFallback>{active.avatarInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium leading-tight">{active.name}</p>
            <p className="truncate text-xs text-muted-foreground">{active.tagline}</p>
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch demo user</DropdownMenuLabel>
        {DUMMY_USERS.map((user) => (
          <DropdownMenuItem key={user.id} onClick={() => switchTo(user.id)}>
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{user.avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium leading-tight">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.tagline}</p>
            </div>
            {user.id === activeId && <DropdownMenuCheckIcon className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="opacity-60">
          <Settings className="size-4" />
          No real accounts — demo users only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
