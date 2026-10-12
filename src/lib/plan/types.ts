export type ResourceKind = "docs" | "course" | "video" | "practice" | "book";

export type PlanResource = {
  kind: ResourceKind;
  label: string;
  url?: string;
};

export type Priority = "high" | "medium" | "low";

export type PlanTopic = {
  id: string;
  title: string;
  summary: string;
  priority: Priority;
  estimatedHours: number;
  resources: PlanResource[];
};

export type PlanPeriod = {
  id: string;
  label: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  topics: PlanTopic[];
  milestone?: string;
};

export type PriorityBreakdown = { high: number; medium: number; low: number };

export type StudyDays = "daily" | "weekdays";

export type LearningPlan = {
  goal: string;
  examName: string;
  targetDate: string;
  daysRemaining: number;
  hoursPerDay: number;
  studyDays: StudyDays;
  totalStudyHours: number;
  priorityBreakdown: PriorityBreakdown;
  periods: PlanPeriod[];
};
