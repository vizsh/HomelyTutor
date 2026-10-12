# Voice Sparring — extracted

This is the real-time voice negotiation/roleplay pillar, pulled out of the Mentor
project on 2026-10-13 to become its own standalone product. These are the source
files as they stood at extraction time — this folder is a snapshot for safekeeping,
not a runnable app on its own.

## What it did

Describe a scenario (e.g. "negotiating a raise with a budget-conscious manager"),
and the AI plays the other person live, by voice, in real time — then gives
post-call coaching based on the actual transcript.

## Architecture (the part worth keeping)

- **Real duplex voice via WebRTC**, not a simulation. The browser's mic connects
  **directly** to OpenAI's Realtime API — the Next.js server only mints a
  short-lived ephemeral token (`src/app/api/spar/session/route.ts`). This means
  the audio stream is never proxied through your server, so it isn't bound by
  serverless function duration limits. See `src/lib/spar/use-realtime-call.ts`
  for the full WebRTC offer/answer exchange and data-channel event handling.
- **Persona from plain text**: `src/lib/spar/persona.ts` builds the system
  instructions by template-wrapping whatever scenario the user typed — no extra
  LLM round-trip needed to construct a character.
- **Post-call coaching**: `src/app/api/spar/coach/route.ts` sends the real
  transcript to an LLM afterward for short, specific feedback (not a score).

## What it needs to run again as its own project

- `OPENAI_API_KEY` — OpenAI's Realtime API has no free tier; this is the one
  piece of the original project that cost real money.
- Optional: `OPENAI_REALTIME_MODEL` (default `gpt-realtime-2.1`),
  `OPENAI_REALTIME_VOICE` (default `marin`).
- Shared UI primitives it depended on from the parent project (not copied here,
  since a new project may want its own design system): a `Button` component, a
  `cn()` classname-merge utility, an `AppShell` layout wrapper, and Tailwind
  tokens for `--primary`, `--secondary`, `--destructive`, `--success`, `--card`,
  `--border`, etc.
- A way to persist session summaries if you want history — the original stored
  rows like this (Drizzle/SQLite shape, adapt freely):

  ```ts
  export const sparSessions = sqliteTable("spar_sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    scenario: text("scenario").notNull(),
    exchangeCount: integer("exchange_count").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  });
  ```

## Known rough edges worth fixing in the standalone version

- Transcript parsing in `use-realtime-call.ts` is deliberately best-effort — the
  Realtime API's exact event names have shifted across versions, and the code
  only handles the well-known shapes. The call's audio works regardless; only
  the on-screen transcript captions could silently stay blank if OpenAI changes
  event naming again.
- No barge-in tuning beyond the SDK default, no negotiation concession
  state-machine — both were deliberately deferred as "chasing the last 10%."
