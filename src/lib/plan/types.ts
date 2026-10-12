export type ResourceKind = "docs" | "course" | "video" | "practice" | "book";

export type PlanResource = {
  kind: ResourceKind;
  label: string;
  url?: string;
};

export type PlanStage = {
  id: string;
  title: string;
  summary: string;
  durationLabel: string;
  resources: PlanResource[];
};

export type LearningPlan = {
  goal: string;
  totalDurationLabel: string;
  stages: PlanStage[];
};
