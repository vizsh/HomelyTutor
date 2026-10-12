"use client";

import { useState } from "react";
import { ArrowUp, Mic } from "lucide-react";

import { cn } from "@/lib/utils";

export function GoalForm({
  onSubmit,
  pending,
}: {
  onSubmit: (goal: string) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);

  function submit() {
    if (!value.trim() || pending) return;
    onSubmit(value.trim());
  }

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(28,25,23,0.04)] focus-within:border-ring/40">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="I want to learn negotiation, don't know where to start…"
        rows={1}
        disabled={pending}
        className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => setListening((v) => !v)}
        aria-pressed={listening}
        aria-label="Use voice instead"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
          listening
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Mic className="size-5" />
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || pending}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors disabled:opacity-30"
        aria-label="Plan it"
      >
        <ArrowUp className="size-5" />
      </button>
    </div>
  );
}
