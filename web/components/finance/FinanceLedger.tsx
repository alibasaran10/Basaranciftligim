"use client";

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { BarsChart, DonutChart, RingProgress } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api, withQuery } from "@/lib/api";
import {
  formatChange,
  formatCurrency,
  formatDate,
  formatPercent,
  trendOf,
} from "@/lib/format";
import type { FinanceLedgerData, FinanceTransactionRow } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

const STATUS_OPTIONS = [
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "kismi", label: "Kısmi" },
  { value: "beklemede", label: "Beklemede" },
];

const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Son 7 Gün" },
  { value: "30", label: "Son 30 Gün" },
  { value: "90", label: "Son 90 Gün" },
  { value: "365", label: "Bu Yıl (365 Gün)" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Tarih: Yeniden Eskiye" },
  { value: "date_asc", label: "Tarih: Eskiden Yeniye" },
  { value: "amount_desc", label: "Tutar: Yüksekten Düşüğe" },
  { value: "amount_asc", label: "Tutar: Düşükten Yükseğe" },
];

export function FinanceLedger({ type }: { type: "income" | "expense" }) {
  const dispatch = useAppDispatch();
  const income = type === "income";
  const apiType = income ? "gelir" : "gider";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    days: "",
    sortBy: "date_desc",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [page, setPage] = useState(1);

  // Filter Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAmountFilterModal, setShowAmountFilterModal] = useState(false);

  // Modals state & Smooth scroll refs
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedViewTx, setSelectedViewTx] = useState<FinanceTransactionRow | null>(null);
  const [selectedEditTx, setSelectedEditTx] = useState<FinanceTransactionRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddModal && addModalRef.current) {
      addModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddModal]);

  useEffect(() => {
    if (selectedEditTx && editModalRef.current) {
      editModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEditTx]);

  useEffect(() => {
    if (selectedViewTx && viewModalRef.current) {
      viewModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedViewTx]);

  // Form states for Add/Edit
  const [editForm, setEditForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    status: "tamamlandi",
    description: "",
    category: income ? "Süt Satışları" : "Yem",
    counterparty: "",
    paymentMethod: "banka_havalesi",
  });

  const { data, loading, error, refetch: refetchLedger } = useApi<FinanceLedgerData>(
    withQuery("/finance/ledger", { type: apiType }),
    [apiType],
  );

  const {
    data: transactions,
    meta,
    loading: listLoading,
    refetch: refetchTransactions,
  } = useApi<FinanceTransactionRow[]>(
    withQuery("/finance/transactions", {
      type: apiType,
      q: search || undefined,
      status: filters.status || undefined,
      category: filters.category || undefined,
      days: filters.days || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      sortBy: filters.sortBy || undefined,
      page,
      limit: 12,
    }),
    [
      apiType,
      search,
      filters.status,
      filters.category,
      filters.days,
      filters.startDate,
      filters.endDate,
      filters.minAmount,
      filters.maxAmount,
      filters.sortBy,
      page,
    ],
  );

  const refetchAll = () => {
    refetchLedger();
    refetchTransactions();
  };

  const totals = data?.totals;

  const rows = (transactions ?? []).map((tx) => [
    formatDate(tx.date),
    tx.code,
    tx.description,
    tx.category,
    tx.counterparty || "—",
    tx.paymentMethodLabel || tx.paymentMethod,
    formatCurrency(tx.amount),
    tx.statusLabel || tx.status,
  ]);

  const handleHeaderFilterClick = (headerName: string) => {
    if (headerName === "Tarih") {
      setShowFilterModal(true);
    } else if (headerName === "Tutar") {
      setShowAmountFilterModal(true);
    }
  };

  const handleOpenAddModal = () => {
    setEditForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      status: "tamamlandi",
      description: "",
      category: income ? "Süt Satışları" : "Yem",
      counterparty: "",
      paymentMethod: "banka_havalesi",
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tx: FinanceTransactionRow) => {
    setSelectedEditTx(tx);
    let formattedDate = new Date().toISOString().split("T")[0];
    if (tx.date) {
      try {
        formattedDate = new Date(tx.date).toISOString().split("T")[0];
      } catch {}
    }
    setEditForm({
      date: formattedDate,
      amount: String(tx.amount || ""),
      status: tx.status || "tamamlandi",
      description: tx.description || "",
      category: tx.category || (income ? "Süt Satışları" : "Yem"),
      counterparty: tx.counterparty || "",
      paymentMethod: tx.paymentMethod || "banka_havalesi",
    });
  };

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numAmount = parseFloat(editForm.amount.replace(/[^0-9.]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      dispatch(showToast("Geçerli bir tutar girin."));
      return;
    }
    setSubmitting(true);
    try {
      const selectedDateISO = editForm.date
        ? new Date(editForm.date + "T12:00:00.000Z").toISOString()
        : new Date().toISOString();

      await api.post("/finance/transactions", {
        type: apiType,
        amount: numAmount,
        status: editForm.status,
        description: editForm.description,
        category: editForm.category,
        counterparty: editForm.counterparty,
        paymentMethod: editForm.paymentMethod,
        date: selectedDateISO,
      });
      dispatch(showToast(`${income ? "Gelir" : "Gider"} kaydı başarıyla eklendi.`));
      setShowAddModal(false);
      refetchAll();
    } catch (err: any) {
      console.error("Add transaction error:", err);
      dispatch(showToast("Kayıt eklenirken bir hata oluştu."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditTx) return;
    const numAmount = parseFloat(editForm.amount.replace(/[^0-9.]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      dispatch(showToast("Geçerli bir tutar girin."));
      return;
    }
    setSubmitting(true);
    try {
      const selectedDateISO = editForm.date
        ? new Date(editForm.date + "T12:00:00.000Z").toISOString()
        : new Date().toISOString();

      await api.patch(`/finance/transactions/${selectedEditTx.id}`, {
        amount: numAmount,
        status: editForm.status,
        description: editForm.description,
        category: editForm.category,
        counterparty: editForm.counterparty,
        paymentMethod: editForm.paymentMethod,
        date: selectedDateISO,
      });
      dispatch(showToast("İşlem kaydı başarıyla güncellendi."));
      setSelectedEditTx(null);
      refetchAll();
    } catch (err: any) {
      console.error("Edit transaction error:", err);
      dispatch(showToast("Kayıt güncellenirken bir hata oluştu."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async (tx: FinanceTransactionRow) => {
    if (!confirm(`${tx.code} kodlu kaydı silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/finance/transactions/${tx.id}`);
      dispatch(showToast("Kayıt silindi."));
      setSelectedViewTx(null);
      setSelectedEditTx(null);
      refetchAll();
    } catch {
      dispatch(showToast("Kayıt silinemedi."));
    }
  };

  const hasActiveCustomFilters =
    Boolean(filters.days) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.minAmount) ||
    Boolean(filters.maxAmount) ||
    filters.sortBy !== "date_desc";

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow={`Finansal / ${income ? "Gelirler" : "Giderler"}`}
        title={income ? "Gelirler" : "Giderler"}
        description={`Çiftliğinizin tüm ${
          income ? "gelir kaynaklarını ve tahsilatlarını" : "gider kalemlerini ve ödemelerini"
        } yönetin.`}
        primaryLabel={income ? "Yeni Gelir Ekle" : "Yeni Gider Ekle"}
        onPrimaryClick={handleOpenAddModal}
        onFilterClick={() => setShowFilterModal(true)}
      />

      {error && <ErrorState message={error} onRetry={refetchAll} />}

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
          placeholder={income ? "Gelir ara (Açıklama, Kod, Alıcı)..." : "Gider ara (Açıklama, Kod, Tedarikçi)..."}
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
            {
              name: "days",
              placeholder: "Tüm Zamanlar",
              value: filters.days,
              options: DATE_RANGE_OPTIONS,
            },
            {
              name: "sortBy",
              placeholder: "Sıralama Seçin",
              value: filters.sortBy,
              options: SORT_OPTIONS,
            },
          ]}
        />

        {hasActiveCustomFilters && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px",
              background: "var(--surface-2)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              marginBottom: "8px",
            }}
          >
            <span>Filtreler Aktif:</span>
            {filters.days && <b>Son {filters.days} Gün</b>}
            {filters.startDate && <b>Başlangıç: {filters.startDate}</b>}
            {filters.endDate && <b>Bitiş: {filters.endDate}</b>}
            {filters.minAmount && <b>Min: {filters.minAmount} TL</b>}
            {filters.maxAmount && <b>Max: {filters.maxAmount} TL</b>}
            {filters.sortBy !== "date_desc" && (
              <b>
                Sıralama: {SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label}
              </b>
            )}
            <button
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--red)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
              onClick={() => {
                setFilters({
                  status: "",
                  category: "",
                  days: "",
                  startDate: "",
                  endDate: "",
                  minAmount: "",
                  maxAmount: "",
                  sortBy: "date_desc",
                });
                setPage(1);
              }}
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

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
          onHeaderFilterClick={handleHeaderFilterClick}
          onView={(index) => {
            const tx = transactions?.[index];
            if (tx) setSelectedViewTx(tx);
          }}
          onEdit={(index) => {
            const tx = transactions?.[index];
            if (tx) handleOpenEditModal(tx);
          }}
          onDelete={(index) => {
            const tx = transactions?.[index];
            if (tx) handleDeleteSubmit(tx);
          }}
        />
      </Panel>

      {/* FILTER MODAL 1: Üst Başlık Filtrele Modalı (Miktar + Tarih + Sıralama) */}
      {showFilterModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowFilterModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={18} style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Gelişmiş İşlem Filtresi</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowFilterModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Sıralama Seçeneği
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((c) => ({ ...c, sortBy: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="date_desc">Tarih: Yeniden Eskiye (En Yeni İlk)</option>
                  <option value="date_asc">Tarih: Eskiden Yeniye (En Eski İlk)</option>
                  <option value="amount_desc">Tutar: En Yüksek → En Düşük</option>
                  <option value="amount_asc">Tutar: En Düşük → En Yüksek</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  Miktar / Tutar Aralığı (TL)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Min Tutar
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 1000"
                      value={filters.minAmount}
                      onChange={(e) => setFilters((c) => ({ ...c, minAmount: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Max Tutar
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 50000"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters((c) => ({ ...c, maxAmount: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Hızlı Zaman Aralığı
                </label>
                <select
                  value={filters.days}
                  onChange={(e) => setFilters((c) => ({ ...c, days: e.target.value, startDate: "", endDate: "" }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="">Tüm Zamanlar</option>
                  <option value="7">Son 7 Gün</option>
                  <option value="30">Son 30 Gün</option>
                  <option value="90">Son 90 Gün</option>
                  <option value="365">Son 365 Gün</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  Veya Özel Tarih Aralığı Seçin
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((c) => ({ ...c, startDate: e.target.value, days: "" }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((c) => ({ ...c, endDate: e.target.value, days: "" }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setFilters((c) => ({
                      ...c,
                      days: "",
                      startDate: "",
                      endDate: "",
                      minAmount: "",
                      maxAmount: "",
                      sortBy: "date_desc",
                    }));
                    setShowFilterModal(false);
                    setPage(1);
                  }}
                >
                  Filtreleri Sıfırla
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setShowFilterModal(false);
                    setPage(1);
                  }}
                >
                  Filtreyi Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL 2: Tutar Filtreleme Modalı */}
      {showAmountFilterModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAmountFilterModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={18} style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Miktar / Tutar Filtresi</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAmountFilterModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Tutar Sıralaması
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((c) => ({ ...c, sortBy: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="date_desc">Varsayılan (Tarihe Göre)</option>
                  <option value="amount_desc">En Yüksek Tutar → En Düşük Tutar</option>
                  <option value="amount_asc">En Düşük Tutar → En Yüksek Tutar</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  Tutar Aralığı (TL)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Min Tutar
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minAmount}
                      onChange={(e) => setFilters((c) => ({ ...c, minAmount: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                      Max Tutar
                    </label>
                    <input
                      type="number"
                      placeholder="999999"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters((c) => ({ ...c, maxAmount: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setFilters((c) => ({ ...c, minAmount: "", maxAmount: "", sortBy: "date_desc" }));
                    setShowAmountFilterModal(false);
                    setPage(1);
                  }}
                >
                  Sıfırla
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setShowAmountFilterModal(false);
                    setPage(1);
                  }}
                >
                  Filtreyi Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Görüntüleme Modalı (View Modal) */}
      {selectedViewTx && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedViewTx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            ref={viewModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {selectedViewTx.code}
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  İşlem Detayları
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedViewTx(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Tarih</span>
                <strong>{formatDate(selectedViewTx.date)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Açıklama</span>
                <strong>{selectedViewTx.description || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Kategori</span>
                <strong>{selectedViewTx.category}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>{income ? "Müşteri / Alıcı" : "Tedarikçi"}</span>
                <strong>{selectedViewTx.counterparty || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Ödeme Yöntemi</span>
                <strong>{selectedViewTx.paymentMethodLabel || selectedViewTx.paymentMethod}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--muted)" }}>Tutar</span>
                <strong style={{ fontSize: "1.1rem", color: income ? "var(--green-600)" : "var(--red)" }}>
                  {formatCurrency(selectedViewTx.amount)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--muted)" }}>Durum</span>
                <strong>{selectedViewTx.statusLabel || selectedViewTx.status}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  const tx = selectedViewTx;
                  setSelectedViewTx(null);
                  handleOpenEditModal(tx);
                }}
              >
                Düzenle
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedViewTx(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Yeni Kayıt Ekle Modalı (Add Modal) */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="modal-content"
            ref={addModalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Yeni {income ? "Gelir" : "Gider"} Kaydı Ekleyin
              </h3>
              <button
                className="icon-button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    İşlem Tarihi *
                  </label>
                  <input
                    required
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tutar (TL) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    placeholder="Örn: 15000"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Durum
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="tamamlandi">{income ? "Tahsil Edildi" : "Ödendi"}</option>
                  <option value="beklemede">Beklemede</option>
                  <option value="kismi">Kısmi Ödeme</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama *
                </label>
                <input
                  required
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={income ? "Örn: Günlük Süt Satışı" : "Örn: 50 Torba Kesif Yem Alımı"}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    {income ? (
                      <>
                        <option>Süt Satışları</option>
                        <option>Hayvan Satışı</option>
                        <option>Mahsul Satışı</option>
                        <option>Devlet Teşviki / Hibe</option>
                        <option>Diğer Gelirler</option>
                      </>
                    ) : (
                      <>
                        <option>Yem</option>
                        <option>Gübre</option>
                        <option>İlaç / Aşılama</option>
                        <option>Tohum</option>
                        <option>Yakıt / Mazot</option>
                        <option>Veteriner Hizm.</option>
                        <option>Ekipman / Bakım</option>
                        <option>Diğer Giderler</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    {income ? "Müşteri / Alıcı" : "Tedarikçi"}
                  </label>
                  <input
                    type="text"
                    value={editForm.counterparty}
                    onChange={(e) => setEditForm({ ...editForm, counterparty: e.target.value })}
                    placeholder={income ? "Örn: Mandıra A.Ş." : "Örn: Yem Sanayi A.Ş."}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Ödeme Yöntemi
                </label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="banka_havalesi">Banka Havalesi</option>
                  <option value="eft">EFT</option>
                  <option value="nakit">Nakit</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                  <option value="cek">Çek</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? "Kaydediliyor…" : income ? "Geliri Kaydet" : "Gideri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Düzenleme Modalı (Edit Modal) */}
      {selectedEditTx && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEditTx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            ref={editModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {selectedEditTx.code}
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  İşlem Kaydını Düzenle
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedEditTx(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    İşlem Tarihi *
                  </label>
                  <input
                    required
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tutar (TL) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    placeholder="Örn: 15000"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Durum
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="tamamlandi">{income ? "Tahsil Edildi" : "Ödendi"}</option>
                  <option value="beklemede">Beklemede</option>
                  <option value="kismi">Kısmi Ödeme</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama *
                </label>
                <input
                  required
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={income ? "Örn: Günlük Süt Satışı" : "Örn: 50 Torba Kesif Yem Alımı"}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    {income ? (
                      <>
                        <option>Süt Satışları</option>
                        <option>Hayvan Satışı</option>
                        <option>Mahsul Satışı</option>
                        <option>Devlet Teşviki / Hibe</option>
                        <option>Diğer Gelirler</option>
                      </>
                    ) : (
                      <>
                        <option>Yem</option>
                        <option>Gübre</option>
                        <option>İlaç / Aşılama</option>
                        <option>Tohum</option>
                        <option>Yakıt / Mazot</option>
                        <option>Veteriner Hizm.</option>
                        <option>Ekipman / Bakım</option>
                        <option>Diğer Giderler</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    {income ? "Müşteri / Alıcı" : "Tedarikçi"}
                  </label>
                  <input
                    type="text"
                    value={editForm.counterparty}
                    onChange={(e) => setEditForm({ ...editForm, counterparty: e.target.value })}
                    placeholder={income ? "Örn: Mandıra A.Ş." : "Örn: Yem Sanayi A.Ş."}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Ödeme Yöntemi
                </label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                >
                  <option value="banka_havalesi">Banka Havalesi</option>
                  <option value="eft">EFT</option>
                  <option value="nakit">Nakit</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                  <option value="cek">Çek</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={() => handleDeleteSubmit(selectedEditTx)}
                >
                  Kaydı Sil
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditTx(null)}
                  >
                    İptal
                  </button>
                  <button type="submit" className="button button-primary" disabled={submitting}>
                    {submitting ? "Kaydediliyor…" : "Güncelle"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceLedger;
