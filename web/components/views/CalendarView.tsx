"use client";

import {
  AlarmClock,
  CalendarDays,
  Droplets,
  Stethoscope,
  UsersRound,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CalendarBoard } from "@/components/calendar/CalendarBoard";
import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatNumber, formatRelative } from "@/lib/format";
import type { CalendarMonth, CalendarSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export function CalendarView() {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const { data: month, loading: monthLoading } = useApi<CalendarMonth>(
    withQuery("/events", { year: cursor.year, month: cursor.month }),
    [cursor.year, cursor.month],
  );

  const { data: summary, loading, error, refetch } = useApi<CalendarSummary>("/events/summary");

  const totals = summary?.totals;

  /** Ay ileri/geri; yil sinirinda dogru sarmalar. */
  const navigate = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Takvim"
        description="Çiftliğinizdeki tüm faaliyet, randevu ve operasyon takvimlerini tek yerden yönetin."
        icon={<CalendarDays />}
        primaryLabel="Yeni Etkinlik"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<CalendarDays />}
          label="Bugünkü Etkinlikler"
          value={formatNumber(totals?.today)}
          meta="Bugün planlanan"
          loading={loading}
        />
        <StatCard
          icon={<UsersRound />}
          label="Yaklaşan Doğumlar"
          value={formatNumber(totals?.upcomingBirths)}
          meta="15 gün içinde"
          tone="purple"
          loading={loading}
        />
        <StatCard
          icon={<Wheat />}
          label="Planlı Hasatlar"
          value={formatNumber(totals?.plannedHarvests)}
          meta="15 gün içinde"
          tone="orange"
          loading={loading}
        />
        <StatCard
          icon={<Stethoscope />}
          label="Veteriner Randevuları"
          value={formatNumber(totals?.vetAppointments)}
          meta="Bu hafta"
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<Droplets />}
          label="Sulama Planları"
          value={formatNumber(totals?.irrigationPlans)}
          meta="Bu hafta"
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<AlarmClock />}
          label="Kritik Hatırlatmalar"
          value={formatNumber(totals?.criticalReminders)}
          meta="Acil aksiyon gerekli"
          tone="red"
          loading={loading}
        />
      </div>

      <div className="calendar-layout">
        <Panel>
          <CalendarBoard
            month={month}
            loading={monthLoading}
            onNavigate={navigate}
            onToday={() =>
              setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })
            }
          />
        </Panel>

        <div className="calendar-sidebar">
          <Panel title="Bugünkü Ajanda">
            <div className="agenda-list">
              {!summary && <SkeletonBlock rows={4} height={26} />}
              {summary?.todayAgenda.map((item) => (
                <span key={item.id}>
                  <time>{item.time}</time>
                  <b>{item.title}</b>
                  <small>{item.meta || "—"}</small>
                </span>
              ))}
              {summary?.todayAgenda.length === 0 && (
                <span>
                  <time>—</time>
                  <b>Bugün etkinlik yok</b>
                  <small>Takviminiz boş görünüyor.</small>
                </span>
              )}
            </div>
          </Panel>

          <Panel title="Yaklaşan Doğumlar" action={<Link href="/suru">Sürüye Git</Link>}>
            <div className="compact-list">
              {!summary && <SkeletonBlock rows={3} height={30} />}
              {summary?.upcomingBirthList.map((animal) => (
                <Link key={animal.id} href={`/suru/${animal.id}`}>
                  <UsersRound />
                  <span>
                    <strong>{animal.earTag}</strong>
                    <small>
                      {[animal.breed, animal.ageLabel].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                  <b>{animal.daysLeft} gün</b>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Son Hatırlatmalar" action={<Link href="/alarmlar">Tümü</Link>}>
            <div className="alert-list">
              {!summary && <SkeletonBlock rows={2} height={30} />}
              {summary?.reminders.map((reminder) => (
                <span
                  key={reminder.id}
                  className={reminder.severity === "kritik" ? "alert-red" : "alert-orange"}
                >
                  <AlarmClock />
                  <b>{reminder.title}</b>
                  <small>
                    {reminder.message} · {formatRelative(reminder.createdAt)}
                  </small>
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="module-bottom-grid">
        <Panel title="Haftalık Operasyon Planı">
          <div className="compact-list">
            {!summary && <SkeletonBlock rows={5} height={30} />}
            {summary?.weeklyPlan.map((day) => (
              <div key={day.date}>
                <CalendarDays />
                <span>
                  <strong>{day.label}</strong>
                  <small>
                    {day.count} etkinlik · {day.irrigation} sulama
                  </small>
                </span>
                <b>Planlı</b>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Görev Dağılımı">
          <div className="progress-list">
            {!summary && <SkeletonBlock rows={4} height={22} />}
            {summary?.assigneeLoad.map((person) => (
              <span key={person.name}>
                <UsersRound />
                <b>{person.name}</b>
                <i>
                  <em style={{ width: `${person.percent}%` }} />
                </i>
                <small>{person.count}</small>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Etkinlik Türleri">
          <div className="info-grid">
            {!summary && <SkeletonBlock rows={3} height={24} />}
            {summary?.typeCounts.slice(0, 6).map((item) => (
              <span key={item.type}>
                <small>{item.name}</small>
                <b>{item.count}</b>
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default CalendarView;
