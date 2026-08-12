"use client";

import { AlertTriangle, Droplets, Leaf, Map, Sprout, Wheat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatDate, formatNumber, formatPercent, withUnit } from "@/lib/format";
import type { FieldRow, FieldSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export function FieldsView() {
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<FieldSummary>("/fields/summary");

  const listPath = withQuery("/fields/view", {
    q: search || undefined,
    crop: crop || undefined,
    page,
    limit: 10,
  });
  const { data: fields, meta, loading } = useApi<FieldRow[]>(listPath);

  const totals = summary?.totals;

  const rows = (fields ?? []).map((field) => [
    <Link className="primary-cell" href={`/tarlalar/${field.slug}`} key={field.id}>
      <Image src={field.imageUrl || "/assets/field_north.png"} alt="" width={52} height={36} unoptimized />
      <span>
        <strong>{field.name}</strong>
        <small>{field.code}</small>
      </span>
    </Link>,
    formatNumber(field.areaDonum),
    field.soilType,
    field.crop,
    formatDate(field.sowingDate),
    field.irrigation.label,
    field.growthStage,
    formatDate(field.expectedHarvestDate),
  ]);

  const criticalField = summary?.criticalField;

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Tarla Yönetimi"
        description="Tarlalarınızı, ekim planlarınızı ve hasat süreçlerinizi tek panelden yönetin."
        icon={<Sprout />}
        primaryLabel="Yeni Tarla"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<Leaf />}
          label="Toplam Tarla"
          value={formatNumber(totals?.fields)}
          meta="Tüm araziler"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Map />}
          label="Toplam Alan"
          value={formatNumber(totals?.areaDonum)}
          unit="Dönüm"
          meta="Kayıtlı arazi"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Sprout />}
          label="Aktif Ekim"
          value={formatNumber(totals?.activeSowing)}
          unit="Tarlada"
          meta="Ürün ekili"
          trend="up"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Wheat />}
          label="Hasada Yakın"
          value={formatNumber(totals?.nearHarvest)}
          unit="Tarlada"
          meta="30 gün içinde"
          tone="orange"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Droplets />}
          label="Aktif Sulama"
          value={formatNumber(totals?.activeIrrigation)}
          unit="Tarlada"
          meta="İyi / orta seviye"
          tone="blue"
          loading={summaryLoading}
        />
        <StatCard
          icon={<AlertTriangle />}
          label="Kritik Uyarı"
          value={formatNumber(totals?.criticalAlerts)}
          meta="Acil müdahale"
          tone="red"
          loading={summaryLoading}
        />
      </div>

      <div className="table-with-side">
        <Panel className="table-panel" title="Tarla Listesi">
          <Filters
            placeholder="Ara tarlalarda..."
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSelectChange={(_, value) => {
              setCrop(value);
              setPage(1);
            }}
            selects={[
              {
                name: "crop",
                placeholder: "Tüm Ürünler",
                value: crop,
                options: (summary?.cropDistribution ?? []).map((item) => ({
                  value: item.name,
                  label: item.name,
                })),
              },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Tarla",
              "Alan",
              "Toprak Tipi",
              "Ürün",
              "Ekim Tarihi",
              "Sulama",
              "Büyüme Aşaması",
              "Tahmini Hasat",
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
          <Panel title="Ürün Dağılımı">
            {summary ? (
              <DonutChart
                total={`${formatNumber(totals?.areaDonum)} Dönüm`}
                data={summary.cropDistribution}
              />
            ) : (
              <SkeletonBlock rows={4} height={22} />
            )}
          </Panel>
          <Panel title="Sulama Durumu">
            {summary ? (
              <DonutChart
                total={formatPercent(summary.irrigationHealthPercent)}
                data={summary.irrigationDistribution}
              />
            ) : (
              <SkeletonBlock rows={4} height={22} />
            )}
          </Panel>
          <Panel title="Aylık Verim Trendi">
            {summary ? <TrendChart data={summary.yieldTrend} /> : <SkeletonBlock rows={4} height={22} />}
          </Panel>
        </div>
      </div>

      <div className="module-bottom-grid">
        <Panel
          className="critical-card"
          title={criticalField ? `Sulama Uyarısı - ${criticalField.name}` : "Sulama Durumu"}
        >
          {criticalField ? (
            <div className="map-alert">
              <Image
                src={criticalField.imageUrl || "/assets/farm_map.png"}
                alt=""
                width={260}
                height={140}
                unoptimized
              />
              <span>
                <strong>Nem Seviyesi {formatPercent(criticalField.irrigation?.moisturePercent)}</strong>
                <small>
                  Kritik · Son sulama {formatDate(criticalField.irrigation?.lastIrrigatedAt)}
                </small>
                <Link className="button button-danger" href="/tarlalar">
                  Detayları Gör
                </Link>
              </span>
            </div>
          ) : (
            <SkeletonBlock rows={3} height={30} />
          )}
        </Panel>

        <Panel title="Son Ekim / Hasat Kayıtları" action={<Link href="/ekim-hasat">Tümünü Gör</Link>}>
          <div className="compact-list">
            {!summary && <SkeletonBlock rows={3} height={30} />}
            {summary?.recentRecords.map((record) => (
              <div key={record.id}>
                {record.type === "hasat" ? <Wheat /> : <Leaf />}
                <span>
                  <strong>
                    {record.crop} · {record.fieldName}
                  </strong>
                  <small>
                    {record.type === "hasat" ? "Hasat" : "Ekim"} {formatDate(record.date)}
                  </small>
                </span>
                <b>{withUnit(record.amount, record.unit)}</b>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Parsel Haritası">
          <Image
            className="wide-map"
            src="/assets/farm_map.png"
            alt="Parsel haritası"
            width={640}
            height={230}
            unoptimized
          />
        </Panel>
      </div>
    </div>
  );
}

export default FieldsView;
