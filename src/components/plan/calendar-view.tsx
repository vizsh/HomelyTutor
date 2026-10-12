"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";

import type { LearningPlan } from "@/lib/plan/types";
import { buildDailySchedule, getDaySchedule, type DaySchedule } from "@/lib/plan/daily-schedule";
import { priorityStyle } from "@/lib/plan/priority-style";
import { cn } from "@/lib/utils";

function toLocalISODate(d: Date): string {
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarView({ plan }: { plan: LearningPlan }) {
  const schedule = useMemo(() => buildDailySchedule(plan), [plan]);
  const todayISO = toLocalISODate(new Date());

  const initialMonth = useMemo(() => {
    const inRange = schedule.some((d) => d.date === todayISO);
    const base = new Date(inRange ? todayISO : (schedule[0]?.date ?? todayISO));
    return { year: base.getFullYear(), month: base.getMonth() };
  }, [schedule, todayISO]);

  const [view, setView] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    schedule.some((d) => d.date === todayISO) ? todayISO : null,
  );

  const monthStart = new Date(view.year, view.month, 1);
  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, DaySchedule>();
    for (const d of schedule) map.set(d.date, d);
    return map;
  }, [schedule]);

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toLocalISODate(new Date(view.year, view.month, i + 1))),
  ];

  const selected = selectedDate ? getDaySchedule(schedule, selectedDate) : undefined;

  function changeMonth(delta: number) {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="font-serif text-base">{monthLabel}</p>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const day = scheduleByDate.get(iso);
            const dayNum = Number(iso.slice(8, 10));
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;
            const hasWork = day && day.isStudyDay && day.items.length > 0;
            const topPriority = hasWork
              ? day!.items.some((it) => it.priority === "high")
                ? "high"
                : day!.items.some((it) => it.priority === "medium")
                  ? "medium"
                  : "low"
              : undefined;

            return (
              <button
                key={iso}
                type="button"
                disabled={!day}
                onClick={() => setSelectedDate(iso)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors",
                  !day && "opacity-30",
                  day && !isSelected && "hover:bg-secondary",
                  isSelected && "bg-primary text-primary-foreground",
                  isToday && !isSelected && "ring-1 ring-primary/50",
                )}
              >
                <span className={cn(isToday && !isSelected && "font-semibold text-primary")}>{dayNum}</span>
                {topPriority && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : priorityStyle[topPriority].dot,
                    )}
                  />
                )}
                {day?.milestone && <Flag className={cn("size-2.5", isSelected ? "text-primary-foreground" : "text-accent")} />}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 font-serif text-base">
            {new Date(selected.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          {selected.milestone && (
            <div className="mb-3 flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
              <Flag className="size-3.5" />
              {selected.milestone}
            </div>
          )}

          {!selected.isStudyDay && (
            <p className="text-sm text-muted-foreground">Rest day — nothing scheduled.</p>
          )}

          {selected.isStudyDay && selected.items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing scheduled this day.</p>
          )}

          {selected.items.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {selected.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className={cn("size-1.5 shrink-0 rounded-full", priorityStyle[item.priority].dot)} />
                  <span className="flex-1 text-sm">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
