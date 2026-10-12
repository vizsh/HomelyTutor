import type { StudyDays } from "./types";

export type PeriodSlot = {
  id: string;
  label: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  studyDayCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countStudyDays(start: Date, end: Date, studyDays: StudyDays) {
  if (studyDays === "daily") {
    return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  }
  let count = 0;
  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Splits [today, targetDate] into between 1 and ~10 period slots, auto-picking
 * weekly granularity for shorter runways and coarser phases for long ones —
 * so a unit test next week and a year-out competitive exam both render as a
 * readable, bounded number of periods instead of one giant list.
 */
export function computePeriods(
  today: Date,
  targetDate: Date,
  studyDays: StudyDays,
): PeriodSlot[] {
  const start = startOfDay(today);
  const end = startOfDay(targetDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1);
  const totalWeeks = Math.ceil(totalDays / 7);

  const periodCount = totalWeeks <= 10 ? Math.max(1, totalWeeks) : Math.min(10, Math.ceil(totalWeeks / Math.ceil(totalWeeks / 10)));
  const daysPerPeriod = totalDays / periodCount;

  const slots: PeriodSlot[] = [];
  for (let i = 0; i < periodCount; i++) {
    const periodStart = new Date(start.getTime() + Math.round(i * daysPerPeriod) * DAY_MS);
    const periodEndExclusive =
      i === periodCount - 1
        ? end
        : new Date(start.getTime() + (Math.round((i + 1) * daysPerPeriod) - 1) * DAY_MS);

    const label = periodCount > totalWeeks || daysPerPeriod > 9 ? `Phase ${i + 1}` : `Week ${i + 1}`;

    slots.push({
      id: `p${i + 1}`,
      label,
      dateRangeLabel: `${fmt(periodStart)} – ${fmt(periodEndExclusive)}`,
      startDate: periodStart.toISOString(),
      endDate: periodEndExclusive.toISOString(),
      studyDayCount: countStudyDays(periodStart, periodEndExclusive, studyDays),
    });
  }

  return slots;
}

export function daysBetween(today: Date, targetDate: Date) {
  const start = startOfDay(today);
  const end = startOfDay(targetDate);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
}
