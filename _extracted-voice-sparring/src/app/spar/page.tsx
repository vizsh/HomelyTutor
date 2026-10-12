"use client";

import { useState } from "react";
import { Mic, TriangleAlert, RotateCcw, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ScenarioForm } from "@/components/spar/scenario-form";
import { CallRoom } from "@/components/spar/call-room";
import { Button } from "@/components/ui/button";
import { useRealtimeCall } from "@/lib/spar/use-realtime-call";

export default function SparPage() {
  const { status, error, muted, transcript, assistantSpeaking, start, end, toggleMute } =
    useRealtimeCall();
  const [scenario, setScenario] = useState("");
  const [coaching, setCoaching] = useState<string | null>(null);
  const [coachingPending, setCoachingPending] = useState(false);

  function handleEnd() {
    end();
    fetch("/api/spar/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, exchangeCount: transcript.length }),
    }).catch(() => {});

    setCoachingPending(true);
    fetch("/api/spar/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario,
        transcript: transcript.map((l) => ({ role: l.role, text: l.text })),
      }),
    })
      .then((res) => res.json())
      .then((data) => setCoaching(data.coaching ?? null))
      .catch(() => setCoaching(null))
      .finally(() => setCoachingPending(false));
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-16 pb-10 md:pt-24">
        {(status === "idle" || status === "error") && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-secondary">
                <Mic className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-3xl leading-tight md:text-4xl">
                Describe the scenario
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Who are you talking to, and what are you negotiating?
                I&apos;ll play that person, live, by voice.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <ScenarioForm
              value={scenario}
              onChange={setScenario}
              onStart={start}
              pending={false}
            />
          </>
        )}

        {status === "connecting" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-16 animate-pulse rounded-full bg-secondary" />
            <p className="text-sm text-muted-foreground">Connecting the call…</p>
          </div>
        )}

        {status === "connected" && (
          <CallRoom
            transcript={transcript}
            assistantSpeaking={assistantSpeaking}
            muted={muted}
            onToggleMute={toggleMute}
            onEnd={handleEnd}
          />
        )}

        {status === "ended" && (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <p className="font-serif text-2xl">Call ended</p>
            <p className="text-sm text-muted-foreground">
              {transcript.length > 0
                ? `${transcript.length} exchanges — nice work staying in it.`
                : "No transcript captured for that call."}
            </p>

            <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="size-4" />
                Coaching notes
              </div>
              {coachingPending && (
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-5/6 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                </div>
              )}
              {!coachingPending && coaching && (
                <p className="text-sm leading-relaxed">{coaching}</p>
              )}
              {!coachingPending && !coaching && (
                <p className="text-sm text-muted-foreground">
                  Coaching notes couldn&apos;t be generated for this call.
                </p>
              )}
            </div>

            <Button variant="outline" onClick={() => window.location.reload()}>
              <RotateCcw className="size-4" />
              Start another scenario
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
