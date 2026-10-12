import { NextResponse } from "next/server";

export const maxDuration = 30;

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || "marin";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Voice sparring needs a live connection — add OPENAI_API_KEY to your environment to enable it.",
      },
      { status: 501 },
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          audio: { output: { voice: REALTIME_VOICE } },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("realtime client_secrets failed", res.status, text);
      return NextResponse.json(
        { error: "Couldn't start a live voice session. Try again in a moment." },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ clientSecret: data.value, model: REALTIME_MODEL });
  } catch (err) {
    console.error("realtime session mint failed", err);
    return NextResponse.json(
      { error: "Couldn't start a live voice session. Try again in a moment." },
      { status: 502 },
    );
  }
}
