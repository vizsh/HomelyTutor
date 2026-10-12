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
  /** The broad syllabus section/domain this falls under, e.g. "Ethics",
   * "Quantitative Methods" — only set when the exam has a known standard
   * structure (a professional cert, standardized test, board syllabus). */
  domain?: string;
  /** Real or best-estimate exam weighting for that domain, e.g. "15-20%". */
  examWeight?: string;
  summary: string;
  priority: Priority;
  estimatedHours: number;
  resources: PlanResource[];
  completed?: boolean;
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
