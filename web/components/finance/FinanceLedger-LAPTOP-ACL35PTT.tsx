"use client";

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Plus,
  X,
  Pencil,
  Eye,
  Trash2,
} from "lucide-react";
import { useState, FormEvent, ChangeEvent } from "react";

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

export function FinanceLedger({ type }: { type: "income" | "expense" }) {
  const dispatch = useAppDispatch();
  const income = type === "income";
  const apiType = income ? "gelir" : "gider";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  // Price Range Filter states
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [activeMinAmount, setActiveMinAmount] = useState<number | undefined>(undefined);
  const [activeMaxAmount, setActiveMaxAmount] = useState<number | undefined>(undefined);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedViewTx, setSelectedViewTx] = useState<FinanceTransactionRow | null>(null);
  const [selectedEditTx, setSelectedEditTx] = useState<FinanceTransactionRow | null>(null);

  // Form states for transaction
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(income ? "Süt Satışları" : "Yem");
  const [counterparty, setCounterparty] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("banka_havalesi");
  const [status, setStatus] = useState("tamamlandi");

  const { data, loading, error, refetch: refetchLedger } = useApi<FinanceLedgerData>(
    withQuery("/finance/ledger", { type: apiType }),
    [apiType],
  );

  const { data: transactions, meta, loading: listLoading, refetch: refetchList } = useApi<FinanceTransactionRow[]>(
    withQuery("/finance/transactions", {
      type: apiType,
      q: search || undefined,
      status: filters.status,
      category: filters.category,
      minAmount: activeMinAmount,
      maxAmount: activeMaxAmount,
      page,
      limit: 10,
    }),
    [apiType, activeMinAmount, activeMaxAmount],
  );

  const totals = data?.totals;

  // Handle amount input formatting with dots (e.g. 5.000 or 5.000.000)
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/[^0-9]/g, "");
    if (!rawDigits) {
      setAmount("");
      return;
    }
    const formatted = parseInt(rawDigits, 10).toLocaleString("tr-TR");
    setAmount(formatted);
  };

  const openAddModal = () => {
    setAmount("");
    setNotes("");
    setDescription("");
    setCategory(income ? "Süt Satışları" : "Yem");
    setCounterparty("");
    setPaymentMethod("banka_havalesi");
    setStatus("tamamlandi");
    setShowAddModal(true);
  };

  const openEditModal = (tx: FinanceTransactionRow) => {
    setAmount(tx.amount ? Math.round(tx.amount).toLocaleString("tr-TR") : "");
    setNotes(tx.notes || "");
    setDescription(tx.description || "");
    setCategory(tx.category || (income ? "Süt Satışları" : "Yem"));
    setCounterparty(tx.counterparty !== "—" ? tx.counterparty : "");
    setPaymentMethod(tx.paymentMethod || "banka_havalesi");
    setStatus(tx.status || "tamamlandi");
    setSelectedEditTx(tx);
    setSelectedViewTx(null);
  };

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    const rawDigits = amount.replace(/[^0-9]/g, "");
    const numAmount = parseFloat(rawDigits);
    if (!numAmount || numAmount <= 0) {
      dispatch(showToast("Lütfen geçerli bir tutar girin."));
      return;
    }

    try {
      await api.post("/finance/transactions", {
        type: apiType,
        amount: numAmount,
        paidAmount: status === "tamamlandi" ? numAmount : 0,
        description: description || (income ? "Gelir Kaydı" : "Gider Kaydı"),
        category,
        notes: notes || (income ? `${category} geliri` : `${category} gideri`),
        counterparty: counterparty || undefined,
        paymentMethod,
        status,
        date: new Date().toISOString(),
      });

      dispatch(
        showToast(
          `${formatCurrency(numAmount)} tutarında yeni ${income ? "gelir" : "gider"} kaydı (${notes || category}) eklendi.`
        )
      );
      setShowAddModal(false);
      refetchLedger();
      refetchList();
    } catch {
      dispatch(showToast("İşlem kaydedilirken bir hata oluştu."));
    }
  };

  const handleUpdateTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEditTx) return;

    const rawDigits = amount.replace(/[^0-9]/g, "");
    const numAmount = parseFloat(rawDigits);
    if (!numAmount || numAmount <= 0) {
      dispatch(showToast("Lütfen geçerli bir tutar girin."));
      return;
    }

    try {
      await api.patch(`/finance/transactions/${selectedEditTx.id}`, {
        amount: numAmount,
        paidAmount: status === "tamamlandi" ? numAmount : 0,
        description,
        category,
        notes,
        counterparty: counterparty || undefined,
        paymentMethod,
        status,
      });

      dispatch(showToast(`${selectedEditTx.code} kaydı başarıyla güncellendi.`));
      setSelectedEditTx(null);
      refetchLedger();
      refetchList();
    } catch {
      dispatch(showToast("Güncelleme sırasında bir hata oluştu."));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Bu finans kaydını silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/finance/transactions/${id}`);
      dispatch(showToast("Kayıt silindi."));
      setSelectedViewTx(null);
      setSelectedEditTx(null);
      refetchLedger();
      refetchList();
    } catch {
      dispatch(showToast("Silinirken bir hata oluştu."));
    }
  };

  const rows = (transactions ?? []).map((tx) => [
    formatDate(tx.date),
    tx.code,
    tx.description,
    tx.category,
    tx.counterparty,
    tx.paymentMethodLabel,
    <div key={tx.id}>
      <strong style={{ fontSize: "14px", color: income ? "#10b981" : "inherit" }}>
        {formatCurrency(tx.amount)}
      </strong>
      <small
        style={{
          display: "block",
          color: "var(--muted)",
          fontSize: "12px",
          marginTop: "2px",
          fontWeight: 600,
        }}
      >
        {tx.notes || `${tx.category} ${income ? "geliri" : "gideri"}`}
      </small>
    </div>,
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
        primaryLabel=""
        hideDateFilter
      />

      {error && <ErrorState message={error} onRetry={() => { refetchLedger(); refetchList(); }} />}

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

      <Panel
          title={`${income ? "Gelir" : "Gider"} Kayıtları`}
          style={{ width: "100%" }}
          action={
            <button className="button button-primary button-sm" onClick={openAddModal}>
              <Plus size={15} /> {income ? "Yeni Gelir Ekle" : "Yeni Gider Ekle"}
            </button>
          }
        >
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
            onFilterToggle={() => setShowPriceFilter((prev) => !prev)}
            isFilterActive={showPriceFilter || activeMinAmount !== undefined || activeMaxAmount !== undefined}
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

          {/* Fiyat Aralığı Filtreleme Paneli */}
          {showPriceFilter && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "var(--surface-2)",
                padding: "12px 16px",
                borderRadius: "10px",
                margin: "12px 0 16px 0",
                flexWrap: "wrap",
                border: "1px solid var(--line)",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Fiyat Aralığı (TL):</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="En Az (Örn: 1.000)"
                value={minAmountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setMinAmountInput(raw ? parseInt(raw, 10).toLocaleString("tr-TR") : "");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  width: "160px",
                  background: "var(--surface)",
                  color: "inherit",
                  fontSize: "13px",
                }}
              />
              <span style={{ color: "var(--muted)" }}>—</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="En Çok (Örn: 50.000)"
                value={maxAmountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setMaxAmountInput(raw ? parseInt(raw, 10).toLocaleString("tr-TR") : "");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  width: "160px",
                  background: "var(--surface)",
                  color: "inherit",
                  fontSize: "13px",
                }}
              />
              <button
                type="button"
                className="button button-primary button-sm"
                onClick={() => {
                  const minVal = minAmountInput ? parseFloat(minAmountInput.replace(/\./g, "")) : undefined;
                  const maxVal = maxAmountInput ? parseFloat(maxAmountInput.replace(/\./g, "")) : undefined;
                  setActiveMinAmount(minVal);
                  setActiveMaxAmount(maxVal);
                  setPage(1);
                  dispatch(showToast("Fiyat aralığı filtresi uygulandı."));
                }}
              >
                Filtrele
              </button>
              {(activeMinAmount !== undefined || activeMaxAmount !== undefined || minAmountInput || maxAmountInput) && (
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  onClick={() => {
                    setMinAmountInput("");
                    setMaxAmountInput("");
                    setActiveMinAmount(undefined);
                    setActiveMaxAmount(undefined);
                    setPage(1);
                    dispatch(showToast("Fiyat filtresi temizlendi."));
                  }}
                >
                  Filtreyi Temizle
                </button>
              )}
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
              "Tutar ve Not",
              "Durum",
            ]}
            rows={rows}
            onViewRow={(index) => {
              if (transactions && transactions[index]) {
                setSelectedViewTx(transactions[index]);
              }
            }}
            onEditRow={(index) => {
              if (transactions && transactions[index]) {
                openEditModal(transactions[index]);
              }
            }}
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

      {/* MODAL 1: Görüntüleme Modu (View Detail Modal) */}
      {selectedViewTx && (
        <div className="modal-backdrop" onClick={() => setSelectedViewTx(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "28px",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="breadcrumb">{selectedViewTx.code}</span>
                <h3 style={{ margin: 0, fontSize: "20px" }}>İşlem Detayları</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedViewTx(null)}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--surface-2)", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Tutar & Tür</span>
                <strong style={{ fontSize: "18px", color: income ? "#10b981" : "#ef4444" }}>
                  {formatCurrency(selectedViewTx.amount)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Gider/Gelir Notu</span>
                <strong style={{ fontSize: "14px" }}>{selectedViewTx.notes || selectedViewTx.category}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Açıklama</span>
                <span>{selectedViewTx.description}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Kategori</span>
                <span>{selectedViewTx.category}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{income ? "Müşteri / Alıcı" : "Tedarikçi"}</span>
                <span>{selectedViewTx.counterparty}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Ödeme Yöntemi</span>
                <span>{selectedViewTx.paymentMethodLabel}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Tarih</span>
                <span>{formatDate(selectedViewTx.date)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Durum</span>
                <span className="badge badge-green">{selectedViewTx.statusLabel}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button
                type="button"
                className="button button-danger"
                onClick={() => handleDeleteTransaction(selectedViewTx.id)}
              >
                <Trash2 size={16} /> Sil
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedViewTx(null)}
                >
                  Kapat
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => openEditModal(selectedViewTx)}
                >
                  <Pencil size={16} /> Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ekleme Modalı */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "28px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px" }}>Yeni {income ? "Gelir" : "Gider"} Kaydı Ekleyin</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddTransaction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Tutar (TL) *
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Örn: 5.000 veya 5.000.000"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Ödeme Durumu
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="tamamlandi">{income ? "Tahsil Edildi" : "Ödendi"}</option>
                    <option value="beklemede">Beklemede</option>
                    <option value="kismi">Kısmi Ödeme</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Gider / Gelir Notu (Tabloda Görünecek Not) *
                </label>
                <input
                  required
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: YEM gideri veya Süt Satış geliri"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  İşlem Açıklaması
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={income ? "Örn: Günlük Süt Satışı" : "Örn: 50 Torba Kesif Yem Alımı"}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
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
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {income ? "Müşteri / Alıcı" : "Tedarikçi"}
                  </label>
                  <input
                    type="text"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder={income ? "Örn: Mandıra A.Ş." : "Örn: Karaova Yem San."}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
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
                <button type="submit" className="button button-primary">
                  {income ? "Geliri Kaydet" : "Gideri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Düzenleme Modalı (Edit Modal) */}
      {selectedEditTx && (
        <div className="modal-backdrop" onClick={() => setSelectedEditTx(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "28px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="breadcrumb">{selectedEditTx.code}</span>
                <h3 style={{ margin: 0, fontSize: "20px" }}>İşlem Kaydını Düzenle</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedEditTx(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateTransaction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Tutar (TL) *
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Örn: 5.000 veya 5.000.000"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Ödeme Durumu
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="tamamlandi">{income ? "Tahsil Edildi" : "Ödendi"}</option>
                    <option value="beklemede">Beklemede</option>
                    <option value="kismi">Kısmi Ödeme</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Gider / Gelir Notu (Tabloda Görünecek Not) *
                </label>
                <input
                  required
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: YEM gideri veya Süt Satış geliri"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  İşlem Açıklaması
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={income ? "Örn: Günlük Süt Satışı" : "Örn: 50 Torba Kesif Yem Alımı"}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
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
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {income ? "Müşteri / Alıcı" : "Tedarikçi"}
                  </label>
                  <input
                    type="text"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder={income ? "Örn: Mandıra A.Ş." : "Örn: Karaova Yem San."}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
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
                  className="button button-danger"
                  onClick={() => handleDeleteTransaction(selectedEditTx.id)}
                >
                  <Trash2 size={16} /> Sil
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditTx(null)}
                  >
                    İptal
                  </button>
                  <button type="submit" className="button button-primary">
                    Değişiklikleri Kaydet
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
