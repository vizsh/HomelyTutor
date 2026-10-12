import type { Priority } from "./types";

export const priorityStyle: Record<
  Priority,
  { label: string; dot: string; badge: string; bar: string }
> = {
  high: {
    label: "High priority",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    bar: "bg-primary",
  },
  medium: {
    label: "Medium priority",
    dot: "bg-accent",
    badge: "bg-accent/15 text-accent-foreground border-accent/30",
    bar: "bg-accent",
  },
  low: {
    label: "Low priority",
    dot: "bg-muted-foreground",
    badge: "bg-secondary text-muted-foreground border-transparent",
    bar: "bg-muted-foreground",
  },
};
