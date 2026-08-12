"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { SkeletonBlock } from "@/components/ui/AsyncState";
import type { CalendarMonth } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCalendarView } from "@/store/slices/workspaceSlice";

const weekdays = ["Pzt", "Salı", "Çarş", "Per", "Cum", "Cmt", "Paz"];

/** Ayin ilk gununun Pazartesi-baslangicli sutun indeksini verir (0-6). */
function firstWeekdayIndex(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay(); // 0 = Pazar
  return (day + 6) % 7;
}

export function CalendarBoard({
  month,
  loading,
  onNavigate,
  onToday,
}: {
  month: CalendarMonth | null;
  loading: boolean;
  onNavigate: (delta: number) => void;
  onToday: () => void;
}) {
  const dispatch = useAppDispatch();
  const view = useAppSelector((state) => state.workspace.calendarView);

  const today = new Date();
  const year = month?.year ?? today.getFullYear();
  const monthNumber = month?.month ?? today.getMonth() + 1;

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const daysInPrevMonth = new Date(year, monthNumber - 1, 0).getDate();
  const offset = firstWeekdayIndex(year, monthNumber);
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === monthNumber;

  return (
    <div className="calendar-board">
      <div className="calendar-toolbar">
        <div>
          <button className="icon-button" aria-label="Önceki ay" onClick={() => onNavigate(-1)}>
            <ChevronLeft />
          </button>
          <button className="button button-secondary" onClick={onToday}>
            Bugün
          </button>
          <button className="icon-button" aria-label="Sonraki ay" onClick={() => onNavigate(1)}>
            <ChevronRight />
          </button>
          <strong>{month?.monthLabel ?? "—"}</strong>
        </div>
        <div className="segmented-control">
          {(["month", "week", "day"] as const).map((item) => (
            <button
              className={view === item ? "is-active" : ""}
              onClick={() => dispatch(setCalendarView(item))}
              key={item}
            >
              {item === "month" ? "Ay" : item === "week" ? "Hafta" : "Gün"}
            </button>
          ))}
        </div>
      </div>

      {loading && !month ? (
        <SkeletonBlock rows={6} height={54} />
      ) : (
        <div className={`calendar-grid view-${view}`}>
          {weekdays.map((day) => (
            <b key={day}>{day}</b>
          ))}
          {Array.from({ length: cellCount }, (_, index) => {
            const date = index - offset + 1;
            const inMonth = date >= 1 && date <= daysInMonth;
            const display = inMonth ? date : date < 1 ? daysInPrevMonth + date : date - daysInMonth;
            const events = inMonth ? (month?.byDay?.[String(date)] ?? []) : [];

            return (
              <div
                className={`${
                  inMonth && isCurrentMonth && date === today.getDate() ? "is-today" : ""
                } ${inMonth ? "" : "is-muted"}`}
                key={index}
              >
                <strong>{display}</strong>
                {events.slice(0, 3).map((event, eventIndex) => (
                  <span className={`event-tone-${eventIndex % 4}`} key={`${event}-${eventIndex}`}>
                    {event}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
