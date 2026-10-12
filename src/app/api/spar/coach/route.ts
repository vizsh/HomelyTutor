import { NextResponse } from "next/server";

import { ollama, isOllamaAvailable, OLLAMA_MODEL } from "@/lib/llm/ollama-client";

export const maxDuration = 30;

type TranscriptLine = { role: "user" | "assistant"; text: string };

const SYSTEM_PROMPT = `You just watched a transcript of a live negotiation role-play practice session. The "assistant" lines are the AI playing a counterpart; the "user" lines are the learner practicing.

Give the learner short, direct coaching — not a score, not a rubric. In plain prose, 3-4 sentences max:
- One specific thing they did well, referencing what they actually said.
- One specific thing to improve next time, referencing what they actually said.
- Skip generic advice ("communicate clearly") in favor of something tied to this actual exchange.

If the transcript is too short or thin to say anything specific, say that plainly instead of inventing feedback. Respond with the coaching text only, no preamble.`;

function mockCoaching(transcriptLen: number) {
  if (transcriptLen === 0) {
    return "No transcript came through for that call, so there's nothing specific to coach on — try again and keep talking for a bit longer.";
  }
  return "Demo feedback — Ollama isn't reachable right now, so this is a placeholder instead of coaching based on what you actually said.";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const scenario = typeof body?.scenario === "string" ? body.scenario : "";
  const transcript = Array.isArray(body?.transcript) ? (body.transcript as TranscriptLine[]) : [];

  if (transcript.length === 0) {
    return NextResponse.json({ coaching: mockCoaching(0), mocked: false });
  }

  if (!(await isOllamaAvailable())) {
    return NextResponse.json({ coaching: mockCoaching(transcript.length), mocked: true });
  }

  try {
    const transcriptText = transcript
      .map((l) => `${l.role === "assistant" ? "Counterpart" : "Learner"}: ${l.text}`)
      .join("\n");

    const response = await ollama.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Scenario: ${scenario}\n\nTranscript:\n${transcriptText}` },
      ],
    });

    const coaching = response.choices[0]?.message?.content?.trim();
    return NextResponse.json({ coaching: coaching || mockCoaching(transcript.length), mocked: !coaching });
  } catch (err) {
    console.error("coaching generation failed", err);
    return NextResponse.json({ coaching: mockCoaching(transcript.length), mocked: true });
  }
}
