import { randomUUID } from "node:crypto";

import { db } from "./client";
import { users, learningPlans, quizAttempts, sparSessions } from "./schema";
import { DUMMY_USERS } from "./dummy-users";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function webDevPlanStages() {
  return JSON.stringify([
    {
      id: "foundations",
      title: "HTML & CSS foundations",
      summary: "Structure and style a page from scratch, no frameworks yet.",
      durationLabel: "Week 1",
      resources: [
        { kind: "docs", label: "MDN Web Docs" },
        { kind: "practice", label: "Build a static landing page" },
      ],
    },
    {
      id: "javascript",
      title: "JavaScript fundamentals",
      summary: "Variables, functions, the DOM, and events — the parts you'll use constantly.",
      durationLabel: "Weeks 2-3",
      resources: [
        { kind: "course", label: "freeCodeCamp JS course" },
        { kind: "practice", label: "Build a small interactive widget" },
      ],
    },
    {
      id: "react",
      title: "React basics",
      summary: "Components, props, state — enough to build a real small app.",
      durationLabel: "Weeks 4-5",
      resources: [
        { kind: "docs", label: "react.dev" },
        { kind: "practice", label: "Rebuild the landing page as components" },
      ],
    },
  ]);
}

function negotiationPlanStages() {
  return JSON.stringify([
    {
      id: "foundations",
      title: "Negotiation fundamentals",
      summary: "Anchoring, BATNA, and why the first number matters.",
      durationLabel: "Week 1",
      resources: [{ kind: "book", label: "Never Split the Difference" }],
    },
    {
      id: "practice",
      title: "Practice live, out loud",
      summary: "Reading tone and pacing only comes from doing it, not reading about it.",
      durationLabel: "Ongoing",
      resources: [{ kind: "practice", label: "Voice sparring sessions in this app" }],
    },
  ]);
}

function biologyPlanStages() {
  return JSON.stringify([
    {
      id: "cell-structure",
      title: "Cell structure & function",
      summary: "Organelles and what each one actually does.",
      durationLabel: "Week 1",
      resources: [{ kind: "docs", label: "Khan Academy — Cell biology" }],
    },
    {
      id: "respiration",
      title: "Cellular respiration",
      summary: "Glycolysis, Krebs cycle, electron transport chain.",
      durationLabel: "Week 2",
      resources: [{ kind: "video", label: "Crash Course Biology" }],
    },
  ]);
}

export function seedIfEmpty() {
  const existing = db.select().from(users).all();
  if (existing.length > 0) return;

  db.insert(users).values([...DUMMY_USERS]).run();

  const [maya, devon, priya] = DUMMY_USERS;

  db.insert(learningPlans)
    .values([
      {
        id: randomUUID(),
        userId: maya.id,
        goal: "web development",
        totalDurationLabel: "~5 weeks to first project",
        stagesJson: webDevPlanStages(),
        mocked: true,
        createdAt: daysAgo(12),
      },
      {
        id: randomUUID(),
        userId: devon.id,
        goal: "salary negotiation",
        totalDurationLabel: "~1 week + ongoing practice",
        stagesJson: negotiationPlanStages(),
        mocked: true,
        createdAt: daysAgo(6),
      },
      {
        id: randomUUID(),
        userId: priya.id,
        goal: "cell biology",
        totalDurationLabel: "~2 weeks",
        stagesJson: biologyPlanStages(),
        mocked: true,
        createdAt: daysAgo(9),
      },
    ])
    .run();

  db.insert(quizAttempts)
    .values([
      { id: randomUUID(), userId: maya.id, topic: "HTML & CSS basics", score: 4, total: 5, mocked: true, createdAt: daysAgo(10) },
      { id: randomUUID(), userId: maya.id, topic: "JavaScript fundamentals", score: 3, total: 5, mocked: true, createdAt: daysAgo(4) },
      { id: randomUUID(), userId: devon.id, topic: "Negotiation fundamentals", score: 4, total: 5, mocked: true, createdAt: daysAgo(5) },
      { id: randomUUID(), userId: priya.id, topic: "Cell structure", score: 2, total: 5, mocked: true, createdAt: daysAgo(8) },
      { id: randomUUID(), userId: priya.id, topic: "Cell structure", score: 3, total: 5, mocked: true, createdAt: daysAgo(5) },
      { id: randomUUID(), userId: priya.id, topic: "Cellular respiration", score: 5, total: 5, mocked: true, createdAt: daysAgo(1) },
    ])
    .run();

  db.insert(sparSessions)
    .values([
      {
        id: randomUUID(),
        userId: devon.id,
        scenario: "Negotiating a raise with a budget-conscious, data-driven manager.",
        exchangeCount: 14,
        createdAt: daysAgo(5),
      },
      {
        id: randomUUID(),
        userId: devon.id,
        scenario: "Negotiating a raise, second attempt — manager pushes back harder this time.",
        exchangeCount: 19,
        createdAt: daysAgo(2),
      },
    ])
    .run();

  console.log("Seeded dummy users and sample history.");
}

seedIfEmpty();
