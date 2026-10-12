# Mentor

A tutor built around three different jobs:

- **Plan** (`/plan`) — tell it a vague learning goal, it researches and maps a stage-by-stage path with real sources.
- **Practice** (`/practice`) — name a topic or paste your notes, it quizzes you and explains each answer.
- **Spar** (`/spar`) — describe a negotiation scenario, it plays the other person live, by voice, in real time.

No real accounts yet — the sidebar has a demo-user switcher (Maya / Devon / Priya) seeded with
sample history so the app is useful to click through without signing in.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4
- UI: a small hand-rolled component set (not shadcn's CLI output, but the same pattern — Radix
  primitives + CVA), in a warm/light "soft SaaS" theme deliberately avoiding the dark/gradient
  "AI app" look
- Plan & Practice: Claude (`@anthropic-ai/sdk`), with a web-search tool for grounded resource
  links on the Plan pillar
- Spar: OpenAI's Realtime API over WebRTC — the browser mic connects *directly* to OpenAI; the
  Next.js server only mints a short-lived token, so it isn't bound by serverless function
  duration limits
- Data: SQLite via Drizzle ORM, zero external accounts needed. `data/app.db` ships pre-seeded
  with the three demo users — clone and run, no setup step required

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo users and their sample history are
already seeded in the committed `data/app.db`. To re-seed from scratch:

```bash
rm data/app.db && npm run db:seed
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in what you want live:

```bash
cp .env.local.example .env.local
```

| Variable | Needed for | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | `/plan` and `/practice` real generation | Falls back to clearly-labeled demo data |
| `OPENAI_API_KEY` | `/spar` live voice calls | Shows a setup message instead of connecting |

Both pillars degrade gracefully without their key — the app never pretends to have live data it
doesn't.

## A known, accepted tradeoff

`data/app.db` is a plain SQLite file. On Vercel's serverless filesystem it resets on redeploy
and isn't shared across instances — fine for a demo that isn't trying to scale yet. If this ever
needs real multi-user persistence in production, swap `src/lib/db/client.ts` for a hosted
Postgres (e.g. Neon) — the schema and query code in `src/lib/db/` don't need to change, only the
driver.

## Deploying on Vercel

1. Push this repo, import it in Vercel.
2. Add `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as environment variables in the Vercel project
   settings (not committed — see above).
3. Deploy. The Spar pillar's voice calls go straight from the browser to OpenAI; Vercel never
   proxies the audio.
