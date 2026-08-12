"use client";

import {
  Activity,
  AlarmClock,
  Beef,
  HeartPulse,
  Milk,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatDate, formatNumber, formatPercent, withUnit } from "@/lib/format";
import type { AlertSummary, AnimalRow, AnimalSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const LACTATION_OPTIONS = [
  { value: "sagmal", label: "Sağmal" },
  { value: "kuru", label: "Kuru" },
  { value: "buzagi", label: "Buzağı" },
  { value: "genc", label: "Genç" },
];

const TABS = ["Hayvan Listesi", "Biyolojik Takvim", "Sağlık Takibi", "Alarmlar"];

export function HerdView() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error: summaryError, refetch } =
    useApi<AnimalSummary>("/animals/summary");

  const listPath = withQuery("/animals/view", {
    q: search || undefined,
    breed: filters.breed,
    lactationStage: filters.lactationStage,
    barnSection: filters.barnSection,
    page,
    limit: 10,
  });
  const { data: animals, meta, loading: listLoading } = useApi<AnimalRow[]>(listPath);

  const { data: alerts } = useApi<AlertSummary>("/alerts/summary");

  // Sunucudan gelen alarm listesinden sürü kaynaklı ilk kritik kayıt.
  const criticalAlert =
    alerts?.highlights.find((a) => a.source === "suru" && a.severity === "kritik") ??
    alerts?.highlights.find((a) => a.source === "suru") ??
    null;

  const totals = summary?.totals;

  const rows = (animals ?? []).map((animal) => [
    <Link className="primary-cell" href={`/suru/${animal.id}`} key={animal.id}>
      <Image src={animal.photoUrl || "/assets/cow_portrait.png"} alt="" width={42} height={42} unoptimized />
      <strong>{animal.earTag}</strong>
    </Link>,
    animal.breed,
    animal.ageLabel,
    animal.lactationLabel,
    formatDate(animal.lastInseminationAt),
    formatDate(animal.expectedBirthAt),
    withUnit(animal.dailyMilkLiters, "L"),
    animal.healthLabel,
  ]);

  const updateFilter = (name: string, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Sürü Yönetimi"
        description="Hayvanlarınızı, biyolojik takvimi ve sağlık durumunu tek panelden yönetin."
        icon={<Beef />}
        primaryLabel="Yeni Hayvan"
      />

      {summaryError && <ErrorState message={summaryError} onRetry={refetch} />}

      <Reveal>
        <div className="stats-grid stats-grid-6">
          <StatCard
            icon={<Beef />}
            label="Toplam Hayvan"
            value={formatNumber(totals?.total)}
            unit="Baş"
            meta="Aktif kayıt"
            loading={summaryLoading}
          />
          <StatCard
            icon={<Milk />}
            label="Sağmal"
            value={formatNumber(totals?.milking)}
            unit="Baş"
            meta={formatPercent(totals?.total ? (totals.milking / totals.total) * 100 : 0)}
            trend="up"
            loading={summaryLoading}
          />
          <StatCard
            icon={<Activity />}
            label="Kuru"
            value={formatNumber(totals?.dry)}
            unit="Baş"
            meta={formatPercent(totals?.total ? (totals.dry / totals.total) * 100 : 0)}
            tone="orange"
            loading={summaryLoading}
          />
          <StatCard
            icon={<UsersRound />}
            label="Buzağı"
            value={formatNumber(totals?.calves)}
            unit="Baş"
            meta={formatPercent(totals?.total ? (totals.calves / totals.total) * 100 : 0)}
            tone="blue"
            loading={summaryLoading}
          />
          <StatCard
            icon={<HeartPulse />}
            label="Yaklaşan Doğum"
            value={formatNumber(totals?.upcomingBirths)}
            unit="Baş"
            meta="15 gün içinde"
            tone="purple"
            loading={summaryLoading}
          />
          <StatCard
            icon={<AlarmClock />}
            label="Aktif Alarm"
            value={formatNumber(totals?.openAlerts)}
            meta="Hemen incele"
            tone="red"
            loading={summaryLoading}
          />
        </div>
      </Reveal>

      <Panel className="table-panel">
        <div className="tabs">
          {TABS.map((label, index) => (
            <button
              key={label}
              className={tab === index ? "is-active" : ""}
              onClick={() => setTab(index)}
            >
              {label}
              {index === 3 && !!totals?.openAlerts && <b>{totals.openAlerts}</b>}
            </button>
          ))}
        </div>
        <Filters
          placeholder="Ara... (küpe no, ırk, durum...)"
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onSelectChange={updateFilter}
          selects={[
            {
              name: "breed",
              placeholder: "Tüm Irklar",
              value: filters.breed,
              options: (summary?.breeds ?? []).map((breed) => ({ value: breed, label: breed })),
            },
            {
              name: "lactationStage",
              placeholder: "Tüm Durumlar",
              value: filters.lactationStage,
              options: LACTATION_OPTIONS,
            },
            {
              name: "barnSection",
              placeholder: "Konum / Ahır",
              value: filters.barnSection,
              options: (summary?.barnDistribution ?? []).map((barn) => ({
                value: barn.name,
                label: barn.name,
              })),
            },
          ]}
        />
        <div className="herd-content-grid">
          <DataTable
            compact
            loading={listLoading}
            headers={[
              "Küpe No",
              "Irk",
              "Yaş",
              "Durum",
              "Son Tohumlama",
              "Tahmini Doğum",
              "Günlük Süt",
              "Sağlık",
            ]}
            rows={rows}
            pagination={
              meta?.pagination
                ? {
                    page: meta.pagination.page,
                    totalPages: meta.pagination.totalPages,
                    total: meta.pagination.total,
                  }
                : undefined
            }
            onPageChange={setPage}
          />
          <div className="side-chart-stack">
            <Panel title="Sürü Sağlık Durumu">
              {summary ? (
                <DonutChart total={formatNumber(totals?.total)} data={summary.healthDistribution} />
              ) : (
                <SkeletonBlock rows={4} height={22} />
              )}
            </Panel>
            <Panel title="Laktasyon / Süt Üretimi">
              {summary ? <TrendChart data={summary.milkTrend} /> : <SkeletonBlock rows={4} height={22} />}
            </Panel>
          </div>
        </div>
      </Panel>

      <div className="module-bottom-grid">
        <Panel className="critical-card" title={criticalAlert?.title ?? "AKTİF ALARM"}>
          {criticalAlert ? (
            <div className="animal-alarm">
              <div>
                <Beef />
                <span>
                  <strong>{criticalAlert.animal?.earTag ?? criticalAlert.subject}</strong>
                  <small>{criticalAlert.animal?.breed ?? criticalAlert.sourceLabel}</small>
                </span>
              </div>
              <p>{criticalAlert.message}</p>
              <div className="video-thumb">
                <Image
                  src={criticalAlert.imageUrl || "/assets/camera_barn.png"}
                  alt=""
                  fill
                  unoptimized
                />
                <i>▶</i>
              </div>
              <Link
                className="button button-danger"
                href={criticalAlert.animal ? `/suru/${criticalAlert.animal.id}` : "/alarmlar"}
              >
                Detayları Gör
              </Link>
            </div>
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>

        <Panel title="Yaklaşan Doğumlar" action={<Link href="/takvim">Tümünü Gör</Link>}>
          <div className="compact-list">
            {!summary && <SkeletonBlock rows={4} height={30} />}
            {summary?.upcomingBirths.map((animal) => (
              <Link key={animal._id} href={`/suru/${animal._id}`}>
                <UsersRound />
                <span>
                  <strong>{animal.earTag}</strong>
                  <small>{animal.breed ?? "—"}</small>
                </span>
                <b>{animal.daysLeft} gün kaldı</b>
              </Link>
            ))}
            {summary?.upcomingBirths.length === 0 && (
              <div>
                <UsersRound />
                <span>
                  <strong>Yaklaşan doğum yok</strong>
                  <small>Önümüzdeki 15 gün için kayıt bulunmuyor.</small>
                </span>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Ahır / Konum Dağılımı">
          <div className="progress-list">
            {!summary && <SkeletonBlock rows={4} height={22} />}
            {summary?.barnDistribution.map((barn) => (
              <span key={barn.name}>
                <ShieldCheck />
                <b>{barn.name}</b>
                <i>
                  <em style={{ width: `${barn.percent}%` }} />
                </i>
                <small>{barn.count}</small>
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default HerdView;
