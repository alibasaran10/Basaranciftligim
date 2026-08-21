"use client";

import { Coins, Leaf, Sprout, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { BarsChart, DonutChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import {
  formatChange,
  formatCurrency,
  formatDate,
  formatDecimal,
  formatNumber,
  formatPercent,
  trendOf,
  formatArea,
} from "@/lib/format";
import type { CropRecordRow, CropSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const TABS = [
  { key: "ekim", label: "Ekim Kayıtları" },
  { key: "hasat", label: "Hasat Kayıtları" },
];

export function CropRecordsView() {
  const [type, setType] = useState("ekim");
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error, refetch } = useApi<CropSummary>(
    withQuery("/crop-records/summary", { type }),
  );

  const { data: records, meta, loading } = useApi<CropRecordRow[]>(
    withQuery("/crop-records/view", { type, page, limit: 10 }),
  );

  const totals = summary?.totals;
  const isSowing = type === "ekim";

  const rows = (records ?? []).map((record) => [
    formatDate(record.date),
    record.fieldSlug ? (
      <Link href={`/tarlalar/${record.fieldSlug}`} key={record.id}>
        {record.fieldName}
      </Link>
    ) : (
      record.fieldName
    ),
    record.crop,
    record.variety,
    formatArea(record.areaDonum),
    formatDecimal(record.amount),
    record.unit,
    record.method,
    formatCurrency(record.cost),
    record.statusLabel,
  ]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow="Tarla Yönetimi / Ekim & Hasat Kayıtları"
        title="Ekim & Hasat Kayıtları"
        primaryLabel="Yeni Kayıt"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={type === item.key ? "is-active" : ""}
            onClick={() => {
              setType(item.key);
              setPage(1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<Sprout />}
          label={isSowing ? "Toplam Ekim Alanı" : "Toplam Hasat Alanı"}
          value={formatDecimal(totals?.totalArea)}
          unit="da"
          meta={`${formatNumber(totals?.records)} kayıt`}
          loading={summaryLoading}
        />
        <StatCard
          icon={<Leaf />}
          label={`Bu Sezon ${isSowing ? "Ekilen" : "Hasat Edilen"} Alan`}
          value={formatDecimal(totals?.seasonArea)}
          unit="da"
          meta={`${formatPercent(totals?.seasonCompletionPercent)} tamamlandı`}
          trend="up"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Coins />}
          label={isSowing ? "Toplam Ekim Maliyeti" : "Toplam Hasat Maliyeti"}
          value={formatCurrency(totals?.totalCost)}
          meta={`Ort. ${formatCurrency(totals?.costPerDonum)} / da`}
          tone="orange"
          loading={summaryLoading}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Ortalama Verim"
          value={formatDecimal(totals?.averageYield)}
          unit="Ton / da"
          meta={formatChange(totals?.yieldChangePercent, "vs geçen yıl")}
          trend={trendOf(totals?.yieldChangePercent)}
          tone="purple"
          loading={summaryLoading}
        />
      </div>

      <div className="two-column-charts">
        <Panel title={`Aylara Göre ${isSowing ? "Ekim" : "Hasat"} Alanı (da)`}>
          {summary ? <BarsChart data={summary.monthlyArea} /> : <SkeletonBlock rows={4} height={26} />}
        </Panel>
        <Panel title="Ürün Dağılımı (Alan)">
          {summary ? (
            <DonutChart total={`${formatDecimal(totals?.totalArea)} da`} data={summary.cropDistribution} />
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>
      </div>

      <Panel title={`${isSowing ? "Ekim" : "Hasat"} Kayıtları Listesi`} className="table-panel">
        <DataTable
          loading={loading}
          headers={[
            "Tarih",
            "Tarla Adı",
            "Ürün",
            "Çeşit / Hibrit",
            "Alan (da)",
            "Miktar",
            "Birim",
            "Yöntem",
            "Maliyet",
            "Durum",
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
    </div>
  );
}

export default CropRecordsView;
