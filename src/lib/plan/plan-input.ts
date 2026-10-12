import type { StudyDays } from "./types";

export type PlanInput = {
  goal: string;
  examName: string;
  targetDate: string;
  hoursPerDay: number;
  studyDays: StudyDays;
};
