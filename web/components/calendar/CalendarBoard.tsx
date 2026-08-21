"use client";

import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  HeartPulse,
  Stethoscope,
  Syringe,
  Wheat,
  Wrench,
  StickyNote,
} from "lucide-react";

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

export type CalendarEventItem = {
  id: string;
  title: string;
  type?: string;
  category?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  priority?: "yüksek" | "normal" | "düşük" | "kritik";
  status?: "planlandı" | "hazırlıkta" | "tamamlandı" | "kritik";
  assignedPerson?: string;
  location?: string;
  description?: string;
  tone?: number | string;
};

/** Öncelik seviyesine göre renk sınıfı döndürür (Kritik=Kırmızı, Yüksek=Turuncu, Normal=Yeşil, Düşük=Mavi) */
function getEventTone(evt: CalendarEventItem, index: number): string {
  const p = (evt.priority || evt.status || "").toLowerCase();
  if (p === "kritik" || p === "acil") return "event-tone-red";
  if (p === "yüksek") return "event-tone-orange";
  if (p === "normal") return "event-tone-green";
  if (p === "düşük") return "event-tone-blue";
  if (evt.tone !== undefined) return `event-tone-${evt.tone}`;

  // Fallback if priority is missing
  const type = (evt.type || evt.category || "").toLowerCase();
  if (type.includes("doğum") || type.includes("hayvan") || type.includes("sağlık")) return "event-tone-purple";
  if (type.includes("sulama")) return "event-tone-blue";
  if (type.includes("hasat") || type.includes("gübre")) return "event-tone-orange";
  if (type.includes("bakım") || type.includes("ekipman")) return "event-tone-blue";
  return "event-tone-green";
}
function getEventTypeIcon(typeStr?: string) {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("doğum") || t.includes("hayvan") || t.includes("sağlık")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>🐮</span>;
  }
  if (t.includes("sulama")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>💧</span>;
  }
  if (t.includes("veteriner") || t.includes("muayene")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>🩺</span>;
  }
  if (t.includes("aşı") || t.includes("ilaç")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>💉</span>;
  }
  if (t.includes("hasat") || t.includes("gübre") || t.includes("ekim") || t.includes("tarla")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>🌾</span>;
  }
  if (t.includes("bakım") || t.includes("ekipman")) {
    return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>🔧</span>;
  }
  return <span style={{ flexShrink: 0, fontSize: "12px", lineHeight: 1 }}>📋</span>;
}

export function CalendarBoard({
  month,
  loading,
  events = [],
  onNavigate,
  onToday,
  onEventClick,
  onDayClick,
}: {
  month: CalendarMonth | null;
  loading: boolean;
  events?: CalendarEventItem[];
  onNavigate: (delta: number) => void;
  onToday: () => void;
  onEventClick?: (event: CalendarEventItem) => void;
  onDayClick?: (dateStr: string) => void;
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

            // Formatted date string YYYY-MM-DD
            const monthStr = String(monthNumber).padStart(2, "0");
            const dateStr = `${year}-${monthStr}-${String(date).padStart(2, "0")}`;

            // Filter events for this date
            const dayEvents = inMonth
              ? events.filter((e) => e.date === dateStr)
              : [];

            // Fallback to month.byDay if events is empty
            const fallbackEvents = inMonth && dayEvents.length === 0
              ? (month?.byDay?.[String(date)] ?? [])
              : [];

            return (
              <div
                className={`${
                  inMonth && isCurrentMonth && date === today.getDate() ? "is-today" : ""
                } ${inMonth ? "" : "is-muted"}`}
                key={index}
                onClick={() => {
                  if (inMonth && onDayClick) {
                    onDayClick(dateStr);
                  }
                }}
                style={{ cursor: inMonth ? "pointer" : "default" }}
              >
                <strong>{display}</strong>

                {/* Render structured events */}
                {dayEvents.slice(0, 3).map((evt, evtIdx) => (
                  <span
                    className={getEventTone(evt, evtIdx)}
                    key={evt.id || `${evt.title}-${evtIdx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(evt);
                    }}
                    title={`${evt.title} (${evt.assignedPerson || "Sorumlu Atanmadı"}) - Öncelik: ${(evt.priority || "normal").toUpperCase()}`}
                    style={{ cursor: "pointer" }}
                  >
                    {getEventTypeIcon(evt.type || evt.category)}
                    <span>
                      {evt.time ? `${evt.time} ` : ""}{evt.title}
                    </span>
                  </span>
                ))}

                {/* Fallback events if no structured events exist */}
                {dayEvents.length === 0 && fallbackEvents.slice(0, 3).map((eventStr, eventIndex) => (
                  <span
                    className="event-tone-green"
                    key={`${eventStr}-${eventIndex}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.({
                        id: `evt-${date}-${eventIndex}`,
                        title: eventStr,
                        date: dateStr,
                        type: "diğer",
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {getEventTypeIcon(eventStr)}
                    <span>
                      {eventStr}
                    </span>
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
