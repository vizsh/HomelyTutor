import type { LucideIcon } from "lucide-react";
import { Compass, ListChecks, Mic, History, Home } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plan", label: "Learning paths", icon: Compass },
  { href: "/practice", label: "Practice tests", icon: ListChecks },
  { href: "/spar", label: "Voice sparring", icon: Mic },
  { href: "/history", label: "Progress", icon: History },
];
