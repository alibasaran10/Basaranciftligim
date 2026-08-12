"use client";

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBarChart,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { BarsChart, DonutChart, RingProgress } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import {
  formatChange,
  formatCurrency,
  formatDate,
  formatPercent,
  trendOf,
} from "@/lib/format";
import type { FinanceLedgerData, FinanceTransactionRow } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const STATUS_OPTIONS = [
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "kismi", label: "Kısmi" },
  { value: "beklemede", label: "Beklemede" },
];

export function FinanceLedger({ type }: { type: "income" | "expense" }) {
  const income = type === "income";
  const apiType = income ? "gelir" : "gider";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useApi<FinanceLedgerData>(
    withQuery("/finance/ledger", { type: apiType }),
    [apiType],
  );

  const { data: transactions, meta, loading: listLoading } = useApi<FinanceTransactionRow[]>(
    withQuery("/finance/transactions", {
      type: apiType,
      q: search || undefined,
      status: filters.status,
      category: filters.category,
      page,
      limit: 12,
    }),
    [apiType],
  );

  const totals = data?.totals;

  const rows = (transactions ?? []).map((tx) => [
    formatDate(tx.date),
    tx.code,
    tx.description,
    tx.category,
    tx.counterparty,
    tx.paymentMethodLabel,
    formatCurrency(tx.amount),
    tx.statusLabel,
  ]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow={`Finansal / ${income ? "Gelirler" : "Giderler"}`}
        title={income ? "Gelirler" : "Giderler"}
        description={`Çiftliğinizin tüm ${
          income ? "gelir kaynaklarını ve tahsilatlarını" : "gider kalemlerini ve ödemelerini"
        } yönetin.`}
        primaryLabel={income ? "Yeni Gelir Ekle" : "Yeni Gider Ekle"}
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={income ? <TrendingUp /> : <TrendingDown />}
          label={income ? "Toplam Gelir" : "Toplam Gider"}
          value={formatCurrency(totals?.total)}
          meta={formatChange(totals?.totalChangePercent, "geçen yıla göre")}
          trend={trendOf(totals?.totalChangePercent)}
          loading={loading}
        />
        <StatCard
          icon={<CalendarDays />}
          label={income ? "Bu Ay Geliri" : "Bu Ay Gideri"}
          value={formatCurrency(totals?.month)}
          meta={formatChange(totals?.monthChangePercent, "geçen aya göre")}
          trend={trendOf(totals?.monthChangePercent)}
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label={income ? "Tahsil Edilen" : "Ödenen Giderler"}
          value={formatCurrency(totals?.settled)}
          meta={`${formatPercent(totals?.settledPercent)} toplamın`}
          loading={loading}
        />
        <StatCard
          icon={<Clock3 />}
          label={income ? "Bekleyen Tahsilat" : "Bekleyen Ödemeler"}
          value={formatCurrency(totals?.pending)}
          meta={`${formatPercent(totals?.pendingPercent)} toplamın`}
          tone="orange"
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Geçen Aya Göre Değişim"
          value={formatPercent(totals?.monthChangePercent)}
          meta="Aylık değişim"
          trend={trendOf(totals?.monthChangePercent)}
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<ShoppingCart />}
          label={income ? "Ortalama Gelir İşlemi" : "Ortalama Gider İşlemi"}
          value={formatCurrency(totals?.averageTransaction)}
          meta={`${totals?.transactionCount ?? 0} işlem`}
          tone="purple"
          loading={loading}
        />
      </div>

      <div className="finance-chart-grid">
        <Panel title={income ? "Aylık Gelir Trendi" : "Aylık Gider Trendi"}>
          {data ? <BarsChart data={data.monthly} /> : <SkeletonBlock rows={4} height={26} />}
        </Panel>

        <Panel title={income ? "Gelir Kaynakları Dağılımı" : "Gider Kategorileri Dağılımı"}>
          {data ? (
            <DonutChart total={formatCurrency(totals?.total)} data={data.categoryDistribution} />
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>

        <Panel title={income ? "Tahsilat Oranı" : "Ödeme Oranı"}>
          {data ? (
            <>
              <RingProgress
                value={Math.round(data.settlementPercent)}
                label={income ? "Tahsil Edildi" : "Ödeme Oranı"}
              />
              <div className="finance-ring-meta">
                <span>
                  <small>{income ? "Tahsil Edilen" : "Ödenen Giderler"}</small>
                  <b>{formatCurrency(totals?.settled)}</b>
                </span>
                <span>
                  <small>{income ? "Bekleyen" : "Bekleyen Ödemeler"}</small>
                  <b>{formatCurrency(totals?.pending)}</b>
                </span>
              </div>
            </>
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>
      </div>

      <Panel title={`${income ? "Gelir" : "Gider"} Kayıtları`} className="table-panel">
        <Filters
          placeholder={income ? "Gelir ara..." : "Gider ara..."}
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
            {
              name: "category",
              placeholder: "Tüm Kategoriler",
              value: filters.category,
              options: (data?.categoryDistribution ?? []).map((item) => ({
                value: item.name,
                label: item.name,
              })),
            },
            {
              name: "status",
              placeholder: "Tüm Durumlar",
              value: filters.status,
              options: STATUS_OPTIONS,
            },
          ]}
        />
        <DataTable
          loading={listLoading}
          headers={[
            "Tarih",
            `${income ? "Gelir" : "Gider"} No`,
            "Açıklama",
            "Kategori",
            income ? "Müşteri / Alıcı" : "Tedarikçi",
            "Ödeme Tipi",
            "Tutar",
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

export default FinanceLedger;
