import type { LucideIcon } from "lucide-react";
import { Compass, ListChecks, History, Home } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plan", label: "Learning paths", icon: Compass },
  { href: "/practice", label: "Practice tests", icon: ListChecks },
  { href: "/history", label: "Progress", icon: History },
];
