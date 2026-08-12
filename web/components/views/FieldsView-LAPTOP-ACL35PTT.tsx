"use client";

import { AlertTriangle, Droplets, Leaf, Map, Sprout, Wheat, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api, withQuery } from "@/lib/api";
import { formatDate, formatNumber, formatPercent, withUnit } from "@/lib/format";
import type { FieldRow, FieldSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

export const CROP_OPTIONS = [
  "Ryegrass",
  "Buğday",
  "Arpa",
  "Yulaf",
  "Silajlık Mısır",
  "Yonca",
  "Ayçiçeği",
  "Şeker Pancarı",
  "Fiğ",
  "Soya",
  "Karpuz",
  "Biber",
  "Domates",
];

export function FieldsView() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New field form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Ryegrass");
  const [areaDonum, setAreaDonum] = useState("35");
  const [soilType, setSoilType] = useState("Killi Tınlı");
  const [irrigationMethod, setIrrigationMethod] = useState("Damlama");

  const { data: summary, loading: summaryLoading, error, refetch: refetchSummary } =
    useApi<FieldSummary>("/fields/summary");

  const listPath = withQuery("/fields/view", {
    q: search || undefined,
    crop: crop || undefined,
    page,
    limit: 10,
  });
  const { data: fields, meta, loading, refetch: refetchList } = useApi<FieldRow[]>(listPath);

  const totals = summary?.totals;

  const handleAddField = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      await api.post("/fields", {
        name,
        code: code || `Parsel ${Math.floor(Math.random() * 20) + 1}A`,
        crop: selectedCrop,
        areaDonum: parseFloat(areaDonum) || 30,
        soilType,
        irrigation: {
          method: irrigationMethod,
          status: "iyi",
          moisturePercent: 65,
        },
        boundary: {
          type: "Polygon",
          coordinates: [
            [
              [37.015, 39.745],
              [37.018, 39.745],
              [37.018, 39.748],
              [37.015, 39.748],
              [37.015, 39.745],
            ],
          ],
        },
      });

      dispatch(showToast(`${name} (${selectedCrop}) tarlası başarıyla eklendi.`));
      setShowAddModal(false);
      setName("");
      setCode("");
      refetchSummary();
      refetchList();
    } catch {
      dispatch(showToast("Tarla eklenirken bir hata oluştu."));
    }
  };

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

      {error && <ErrorState message={error} onRetry={() => { refetchSummary(); refetchList(); }} />}

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
        <Panel
          className="table-panel"
          title="Tarla Listesi"
          action={
            <button className="button button-primary button-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Yeni Tarla Ekle
            </button>
          }
        >
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
                options: CROP_OPTIONS.map((c) => ({ value: c, label: c })),
              },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Tarla",
              "Alan (da)",
              "Toprak Tipi",
              "Ekili Ürün",
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
          <Panel title="Ürün Dağılımı (Dönüm)">
            {summary ? (
              <DonutChart
                total={`${formatNumber(totals?.areaDonum)} da`}
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

      {/* Yeni Tarla Ekle Modalı */}
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
              <h3 style={{ margin: 0, fontSize: "20px" }}>Yeni Tarla Kaydı Oluştur</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddField} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Tarla Adı *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Kuzey Tarlası - Yonca Parseli"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Parsel / Kod
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Örn: Parsel 12A"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Alan (Dönüm) *
                  </label>
                  <input
                    required
                    type="number"
                    value={areaDonum}
                    onChange={(e) => setAreaDonum(e.target.value)}
                    placeholder="35"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Ekilen Ürün / Mahsul *
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Toprak Tipi
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option>Killi Tınlı</option>
                    <option>Kumlu Tınlı</option>
                    <option>Tınlı</option>
                    <option>Humuslu</option>
                    <option>Kireçli</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Sulama Yöntemi
                  </label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option>Damlama</option>
                    <option>Yağmurlama</option>
                    <option>Pivot</option>
                    <option>Salma Sulama</option>
                  </select>
                </div>
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
                  Tarlayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldsView;
