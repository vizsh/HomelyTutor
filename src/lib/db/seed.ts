import { randomUUID } from "node:crypto";

import { db } from "./client";
import { users, learningPlans, quizAttempts } from "./schema";
import { DUMMY_USERS } from "./dummy-users";
import { computePeriods, daysBetween } from "@/lib/plan/periods";
import type { LearningPlan, PlanPeriod, PlanTopic, Priority, StudyDays } from "@/lib/plan/types";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function topic(opts: {
  id: string;
  title: string;
  summary: string;
  priority: Priority;
  estimatedHours: number;
  resources: PlanTopic["resources"];
  domain?: string;
  examWeight?: string;
}): PlanTopic {
  return opts;
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
        topic({ id: "t1", title: "HTML structure & semantics", summary: "Markup that actually describes the content, not just divs everywhere.", priority: "high", estimatedHours: 6, resources: [{ kind: "docs", label: "MDN: HTML basics" }] }),
        topic({ id: "t2", title: "CSS layout (flexbox & grid)", summary: "The two layout systems that cover almost everything you'll need.", priority: "high", estimatedHours: 7, resources: [{ kind: "practice", label: "Build a static landing page" }] }),
      ],
      [
        topic({ id: "t3", title: "JavaScript fundamentals", summary: "Variables, functions, control flow — the parts used constantly.", priority: "high", estimatedHours: 8, resources: [{ kind: "course", label: "freeCodeCamp JS course" }] }),
        topic({ id: "t4", title: "The DOM & events", summary: "Making a page actually respond to clicks and input.", priority: "medium", estimatedHours: 6, resources: [{ kind: "practice", label: "Build a small interactive widget" }] }),
      ],
      [
        topic({ id: "t5", title: "React components & props", summary: "The mental model that unlocks everything else in React.", priority: "high", estimatedHours: 7, resources: [{ kind: "docs", label: "react.dev — Learn React" }] }),
        topic({ id: "t6", title: "State & hooks", summary: "useState and useEffect, and when you actually need them.", priority: "medium", estimatedHours: 6, resources: [{ kind: "practice", label: "Rebuild the landing page as components" }] }),
      ],
      [
        topic({ id: "t7", title: "First real project", summary: "Combine everything into one small complete app.", priority: "high", estimatedHours: 10, resources: [{ kind: "practice", label: "Guided project walkthrough" }] }),
      ],
      [
        topic({ id: "t8", title: "Polish & deploy", summary: "Get it actually live somewhere, not just on your machine.", priority: "medium", estimatedHours: 5, resources: [{ kind: "docs", label: "Vercel deployment docs" }] }),
      ],
    ],
    milestones: { 3: "Checkpoint: ship the first project" },
  });
}

function cfaPlan(): LearningPlan {
  return buildPlan({
    goal: "preparing for the CFA Level I exam",
    examName: "CFA Level I",
    targetDaysOut: 70,
    hoursPerDay: 3,
    studyDays: "daily",
    periodTopics: [
      [
        topic({ id: "t1", domain: "Ethical and Professional Standards", examWeight: "15-20%", title: "Code of Ethics and Standards of Professional Conduct", summary: "The seven standards tested most heavily across the whole exam, not just this section.", priority: "high", estimatedHours: 10, resources: [{ kind: "book", label: "CFA Institute Standards of Practice Handbook" }] }),
        topic({ id: "t2", domain: "Quantitative Methods", examWeight: "6-9%", title: "Time Value of Money", summary: "PV/FV, annuities, and the calculator mechanics everything later depends on.", priority: "high", estimatedHours: 8, resources: [{ kind: "course", label: "Kaplan Schweser QM module" }] }),
      ],
      [
        topic({ id: "t3", domain: "Financial Statement Analysis", examWeight: "11-14%", title: "Income Statement & Revenue Recognition", summary: "How revenue, expenses, and EPS are actually constructed and manipulated.", priority: "high", estimatedHours: 10, resources: [{ kind: "book", label: "CFA Program Curriculum, FSA volume" }] }),
        topic({ id: "t4", domain: "Economics", examWeight: "6-9%", title: "Supply, Demand & Market Structures", summary: "Micro fundamentals that show up again in later Economics LOS.", priority: "medium", estimatedHours: 7, resources: [{ kind: "practice", label: "Schweser QBank — Economics" }] }),
      ],
      [
        topic({ id: "t5", domain: "Fixed Income", examWeight: "11-14%", title: "Bond Pricing & Yield Measures", summary: "Price-yield relationship, duration, and why bond math trips people up.", priority: "high", estimatedHours: 10, resources: [{ kind: "course", label: "Kaplan Schweser Fixed Income module" }] }),
        topic({ id: "t6", domain: "Equity Investments", examWeight: "11-14%", title: "Market Organization & Equity Securities", summary: "How equity markets and indices are structured.", priority: "medium", estimatedHours: 7, resources: [{ kind: "docs", label: "CFA Institute curriculum readings" }] }),
      ],
      [
        topic({ id: "t7", domain: "Portfolio Management", examWeight: "8-12%", title: "Portfolio Risk and Return (Modern Portfolio Theory)", summary: "Efficient frontier, CAPM — the conceptual backbone of the PM section.", priority: "high", estimatedHours: 9, resources: [{ kind: "video", label: "AnalystPrep Portfolio Management series" }] }),
        topic({ id: "t8", domain: "Derivatives", examWeight: "5-8%", title: "Forwards, Futures & Options Basics", summary: "Payoff diagrams and the vocabulary the rest of the section builds on.", priority: "medium", estimatedHours: 6, resources: [{ kind: "practice", label: "Schweser QBank — Derivatives" }] }),
      ],
      [
        topic({ id: "t9", title: "Full-length mock exam review", summary: "Simulate real exam conditions, then triage weak domains from the score report.", priority: "high", estimatedHours: 12, resources: [{ kind: "practice", label: "CFA Institute mock exam" }] }),
      ],
    ],
    milestones: { 2: "Checkpoint: revise Ethics + QM, they compound all exam", 4: "Full-length mock exam" },
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
        topic({ id: "t1", title: "Cell structure & organelles", summary: "What each organelle does, not just its name.", priority: "high", estimatedHours: 5, resources: [{ kind: "docs", label: "Khan Academy — Cell biology" }] }),
        topic({ id: "t2", title: "Cell membrane & transport", summary: "Passive vs active transport, osmosis.", priority: "medium", estimatedHours: 4, resources: [{ kind: "video", label: "Crash Course Biology" }] }),
      ],
      [
        topic({ id: "t3", title: "Cellular respiration", summary: "Glycolysis, Krebs cycle, electron transport chain.", priority: "high", estimatedHours: 5, resources: [{ kind: "video", label: "Crash Course Biology" }] }),
        topic({ id: "t4", title: "Photosynthesis", summary: "Light-dependent and light-independent reactions.", priority: "medium", estimatedHours: 4, resources: [{ kind: "docs", label: "Khan Academy — Photosynthesis" }] }),
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
    { userId: devon.id, plan: cfaPlan(), createdAt: daysAgo(1) },
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
      { id: randomUUID(), userId: devon.id, topic: "Ethics: Code of Conduct", score: 4, total: 5, mocked: true, createdAt: daysAgo(5) },
      { id: randomUUID(), userId: priya.id, topic: "Cell structure", score: 2, total: 5, mocked: true, createdAt: daysAgo(8) },
      { id: randomUUID(), userId: priya.id, topic: "Cell structure", score: 3, total: 5, mocked: true, createdAt: daysAgo(5) },
      { id: randomUUID(), userId: priya.id, topic: "Cellular respiration", score: 5, total: 5, mocked: true, createdAt: daysAgo(1) },
    ])
    .run();

  console.log("Seeded dummy users and sample history.");
}

seedIfEmpty();
