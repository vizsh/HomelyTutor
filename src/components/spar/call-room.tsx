"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/lib/spar/use-realtime-call";

export function CallRoom({
  transcript,
  assistantSpeaking,
  muted,
  onToggleMute,
  onEnd,
}: {
  transcript: TranscriptLine[];
  assistantSpeaking: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex size-32 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-primary/10 transition-transform duration-700",
            assistantSpeaking && "scale-125",
          )}
        />
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full bg-primary transition-transform duration-300",
            assistantSpeaking && "scale-105",
          )}
        >
          <span className="font-serif text-2xl text-primary-foreground">?</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {assistantSpeaking ? "Speaking…" : "Listening"}
      </p>

      <div
        ref={scrollRef}
        className="flex max-h-72 w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
      >
        {transcript.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            The call transcript will appear here as you talk.
          </p>
        )}
        {transcript.map((line) => (
          <div
            key={line.id}
            className={cn(
              "max-w-[85%] rounded-xl px-3.5 py-2 text-sm",
              line.role === "assistant"
                ? "self-start bg-secondary text-secondary-foreground"
                : "self-end bg-primary text-primary-foreground",
            )}
          >
            {line.text || "…"}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={muted}
          className={cn(
            "flex size-14 items-center justify-center rounded-full border transition-colors",
            muted
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-card text-foreground hover:bg-secondary",
          )}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
          aria-label="End call"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
}
