import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function ModeCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-ring/30 hover:shadow-[0_4px_16px_rgba(28,25,23,0.06)]"
    >
      <div
        className="flex size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: accent }}
      >
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-serif text-base">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Start <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
