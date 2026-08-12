"use client";

import {
  AlarmClock,
  Camera,
  CheckCircle2,
  Clock3,
  Hourglass,
  Siren,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api, withQuery } from "@/lib/api";
import { formatChange, formatDateTime, formatNumber, trendOf } from "@/lib/format";
import type { AlertRow, AlertSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

/** Ust sekmeler dogrudan sorgu parametrelerine cevrilir. */
const TABS = [
  { label: "Tümü", query: {} },
  { label: "Aktif", query: { status: "acik" } },
  { label: "Kritik", query: { severity: "kritik" } },
  { label: "Çözüldü", query: { status: "cozuldu" } },
  { label: "Sürü", query: { source: "suru" } },
  { label: "Tarla", query: { source: "tarla" } },
  { label: "Stok", query: { source: "stok" } },
] as const;

const SEVERITY_OPTIONS = [
  { value: "kritik", label: "Kritik" },
  { value: "yuksek", label: "Yüksek" },
  { value: "orta", label: "Orta" },
  { value: "dusuk", label: "Düşük" },
];

const SOURCE_OPTIONS = [
  { value: "suru", label: "Sürü" },
  { value: "tarla", label: "Tarla" },
  { value: "stok", label: "Stok" },
  { value: "kamera", label: "Kamera" },
  { value: "cihaz", label: "Cihaz" },
];

const DAY_OPTIONS = [
  { value: "1", label: "Son 24 Saat" },
  { value: "7", label: "Son 7 Gün" },
  { value: "30", label: "Son 30 Gün" },
];

export function AlarmsView() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<AlertSummary>("/alerts/summary");

  const listPath = withQuery("/alerts", {
    ...TABS[tab].query,
    q: search || undefined,
    severity: filters.severity,
    source: filters.source,
    days: filters.days,
    page,
    limit: 10,
  });
  const { data: alerts, meta, loading, refetch: refetchList } = useApi<AlertRow[]>(listPath);

  const totals = summary?.totals;

  const rows = (alerts ?? []).map((alert) => [
    alert.title,
    alert.sourceLabel,
    alert.subject,
    alert.severityLabel,
    formatDateTime(alert.createdAt),
    alert.statusLabel,
    alert.assignedLabel,
  ]);

  /** Alarmi cozuldu olarak isaretle ve listeleri tazele. */
  const resolve = async (id: string) => {
    try {
      await api.post(`/alerts/${id}/resolve`);
      dispatch(showToast("Alarm çözüldü olarak işaretlendi."));
      refetch();
      refetchList();
    } catch {
      dispatch(showToast("Alarm güncellenemedi."));
    }
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Alarmlar"
        description="Çiftliğinizdeki tüm kritik uyarıları tek panelden izleyin ve yönetin."
        icon={<AlarmClock />}
        primaryLabel="Alarm Kuralı"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<AlarmClock />}
          label="Toplam Alarm"
          value={formatNumber(totals?.total)}
          meta="Tüm kayıtlar"
          tone="red"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Siren />}
          label="Aktif Kritik"
          value={formatNumber(totals?.activeCritical)}
          meta="Açık kritik alarm"
          tone="red"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Clock3 />}
          label="Bugün Oluşan"
          value={formatNumber(totals?.today)}
          meta={formatChange(totals?.todayChangePercent, "vs dün")}
          trend={trendOf(totals?.todayChangePercent)}
          tone="orange"
          loading={summaryLoading}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Çözülen"
          value={formatNumber(totals?.resolved)}
          meta={formatChange(totals?.resolvedChangePercent, "vs geçen hafta")}
          trend={trendOf(totals?.resolvedChangePercent)}
          loading={summaryLoading}
        />
        <StatCard
          icon={<Camera />}
          label="Kamera Doğrulandı"
          value={formatNumber(totals?.cameraVerified)}
          meta="Görsel doğrulama"
          tone="blue"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Hourglass />}
          label="Müdahale Bekleyen"
          value={formatNumber(totals?.pendingAction)}
          meta="Açık durumda"
          tone="orange"
          loading={summaryLoading}
        />
      </div>

      <div className="table-with-side">
        <Panel className="table-panel">
          <div className="tabs">
            {TABS.map((item, index) => (
              <button
                key={item.label}
                className={tab === index ? "is-active" : ""}
                onClick={() => {
                  setTab(index);
                  setPage(1);
                }}
              >
                {item.label}
                {item.label === "Kritik" && !!totals?.activeCritical && <b>{totals.activeCritical}</b>}
              </button>
            ))}
          </div>
          <Filters
            placeholder="Ara... (alarm türü, açıklama...)"
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSelectChange={(name, value) => {
              setFilters((current) => ({ ...current, [name]: value }));
              setPage(1);
            }}
            selects={[
              { name: "severity", placeholder: "Öncelik: Tümü", value: filters.severity, options: SEVERITY_OPTIONS },
              { name: "source", placeholder: "Kaynak: Tümü", value: filters.source, options: SOURCE_OPTIONS },
              { name: "days", placeholder: "Tüm Zamanlar", value: filters.days, options: DAY_OPTIONS },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Alarm Türü",
              "Kaynak",
              "ID / Açıklama",
              "Öncelik",
              "Oluşma Zamanı",
              "Durum",
              "Atanan",
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
        </Panel>

        <div className="side-chart-stack">
          <Panel title="Alarm Öncelik Dağılımı">
            {summary ? (
              <DonutChart total={formatNumber(totals?.total)} data={summary.severityDistribution} />
            ) : (
              <SkeletonBlock rows={4} height={24} />
            )}
          </Panel>
          <Panel title="Kaynağa Göre Alarm">
            <div className="progress-list">
              {!summary && <SkeletonBlock rows={4} height={22} />}
              {summary?.sourceDistribution.map((item) => {
                const max = summary.sourceDistribution[0]?.value || 1;
                return (
                  <span key={item.name}>
                    <Siren />
                    <b>{item.name}</b>
                    <i>
                      <em style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
                    </i>
                    <small>{item.value}</small>
                  </span>
                );
              })}
            </div>
          </Panel>
          <Panel title="Son 24 Saat Alarm Trendi">
            {summary ? (
              <TrendChart data={summary.trend24h} color="#ef3f3f" />
            ) : (
              <SkeletonBlock rows={4} height={24} />
            )}
          </Panel>
        </div>
      </div>

      <div className="alarm-cards">
        {!summary && <SkeletonBlock rows={3} height={120} />}
        {summary?.highlights.map((alert, index) => (
          <Panel key={alert.id} className={index === 0 ? "critical-card" : ""} title={alert.title}>
            <div className="alarm-detail-card">
              <span>
                <strong>{alert.subject}</strong>
                <small>
                  {alert.severityLabel} · {formatDateTime(alert.createdAt)}
                </small>
              </span>
              <Image
                src={alert.imageUrl || "/assets/camera_barn.png"}
                alt=""
                width={280}
                height={120}
                unoptimized
              />
              <button
                className={index === 0 ? "button button-danger" : "button button-primary"}
                onClick={() => resolve(alert.id)}
              >
                Çözüldü İşaretle
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export default AlarmsView;
