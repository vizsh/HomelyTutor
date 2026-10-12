"use client";

import { useCallback, useRef, useState } from "react";

export type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error";

export type TranscriptLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
};

export function useRealtimeCall() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const upsertLine = useCallback(
    (id: string, role: TranscriptLine["role"], deltaOrText: string, final: boolean, append: boolean) => {
      setTranscript((lines) => {
        const idx = lines.findIndex((l) => l.id === id);
        if (idx === -1) {
          return [...lines, { id, role, text: deltaOrText, final }];
        }
        const next = [...lines];
        next[idx] = {
          ...next[idx],
          text: append ? next[idx].text + deltaOrText : deltaOrText,
          final,
        };
        return next;
      });
    },
    [],
  );

  const handleEvent = useCallback(
    (raw: string) => {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(raw);
      } catch {
        return;
      }
      const type = typeof event.type === "string" ? event.type : "";

      // Best-effort: the Realtime API's exact event names have shifted across
      // versions. We handle the well-known shapes and otherwise degrade
      // gracefully — the call's audio works regardless of whether we parse
      // every transcript event correctly.
      if (type.includes("output_audio") || type.includes("audio_transcript")) {
        if (type.endsWith(".delta") && typeof event.delta === "string") {
          const id = typeof event.item_id === "string" ? event.item_id : "assistant-current";
          setAssistantSpeaking(true);
          upsertLine(id, "assistant", event.delta, false, true);
        } else if (type.endsWith(".done")) {
          const id = typeof event.item_id === "string" ? event.item_id : "assistant-current";
          const text = typeof event.transcript === "string" ? event.transcript : undefined;
          if (text) upsertLine(id, "assistant", text, true, false);
          setAssistantSpeaking(false);
        }
        return;
      }

      if (type.includes("input_audio_transcription")) {
        if (type.endsWith(".completed") || type.endsWith(".done")) {
          const id = typeof event.item_id === "string" ? event.item_id : crypto.randomUUID();
          const text = typeof event.transcript === "string" ? event.transcript : "";
          if (text) upsertLine(id, "user", text, true, false);
        }
        return;
      }

      if (type === "response.done" || type === "response.completed") {
        setAssistantSpeaking(false);
      }

      if (type === "error") {
        const message =
          typeof event.error === "object" && event.error && "message" in event.error
            ? String((event.error as { message?: unknown }).message)
            : "Realtime session reported an error.";
        setError(message);
      }
    },
    [upsertLine],
  );

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
  }, []);

  const start = useCallback(
    async (scenario: string) => {
      setStatus("connecting");
      setError(null);
      setTranscript([]);

      try {
        const tokenRes = await fetch("/api/spar/session", { method: "POST" });
        const tokenBody = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokenBody?.error ?? "Couldn't start a live voice session.");
        }
        const clientSecret: string = tokenBody.clientSecret;
        const model: string = tokenBody.model;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioElRef.current = audioEl;
        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0];
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;
        dc.addEventListener("message", (e) => handleEvent(e.data));
        dc.addEventListener("open", async () => {
          const { buildPersonaInstructions } = await import("./persona");
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: { instructions: buildPersonaInstructions(scenario) },
            }),
          );
          dc.send(JSON.stringify({ type: "response.create" }));
          setStatus("connected");
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpRes = await fetch(
          `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clientSecret}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          },
        );

        if (!sdpRes.ok) {
          throw new Error("Couldn't connect the live call. Try again.");
        }

        const answerSdp = await sdpRes.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't start the call.");
        setStatus("error");
        cleanup();
      }
    },
    [handleEvent, cleanup],
  );

  const end = useCallback(() => {
    cleanup();
    setStatus("ended");
    setAssistantSpeaking(false);
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const nextMuted = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    setMuted(nextMuted);
  }, [muted]);

  return { status, error, muted, transcript, assistantSpeaking, start, end, toggleMute };
}
