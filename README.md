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
- Plan & Practice: a local [Ollama](https://ollama.com) model (`llama3.1:8b` by default) over its
  OpenAI-compatible API — free, no account, no API key. No web search locally, so resource
  entries are named but never carry a (possibly fake) URL
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

## Environment variables & local setup

`/plan` and `/practice` need [Ollama](https://ollama.com) running locally — free, no key:

```bash
ollama serve
ollama pull llama3.1:8b
```

If Ollama isn't reachable, both pillars fall back to clearly-labeled demo data automatically —
the app never pretends to have live data it doesn't. Override the model/host via `.env.local`
(see `.env.local.example`) if you're running a different model or a remote Ollama instance.

`/spar`'s live voice calls still need a paid `OPENAI_API_KEY` (no free/local equivalent wired up
yet — OpenAI's Realtime API is the only piece of this app that costs money):

```bash
cp .env.local.example .env.local
# then fill in OPENAI_API_KEY
```

## A known, accepted tradeoff

`data/app.db` is a plain SQLite file. On Vercel's serverless filesystem it resets on redeploy
and isn't shared across instances — fine for a demo that isn't trying to scale yet. If this ever
needs real multi-user persistence in production, swap `src/lib/db/client.ts` for a hosted
Postgres (e.g. Neon) — the schema and query code in `src/lib/db/` don't need to change, only the
driver.

## Deploying on Vercel

1. Push this repo, import it in Vercel.
2. Add `OPENAI_API_KEY` as an environment variable in the Vercel project settings (not committed).
3. Deploy. The Spar pillar's voice calls go straight from the browser to OpenAI; Vercel never
   proxies the audio.

**Caveat:** Ollama is a local process — a deployed Vercel instance has no local Ollama to reach,
so `/plan` and `/practice` will run in demo-fallback mode in production unless `OLLAMA_BASE_URL`
points at an Ollama instance reachable from the internet (e.g. one you run on your own server).
This is a real tradeoff of going fully free/local instead of a hosted API.
