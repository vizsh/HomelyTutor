# Mentor

A tutor built around two jobs:

- **Plan** (`/plan`) — tell it a goal and exam date, it builds a real study calendar: real named
  topics (not generic placeholders), real syllabus domains and exam weightings when the exam has
  a known structure (a professional cert, a board exam), scaled to the actual scope — a unit test
  gets a tight one-week plan, a year-out certification gets a sensibly-grouped multi-month one.
- **Practice** (`/practice`) — name a topic or paste your notes, it quizzes you and explains each
  answer.

No real accounts — the sidebar has a demo-user switcher (Maya / Devon / Priya) seeded with sample
history so the app is useful to click through without signing in.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4
- UI: a small hand-rolled component set (not shadcn's CLI output, but the same pattern — Radix
  primitives + CVA), in a warm/light "soft SaaS" theme deliberately avoiding the dark/gradient
  "AI app" look
- A local [Ollama](https://ollama.com) model (`llama3.1:8b` by default) over its OpenAI-compatible
  API — free, no account, no API key, no cost ever. No web search locally, so resource entries
  are named (real textbooks, real course names) but never carry a (possibly fake) URL
- Data: SQLite via Drizzle ORM, zero external accounts needed. `data/app.db` ships pre-seeded
  with the three demo users — clone and run, no setup step required

## Getting started

```bash
ollama serve
ollama pull llama3.1:8b
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo users and their sample history are
already seeded in the committed `data/app.db`. To re-seed from scratch:

```bash
rm data/app.db && npm run db:seed
```

If Ollama isn't running, both pillars fall back to clearly-labeled demo placeholder data instead
of pretending to have real output — look for the "Demo data" banner. Override the model/host via
`.env.local` (see `.env.local.example`) if you're running a different model or a remote instance.

## A known, accepted tradeoff

`data/app.db` is a plain SQLite file — perfect for one person running this locally, not built for
concurrent multi-user production use. On Vercel's serverless filesystem it also resets on
redeploy. If this ever needs real durable multi-user persistence, swap `src/lib/db/client.ts` for
a hosted Postgres (e.g. Neon) — the schema and query code in `src/lib/db/` don't need to change,
only the driver.

Likewise, Ollama is a local process — a deployed Vercel instance has no local Ollama to reach, so
`/plan` and `/practice` will run in demo-fallback mode in production unless `OLLAMA_BASE_URL`
points at an Ollama instance reachable from the internet. This project is built to be run locally
for yourself first; a real hosted deployment is a separate, later step.
