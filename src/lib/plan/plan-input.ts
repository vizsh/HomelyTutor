import type { StudyDays } from "./types";

export type PlanInput = {
  goal: string;
  examName: string;
  targetDate: string;
  hoursPerDay: number;
  studyDays: StudyDays;
  /** Pasted syllabus/notes/past-paper text — when present, generation is
   * grounded in this specific material instead of the model's general
   * knowledge of the subject. */
  syllabusText?: string;
};
