import { randomUUID } from "node:crypto";

import { db } from "./client";
import { users, learningPlans, quizAttempts, sparSessions } from "./schema";
import { DUMMY_USERS } from "./dummy-users";
import { computePeriods, daysBetween } from "@/lib/plan/periods";
import type { LearningPlan, PlanPeriod, PlanTopic, Priority, StudyDays } from "@/lib/plan/types";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function topic(
  id: string,
  title: string,
  summary: string,
  priority: Priority,
  estimatedHours: number,
  resources: PlanTopic["resources"],
): PlanTopic {
  return { id, title, summary, priority, estimatedHours, resources };
}

function buildPlan(opts: {
  goal: string;
  examName: string;
  targetDaysOut: number;
  hoursPerDay: number;
  studyDays: StudyDays;
  periodTopics: PlanTopic[][];
  milestones?: Record<number, string>;
}): LearningPlan {
  const today = new Date();
  const target = daysFromNow(opts.targetDaysOut);
  const slots = computePeriods(today, target, opts.studyDays);

  const periods: PlanPeriod[] = slots.map((slot, i) => ({
    id: slot.id,
    label: slot.label,
    dateRangeLabel: slot.dateRangeLabel,
    startDate: slot.startDate,
    endDate: slot.endDate,
    topics: opts.periodTopics[i] ?? [],
    milestone: opts.milestones?.[i],
  }));

  const allTopics = periods.flatMap((p) => p.topics);
  const priorityBreakdown = { high: 0, medium: 0, low: 0 };
  for (const t of allTopics) priorityBreakdown[t.priority] += t.estimatedHours;

  return {
    goal: opts.goal,
    examName: opts.examName,
    targetDate: target.toISOString(),
    daysRemaining: daysBetween(today, target),
    hoursPerDay: opts.hoursPerDay,
    studyDays: opts.studyDays,
    totalStudyHours: allTopics.reduce((s, t) => s + t.estimatedHours, 0),
    priorityBreakdown,
    periods,
  };
}

function webDevPlan(): LearningPlan {
  return buildPlan({
    goal: "switching into web development",
    examName: "Web Development Foundations",
    targetDaysOut: 35,
    hoursPerDay: 2,
    studyDays: "daily",
    periodTopics: [
      [
        topic("t1", "HTML structure & semantics", "Markup that actually describes the content, not just divs everywhere.", "high", 6, [
          { kind: "docs", label: "MDN: HTML basics" },
        ]),
        topic("t2", "CSS layout (flexbox & grid)", "The two layout systems that cover almost everything you'll need.", "high", 7, [
          { kind: "practice", label: "Build a static landing page" },
        ]),
      ],
      [
        topic("t3", "JavaScript fundamentals", "Variables, functions, control flow — the parts used constantly.", "high", 8, [
          { kind: "course", label: "freeCodeCamp JS course" },
        ]),
        topic("t4", "The DOM & events", "Making a page actually respond to clicks and input.", "medium", 6, [
          { kind: "practice", label: "Build a small interactive widget" },
        ]),
      ],
      [
        topic("t5", "React components & props", "The mental model that unlocks everything else in React.", "high", 7, [
          { kind: "docs", label: "react.dev — Learn React" },
        ]),
        topic("t6", "State & hooks", "useState and useEffect, and when you actually need them.", "medium", 6, [
          { kind: "practice", label: "Rebuild the landing page as components" },
        ]),
      ],
      [
        topic("t7", "First real project", "Combine everything into one small complete app.", "high", 10, [
          { kind: "practice", label: "Guided project walkthrough" },
        ]),
      ],
      [
        topic("t8", "Polish & deploy", "Get it actually live somewhere, not just on your machine.", "medium", 5, [
          { kind: "docs", label: "Vercel deployment docs" },
        ]),
      ],
    ],
    milestones: { 3: "Checkpoint: ship the first project" },
  });
}

function negotiationPlan(): LearningPlan {
  return buildPlan({
    goal: "prepping to negotiate a raise",
    examName: "Salary Negotiation Prep",
    targetDaysOut: 6,
    hoursPerDay: 1,
    studyDays: "daily",
    periodTopics: [
      [
        topic("t1", "Anchoring & BATNA", "Why the first number matters, and knowing your walk-away point.", "high", 2, [
          { kind: "book", label: "Never Split the Difference" },
        ]),
        topic("t2", "Live practice", "Reading tone and pacing only comes from doing it out loud.", "high", 3, [
          { kind: "practice", label: "Voice sparring sessions in this app" },
        ]),
      ],
    ],
    milestones: { 0: "Mock negotiation call before the real one" },
  });
}

function biologyPlan(): LearningPlan {
  return buildPlan({
    goal: "studying for a biology exam",
    examName: "Cell Biology Unit Test",
    targetDaysOut: 13,
    hoursPerDay: 3,
    studyDays: "weekdays",
    periodTopics: [
      [
        topic("t1", "Cell structure & organelles", "What each organelle does, not just its name.", "high", 5, [
          { kind: "docs", label: "Khan Academy — Cell biology" },
        ]),
        topic("t2", "Cell membrane & transport", "Passive vs active transport, osmosis.", "medium", 4, [
          { kind: "video", label: "Crash Course Biology" },
        ]),
      ],
      [
        topic("t3", "Cellular respiration", "Glycolysis, Krebs cycle, electron transport chain.", "high", 5, [
          { kind: "video", label: "Crash Course Biology" },
        ]),
        topic("t4", "Photosynthesis", "Light-dependent and light-independent reactions.", "medium", 4, [
          { kind: "docs", label: "Khan Academy — Photosynthesis" },
        ]),
      ],
    ],
    milestones: { 1: "Full practice test" },
  });
}

export function seedIfEmpty() {
  const existing = db.select().from(users).all();
  if (existing.length > 0) return;

  db.insert(users).values([...DUMMY_USERS]).run();

  const [maya, devon, priya] = DUMMY_USERS;

  const plans: Array<{ userId: string; plan: LearningPlan; createdAt: Date }> = [
    { userId: maya.id, plan: webDevPlan(), createdAt: daysAgo(12) },
    { userId: devon.id, plan: negotiationPlan(), createdAt: daysAgo(1) },
    { userId: priya.id, plan: biologyPlan(), createdAt: daysAgo(2) },
  ];

  db.insert(learningPlans)
    .values(
      plans.map(({ userId, plan, createdAt }) => ({
        id: randomUUID(),
        userId,
        goal: plan.goal,
        examName: plan.examName,
        targetDate: plan.targetDate,
        daysRemaining: plan.daysRemaining,
        planJson: JSON.stringify(plan),
        mocked: true,
        createdAt,
      })),
    )
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
