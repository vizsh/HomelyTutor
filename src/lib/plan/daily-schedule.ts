import type { LearningPlan, PlanTopic, Priority } from "./types";

export type DayItem = {
  topicId: string;
  periodId: string;
  title: string;
  priority: Priority;
  domain?: string;
  hours: number;
};

export type DaySchedule = {
  date: string; // ISO yyyy-mm-dd, local
  isStudyDay: boolean;
  milestone?: string;
  items: DayItem[];
};

function toLocalISODate(d: Date): string {
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

function isStudyDay(date: Date, studyDays: LearningPlan["studyDays"]) {
  if (studyDays === "daily") return true;
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Derives a day-by-day schedule from the already-generated period/topic
 * data — no extra model calls. Topics are greedily packed into each
 * period's study days up to hoursPerDay capacity; a topic whose hours
 * exceed one day's capacity spills into the next study day.
 */
export function buildDailySchedule(plan: LearningPlan): DaySchedule[] {
  const days: DaySchedule[] = [];

  for (const period of plan.periods) {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    const periodDays: DaySchedule[] = [];

    for (const d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      periodDays.push({
        date: toLocalISODate(d),
        isStudyDay: isStudyDay(d, plan.studyDays),
        items: [],
      });
    }

    const studyDaysInPeriod = periodDays.filter((d) => d.isStudyDay);
    if (studyDaysInPeriod.length > 0 && periodDays.length > 0) {
      periodDays[periodDays.length - 1].milestone = period.milestone;
    }

    // Queue of (topic, remainingHours) in the order the model prioritized them.
    const queue: { topic: PlanTopic; remaining: number }[] = period.topics.map((t) => ({
      topic: t,
      remaining: Math.max(0.25, t.estimatedHours),
    }));

    let dayIndex = 0;
    let capacityLeft = plan.hoursPerDay;

    while (queue.length > 0 && dayIndex < studyDaysInPeriod.length) {
      const current = queue[0];
      const take = Math.min(current.remaining, capacityLeft);

      if (take > 0) {
        studyDaysInPeriod[dayIndex].items.push({
          topicId: current.topic.id,
          periodId: period.id,
          title: current.topic.title,
          priority: current.topic.priority,
          domain: current.topic.domain,
          hours: Math.round(take * 4) / 4,
        });
        current.remaining -= take;
        capacityLeft -= take;
      }

      if (current.remaining <= 0.01) queue.shift();
      if (capacityLeft <= 0.01) {
        dayIndex++;
        capacityLeft = plan.hoursPerDay;
      }
    }

    days.push(...periodDays);
  }

  return days;
}

export function getDaySchedule(schedule: DaySchedule[], isoDate: string): DaySchedule | undefined {
  return schedule.find((d) => d.date === isoDate);
}
