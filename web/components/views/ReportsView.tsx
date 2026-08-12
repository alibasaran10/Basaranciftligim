"use client";

import {
  BarChart3,
  Beef,
  Camera,
  FileBarChart,
  Leaf,
  PackageOpen,
  Settings,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { BarsChart } from "@/components/ui/Charts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api, withQuery } from "@/lib/api";
import { formatChange, formatDate, formatNumber, trendOf } from "@/lib/format";
import type { ReportRow, ReportSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

const CATEGORY_ICONS: Record<string, typeof Beef> = {
  suru_performansi: Beef,
  tarla_verim: Leaf,
  stok_hareketleri: PackageOpen,
  finansal_analiz: WalletCards,
  kamera_olaylari: Camera,
  sistem: Settings,
};

export function ReportsView() {
  const dispatch = useAppDispatch();
  const [category, setCategory] = useState<string>("");

  const { data: summary, loading, error, refetch } = useApi<ReportSummary>("/reports/summary");
  const { data: reports, loading: listLoading, refetch: refetchList } = useApi<ReportRow[]>(
    withQuery("/reports", { category: category || undefined, limit: 8 }),
  );

  const totals = summary?.totals;

  const download = async (report: ReportRow) => {
    try {
      await api.post(`/reports/${report.id}/download`);
      dispatch(showToast(`${report.title} indirilmeye hazır.`));
      refetch();
      refetchList();
    } catch {
      dispatch(showToast("Rapor indirilemedi."));
    }
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Raporlar"
        description="Tüm operasyon verilerinizi analiz edin ve yönetime hazır raporlar oluşturun."
        icon={<BarChart3 />}
        primaryLabel="Yeni Rapor"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<FileBarChart />}
          label="Hazır Rapor"
          value={formatNumber(totals?.total)}
          meta={`${formatNumber(totals?.categories)} kategori`}
          loading={loading}
        />
        <StatCard
          icon={<BarChart3 />}
          label="Bu Ay Oluşturulan"
          value={formatNumber(totals?.thisMonth)}
          meta={formatChange(totals?.thisMonthChangePercent, "vs geçen ay")}
          trend={trendOf(totals?.thisMonthChangePercent)}
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<WalletCards />}
          label="Planlanmış Rapor"
          value={formatNumber(totals?.scheduled)}
          meta="Otomatik gönderim"
          tone="purple"
          loading={loading}
        />
        <StatCard
          icon={<FileBarChart />}
          label="Dışa Aktarım"
          value={formatNumber(totals?.exports)}
          meta="PDF ve Excel"
          tone="orange"
          loading={loading}
        />
      </div>

      <div className="two-column-charts">
        <Panel title="Aylık Raporlama Aktivitesi">
          {summary ? <BarsChart data={summary.monthlyActivity} /> : <SkeletonBlock rows={4} height={26} />}
        </Panel>
        <Panel title="Rapor Kategorileri">
          <div className="report-card-grid">
            {!summary && <SkeletonBlock rows={4} height={40} />}
            {summary?.categories.map((item) => {
              const Icon = CATEGORY_ICONS[item.category] ?? FileBarChart;
              return (
                <button
                  key={item.category}
                  className={category === item.category ? "is-active" : ""}
                  onClick={() => setCategory(category === item.category ? "" : item.category)}
                >
                  <Icon />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.count} rapor</small>
                  </span>
                  <b>›</b>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel
        title={category ? "Filtrelenmiş Raporlar" : "Son Raporlar"}
        action={
          category ? (
            <button onClick={() => setCategory("")}>Filtreyi Temizle</button>
          ) : undefined
        }
      >
        <div className="report-list">
          {listLoading && !reports && <SkeletonBlock rows={5} height={38} />}
          {reports?.map((report) => (
            <div key={report.id}>
              <FileBarChart />
              <span>
                <strong>{report.title}</strong>
                <small>
                  {formatDate(report.generatedAt)} · {report.generatedBy}
                  {report.isScheduled && report.scheduleLabel ? ` · ${report.scheduleLabel}` : ""}
                </small>
              </span>
              <b>{report.format}</b>
              <button className="button button-secondary" onClick={() => download(report)}>
                İndir
              </button>
            </div>
          ))}
          {reports?.length === 0 && (
            <div>
              <FileBarChart />
              <span>
                <strong>Rapor bulunamadı</strong>
                <small>Bu kategori için oluşturulmuş rapor yok.</small>
              </span>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

export default ReportsView;
