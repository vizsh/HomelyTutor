"use client";

import { PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ScenarioForm({
  value,
  onChange,
  onStart,
  pending,
}: {
  value: string;
  onChange: (value: string) => void;
  onStart: (scenario: string) => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(28,25,23,0.04)] focus-within:border-ring/40">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I'm negotiating a raise. My manager is budget-conscious, likes data, and gets defensive if pushed too hard…"
          rows={4}
          disabled={pending}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-60"
        />
      </div>
      <Button
        onClick={() => value.trim() && onStart(value.trim())}
        disabled={!value.trim() || pending}
        size="lg"
        className="self-center"
      >
        <PhoneCall className="size-4" />
        {pending ? "Connecting…" : "Start the call"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Uses your microphone. The other side is AI, playing the scenario you
        describe — it&apos;ll push back and negotiate for real.
      </p>
    </div>
  );
}
