"use client";

import { Banknote, Coins, PiggyBank, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { BarsChart, DonutChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatChange, formatCurrency, formatDate, formatPercent, trendOf } from "@/lib/format";
import type { FinanceSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export function FinanceOverviewView() {
  const { data, loading, error, refetch } = useApi<FinanceSummary>("/finance/summary");
  const totals = data?.totals;

  const rows = (data?.recentTransactions ?? []).map((tx) => [
    formatDate(tx.date),
    tx.description,
    tx.category,
    tx.type === "gelir" ? "Gelir" : "Gider",
    formatCurrency(tx.amount),
    tx.statusLabel,
  ]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow="Finansal / Genel Bakış"
        title="Finansal Genel Bakış"
        description={data ? `${data.year} yılı gerçekleşen tutarları` : undefined}
        primaryLabel="Rapor Al"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<TrendingUp />}
          label="Toplam Gelir"
          value={formatCurrency(totals?.income)}
          meta={formatChange(totals?.incomeChangePercent, "geçen yıla göre")}
          trend={trendOf(totals?.incomeChangePercent)}
          loading={loading}
        />
        <StatCard
          icon={<TrendingDown />}
          label="Toplam Gider"
          value={formatCurrency(totals?.expense)}
          meta={formatChange(totals?.expenseChangePercent, "geçen yıla göre")}
          trend={trendOf(totals?.expenseChangePercent)}
          tone="red"
          loading={loading}
        />
        <StatCard
          icon={<WalletCards />}
          label="Net Kâr"
          value={formatCurrency(totals?.net)}
          meta={formatChange(totals?.netChangePercent, "geçen yıla göre")}
          trend={trendOf(totals?.netChangePercent)}
          loading={loading}
        />
        <StatCard
          icon={<PiggyBank />}
          label="Kâr Marjı"
          value={formatPercent(totals?.marginPercent)}
          meta={formatChange(totals?.marginChangePercent, "geçen yıla göre")}
          trend={trendOf(totals?.marginChangePercent)}
          tone="purple"
          loading={loading}
        />
      </div>

      <div className="finance-overview-grid">
        <Panel title="Aylara Göre Gelir, Gider ve Kâr">
          {data ? <BarsChart data={data.monthly} finance /> : <SkeletonBlock rows={5} height={26} />}
        </Panel>

        <Panel title="Gider Dağılımı">
          {data ? (
            <DonutChart total={formatCurrency(totals?.expense)} data={data.expenseDistribution} />
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>

        <Panel title="Nakit Durumu">
          {data ? (
            <div className="cash-card">
              <Coins />
              <span>
                <small>Toplam Bakiye</small>
                <strong>{formatCurrency(data.cash.total)}</strong>
              </span>
              <hr />
              <p>
                <span>Kasa</span>
                <b>{formatCurrency(data.cash.cash)}</b>
              </p>
              <p>
                <span>Bankalar</span>
                <b>{formatCurrency(data.cash.bank)}</b>
              </p>
              <Link className="button button-secondary" href="/finans/gelirler">
                Kasa / Banka Detayı
              </Link>
            </div>
          ) : (
            <SkeletonBlock rows={4} height={26} />
          )}
        </Panel>
      </div>

      <div className="finance-bottom-grid">
        <Panel title="Son İşlemler" className="table-panel">
          <DataTable
            loading={loading}
            headers={["Tarih", "Açıklama", "Kategori", "Tür", "Tutar", "Durum"]}
            rows={rows}
          />
        </Panel>

        <Panel title="Bütçe Durumu">
          <div className="budget-list">
            {!data && <SkeletonBlock rows={5} height={22} />}
            {data?.budgets.map((budget) => (
              <span key={budget.id}>
                <b>{budget.category}</b>
                <small>{budget.usagePercent}%</small>
                <i>
                  <em style={{ width: `${budget.usagePercent}%` }} />
                </i>
              </span>
            ))}
            {data?.budgets.length === 0 && (
              <span>
                <b>Bütçe tanımlı değil</b>
                <small>0%</small>
                <i>
                  <em style={{ width: "0%" }} />
                </i>
              </span>
            )}
          </div>
        </Panel>

        <Panel title="Finansal Özet">
          <div className="compact-list">
            {!data && <SkeletonBlock rows={4} height={30} />}
            {data && (
              <>
                <div>
                  <Banknote />
                  <span>
                    <strong>Toplam Alacaklar</strong>
                  </span>
                  <b>{formatCurrency(data.balances.receivables)}</b>
                </div>
                <div>
                  <TrendingDown />
                  <span>
                    <strong>Toplam Borçlar</strong>
                  </span>
                  <b>{formatCurrency(data.balances.payables)}</b>
                </div>
                <div>
                  <TrendingUp />
                  <span>
                    <strong>Dönem Net Nakit Akışı</strong>
                  </span>
                  <b>{formatCurrency(data.balances.netCashFlow)}</b>
                </div>
                <div>
                  <Coins />
                  <span>
                    <strong>Yıllık Yatırım</strong>
                  </span>
                  <b>{formatCurrency(data.balances.annualInvestment)}</b>
                </div>
              </>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default FinanceOverviewView;
