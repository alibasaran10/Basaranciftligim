"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  PackageOpen,
  RefreshCcw,
  Warehouse,
} from "lucide-react";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatDate, formatDecimal, formatNumber, withUnit } from "@/lib/format";
import type { StockMovementRow, StockRow, StockSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export function StockView() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<StockSummary>("/stock/summary");

  const { data: items, meta, loading } = useApi<StockRow[]>(
    withQuery("/stock", {
      q: search || undefined,
      category: filters.category,
      warehouse: filters.warehouse,
      page,
      limit: 10,
    }),
  );

  const { data: movements } = useApi<StockMovementRow[]>("/stock/movements?limit=5");

  const totals = summary?.totals;

  const rows = (items ?? []).map((item) => [
    item.name,
    item.categoryLabel,
    item.warehouse,
    withUnit(item.quantity, item.unit),
    withUnit(item.minLevel, item.unit),
    item.lastIn,
    item.lastOut,
    item.levelLabel,
  ]);

  // Filtre secenekleri gercek verilerden turetilir.
  const categoryOptions = Array.from(
    new Map((items ?? []).map((i) => [i.category, i.categoryLabel])).entries(),
  ).map(([value, label]) => ({ value, label }));

  const warehouseOptions = Array.from(new Set((items ?? []).map((i) => i.warehouse))).map(
    (value) => ({ value, label: value }),
  );

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Stok Yönetimi"
        description="Silo, yem, saman, yonca ve diğer tarımsal stoklarınızı tek panelden takip edin."
        icon={<PackageOpen />}
        primaryLabel="Yeni Stok Girişi"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<Boxes />}
          label="Toplam Stok"
          value={formatDecimal(totals?.totalQuantity)}
          unit={totals?.unit ?? "Ton"}
          meta="Tüm ürünler"
          tone="orange"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Warehouse />}
          label="Aktif Silo / Depo"
          value={formatNumber(totals?.warehouses)}
          meta="Kullanımda"
          tone="blue"
          loading={summaryLoading}
        />
        <StatCard
          icon={<AlertTriangle />}
          label="Kritik Stok"
          value={formatNumber(totals?.criticalCount)}
          meta="Acil müdahale"
          tone="red"
          loading={summaryLoading}
        />
        <StatCard
          icon={<ArrowDownToLine />}
          label="Son Giriş"
          value={`+${formatDecimal(totals?.lastIn)}`}
          unit={totals?.unit ?? "Ton"}
          meta={`Son 7 gün · ${formatNumber(totals?.inMovements)} hareket`}
          trend="up"
          loading={summaryLoading}
        />
        <StatCard
          icon={<ArrowUpFromLine />}
          label="Son Çıkış"
          value={`-${formatDecimal(totals?.lastOut)}`}
          unit={totals?.unit ?? "Ton"}
          meta={`Son 7 gün · ${formatNumber(totals?.outMovements)} hareket`}
          trend="down"
          tone="red"
          loading={summaryLoading}
        />
        <StatCard
          icon={<RefreshCcw />}
          label="Stok Devir Oranı"
          value={formatDecimal(totals?.turnoverRate)}
          meta="Haftalık devir hızı"
          tone="orange"
          loading={summaryLoading}
        />
      </div>

      <div className="table-with-side">
        <Panel className="table-panel" title="Stok Listesi">
          <Filters
            placeholder="Ürün ara..."
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
                options: categoryOptions,
              },
              {
                name: "warehouse",
                placeholder: "Tüm Depolar",
                value: filters.warehouse,
                options: warehouseOptions,
              },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Ürün",
              "Kategori",
              "Depo / Silo",
              "Miktar",
              "Min. Seviye",
              "Son Giriş",
              "Son Çıkış",
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
        <div className="side-chart-stack">
          <Panel title="Stok Dağılımı (Ürün Bazında)">
            {summary ? (
              <DonutChart
                total={`${formatDecimal(totals?.totalQuantity)} ${totals?.unit ?? "Ton"}`}
                data={summary.distribution}
              />
            ) : (
              <SkeletonBlock rows={4} height={24} />
            )}
          </Panel>
          <Panel title="Aylık Stok Hareket Trendi">
            {summary ? <TrendChart data={summary.monthlyTrend} /> : <SkeletonBlock rows={4} height={24} />}
          </Panel>
        </div>
      </div>

      <div className="module-bottom-grid">
        <Panel title="Son Stok Hareketleri">
          <div className="activity-list">
            {!movements && <SkeletonBlock rows={4} height={18} />}
            {movements?.map((movement) => (
              <span key={movement.id}>
                <i className={`dot ${movement.direction === "cikis" ? "dot-red" : ""}`} />{" "}
                {movement.directionLabel} · {movement.itemName} · {movement.signedAmount}
                <time>{formatDate(movement.date)}</time>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Depo / Silo Doluluk Durumu">
          <div className="progress-list">
            {!summary && <SkeletonBlock rows={4} height={22} />}
            {summary?.warehouseFill.map((item) => (
              <span key={item.name}>
                <Warehouse />
                <b>{item.name}</b>
                <i>
                  <em style={{ width: `${item.value}%` }} />
                </i>
                <small>{item.value}%</small>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Kritik Stok Uyarıları">
          <div className="compact-list">
            {!summary && <SkeletonBlock rows={3} height={30} />}
            {summary?.criticalItems.map((item) => (
              <div key={item.id}>
                <AlertTriangle />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.warehouse}</small>
                </span>
                <b>
                  {withUnit(item.quantity, item.unit)} · {item.levelLabel}
                </b>
              </div>
            ))}
            {summary?.criticalItems.length === 0 && (
              <div>
                <PackageOpen />
                <span>
                  <strong>Kritik stok yok</strong>
                  <small>Tüm kalemler minimum seviyenin üzerinde.</small>
                </span>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default StockView;
