"use client";

import {
  Activity,
  AlarmClock,
  BatteryCharging,
  Beef,
  Bluetooth,
  CalendarDays,
  HeartPulse,
  MapPin,
  Milk,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Wifi,
  Plus,
  Trash2,
  Skull,
  Baby,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/ui/Charts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatTime,
  withUnit,
} from "@/lib/format";
import type { AnimalDetail } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

const TABS = [
  "Genel Bilgiler",
  "Geçmiş Yavrular / Çocuklar",
  "Sağlık Geçmişi",
  "Biyolojik Takvim",
  "Sensör Verileri",
  "Kamera Kayıtları",
];

function signalLabel(rssiOrBattery?: number | null) {
  if (rssiOrBattery === null || rssiOrBattery === undefined) return "—";
  if (rssiOrBattery >= 70) return "Güçlü";
  if (rssiOrBattery >= 40) return "Orta";
  return "Zayıf";
}

export function HerdDetailView({ animalId }: { animalId: string }) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEarTag, setNewEarTag] = useState("");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("disi");
  const [newBirthDate, setNewBirthDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, loading, error, refetch } = useApi<AnimalDetail>(
    `/animals/${animalId}/detail`,
  );

  if (error) {
    return (
      <div className="page-stack page-enter">
        <PageHeader title="Sürü Yönetimi Detay" eyebrow="Sürü Yönetimi / Detay" primaryLabel="Düzenle" />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const animal = data?.animal;
  const device = animal?.device ?? null;
  const activeAlert = data?.alerts.find((a) => a.status !== "cozuldu") ?? data?.alerts[0] ?? null;
  const offspring = data?.offspring ?? [];

  const derived = data?.derived;
  const daysToBirth = derived?.daysToBirth ?? null;

  // Yavruyu VEFAT ETTİ (Öldü) olarak işaretle
  const markDeceased = async (childId: string, childTag: string) => {
    if (!confirm(`${childTag} küpeli yavruyu VEFAT ETTİ (Öldü) olarak işaretlemek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await api.patch(`/animals/${childId}`, { status: "vefat", isActive: false });
      dispatch(showToast(`${childTag} durumu 'Vefat Etti' olarak güncellendi.`));
      refetch();
    } catch {
      dispatch(showToast("Güncelleme işlemi başarısız oldu."));
    }
  };

  // Yavruyu veritabanından tamamen sil
  const deleteChild = async (childId: string, childTag: string) => {
    if (!confirm(`${childTag} küpeli yavru kaydını kalıcı olarak SİLMEK istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await api.delete(`/animals/${childId}`);
      dispatch(showToast(`${childTag} kaydı silindi.`));
      refetch();
    } catch {
      dispatch(showToast("Silme işlemi başarısız oldu."));
    }
  };

  // Yeni yavru ekle
  const handleAddChild = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEarTag) return;
    try {
      await api.post("/animals", {
        earTag: newEarTag,
        name: newName || undefined,
        gender: newGender,
        birthDate: newBirthDate,
        breed: animal?.breed || "Holstein",
        damTag: animal?.earTag,
        lactationStage: "buzagi",
        barnSection: "Ahır 3 - Buzağı Bölümü",
      });
      dispatch(showToast(`${newEarTag} küpeli yeni yavru başarıyla eklendi.`));
      setShowAddModal(false);
      setNewEarTag("");
      setNewName("");
      refetch();
    } catch {
      dispatch(showToast("Yavru eklenirken hata oluştu. Küpe numarası çakışıyor olabilir."));
    }
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Sürü Yönetimi Detay"
        eyebrow="Sürü Yönetimi / Detay"
        description="Hayvana ait tüm biyolojik, sağlık, yavru ve üretim verilerini buradan yönetebilirsiniz."
        primaryLabel="Düzenle"
      />

      <Panel className="animal-profile">
        <Image
          src={animal?.photoUrl || "/assets/cow_portrait.png"}
          alt={animal?.earTag ?? ""}
          width={220}
          height={164}
          unoptimized
        />
        <div className="animal-profile-copy">
          <h2>{animal?.earTag ?? "—"}</h2>
          <p>
            {[animal?.name, animal?.breed, derived?.ageLabel ?? "—", animal?.gender === "disi" ? "♀ Dişi" : "♂ Erkek"]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "8px 0" }}>
            <Badge>{derived?.lactationLabel ?? "—"}</Badge>
            <Badge tone={device ? "blue" : "gray"}>{device ? "Aktif Tasma" : "Tasma Yok"}</Badge>
            <Badge tone={derived?.healthLabel === "İyi" ? "green" : "orange"}>
              {derived?.healthLabel ?? "—"}
            </Badge>
            <Badge tone="purple">{offspring.length} Geçmiş Yavru</Badge>
          </div>
          <div className="animal-facts">
            <span>
              <MapPin />
              <small>Konum / Ahır</small>
              <b>{animal?.barnSection || animal?.currentZone?.name || "—"}</b>
            </span>
            <span>
              <CalendarDays />
              <small>Son Tohumlama</small>
              <b>{formatDate(animal?.lastInseminationAt)}</b>
            </span>
            <span>
              <CalendarDays />
              <small>Tahmini Doğum</small>
              <b>{formatDate(animal?.expectedBirthAt)}</b>
            </span>
            <span>
              <Milk />
              <small>Günlük Süt</small>
              <b>{withUnit(animal?.dailyMilkLiters ?? 0, "L")}</b>
            </span>
            <span>
              <HeartPulse />
              <small>Sağlık Skoru</small>
              <b>%{formatNumber(animal?.healthScore)}</b>
            </span>
            <span>
              <BatteryCharging />
              <small>Tasma Bataryası</small>
              <b>{device?.batteryLevel != null ? `%${device.batteryLevel}` : "—"}</b>
            </span>
            <span>
              <Wifi />
              <small>Sinyal</small>
              <b>{signalLabel(device?.batteryLevel)}</b>
            </span>
          </div>
        </div>
      </Panel>

      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<Milk />}
          label="Günlük Süt Olçümü"
          value={withUnit(animal?.dailyMilkLiters ?? 0, "L")}
          meta="Son ölçüm"
          loading={loading}
        />
        <StatCard
          icon={<Activity />}
          label="Aktivite Dakikası"
          value={`${formatNumber(animal?.activityMinutes)} dk/gün`}
          meta="Son 24 saat"
          tone="orange"
          loading={loading}
        />
        <StatCard
          icon={<Beef />}
          label="Geviş Getirme"
          value={`${formatNumber(animal?.ruminationMinutes)} dk/gün`}
          meta="Son 24 saat"
          loading={loading}
        />
        <StatCard
          icon={<Thermometer />}
          label="Vücut Isısı"
          value={`${formatDecimal(animal?.bodyTemperature)} °C`}
          meta={(animal?.bodyTemperature ?? 38.5) > 39 ? "Yüksek" : "Normal"}
          loading={loading}
        />
        <StatCard
          icon={<Baby />}
          label="Geçmiş Yavrular"
          value={`${offspring.length} Baş`}
          meta="Doğum geçmişi"
          tone="purple"
          loading={loading}
        />
        <StatCard
          icon={<CalendarDays />}
          label="Gebelik Durumu"
          value={animal?.expectedBirthAt ? "Gebe" : "Gebe değil"}
          meta={daysToBirth !== null ? `${daysToBirth} gün kaldı` : "—"}
          tone="blue"
          loading={loading}
        />
      </div>

      <div className="tabs">
        {TABS.map((label, index) => (
          <button key={label} className={tab === index ? "is-active" : ""} onClick={() => setTab(index)}>
            {label}
            {index === 1 && offspring.length > 0 && <b style={{ marginLeft: "6px" }}>{offspring.length}</b>}
          </button>
        ))}
      </div>

      {tab === 1 && (
        <Panel title="Geçmiş Yavrular / Çocuklar ve Yaş Durumları">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Bu hayvana ait kayıtlı tüm geçmiş yavrular, yaş durumları ve sağlık statüleri.
            </p>
            <button className="button button-primary button-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Yeni Yavru Kaydı Ekle
            </button>
          </div>

          {offspring.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", background: "var(--surface-2)", borderRadius: "12px" }}>
              <Baby size={40} style={{ color: "var(--muted)", marginBottom: "12px" }} />
              <h3>Kayıtlı yavru bulunmuyor</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
                Bu hayvan için henüz geçmiş doğum / yavru kaydı girilmemiş.
              </p>
              <button className="button button-secondary button-sm" onClick={() => setShowAddModal(true)} style={{ marginTop: "12px" }}>
                <Plus size={14} /> İlk Yavruyu Ekle
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Küpe No</th>
                    <th>İsim</th>
                    <th>Cinsiyet</th>
                    <th>Doğum Tarihi</th>
                    <th>Yaş Durumu</th>
                    <th>Durum / Sağlık</th>
                    <th style={{ textAlign: "right" }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {offspring.map((child: any) => (
                    <tr key={child.id} style={{ opacity: child.status === "vefat" ? 0.6 : 1 }}>
                      <td>
                        <Link className="primary-cell" href={`/suru/${child.id}`}>
                          <Image src={child.photoUrl || "/assets/cow_portrait.png"} alt="" width={36} height={36} unoptimized />
                          <strong>{child.earTag}</strong>
                        </Link>
                      </td>
                      <td><b>{child.name || "—"}</b></td>
                      <td>{child.genderLabel}</td>
                      <td>{child.birthDate}</td>
                      <td>
                        <Badge tone="blue">{child.ageLabel}</Badge>
                      </td>
                      <td>
                        {child.status === "vefat" ? (
                          <Badge tone="red">Öldü / Vefat Etti</Badge>
                        ) : child.status === "satildi" ? (
                          <Badge tone="orange">Satıldı</Badge>
                        ) : (
                          <Badge tone="green">{child.healthLabel}</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end" }}>
                          {child.status !== "vefat" && (
                            <button
                              className="button button-sm button-outline-red"
                              title="Öldü / Vefat İşaretle"
                              onClick={() => markDeceased(child.id, child.earTag)}
                              style={{ color: "#ef4444", borderColor: "#ef4444" }}
                            >
                              <Skull size={14} /> Vefat Etti (Öldü)
                            </button>
                          )}
                          <button
                            className="button button-sm button-ghost-red"
                            title="Kayıttan Sil"
                            onClick={() => deleteChild(child.id, child.earTag)}
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={15} /> Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab !== 1 && (
        <div className="detail-columns">
          <div>
            <Panel title="Hayvan Kimlik ve Temel Bilgiler">
              {animal ? (
                <div className="info-grid">
                  {[
                    ["Küpe No", animal.earTag],
                    ["İsim", animal.name || "—"],
                    ["Irk", animal.breed ?? "—"],
                    ["Yaş", derived?.ageLabel ?? "—"],
                    ["Cinsiyet", animal.gender === "disi" ? "Dişi" : "Erkek"],
                    ["Laktasyon No", `${animal.lactationNumber ?? 0}. Laktasyon`],
                    ["Konum / Ahır", animal.barnSection || animal.currentZone?.name || "—"],
                    ["Geçmiş Yavru Sayısı", `${offspring.length} Adet`],
                    ["Son Veteriner Kontrolü", formatDate(animal.lastVetCheckAt)],
                  ].map(([label, value]) => (
                    <span key={label as string}>
                      <small>{label as string}</small>
                      <b>{value as string}</b>
                    </span>
                  ))}
                </div>
              ) : (
                <SkeletonBlock rows={5} height={24} />
              )}
            </Panel>

            <Panel title="Biyolojik Takvim">
              <div className="timeline">
                {!data && <SkeletonBlock rows={4} height={26} />}
                {data?.timeline.map((step, index) => (
                  <span className={step.done ? "is-done" : ""} key={step.key}>
                    <i>{step.done ? "✓" : index + 1}</i>
                    <b>{step.label}</b>
                    <small>{formatDate(step.date)}</small>
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Alarm ve Olay Geçmişi">
              <div className="event-list">
                {!data && <SkeletonBlock rows={3} height={26} />}
                {data?.alerts.slice(0, 6).map((alert) => (
                  <span className={alert.severity === "kritik" ? "is-critical" : ""} key={alert._id}>
                    <AlarmClock />
                    <b>{alert.message}</b>
                    <small>{formatDateTime(alert.createdAt)}</small>
                  </span>
                ))}
                {data?.alerts.length === 0 && (
                  <span>
                    <ShieldCheck />
                    <b>Kayıtlı alarm yok</b>
                    <small>Bu hayvan için geçmiş uyarı bulunmuyor.</small>
                  </span>
                )}
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Canlı Sağlık Göstergeleri">
              {data ? (
                <div className="mini-chart-grid">
                  {[
                    ["Süt Verimi", "#2f7edb", withUnit(animal?.dailyMilkLiters ?? 0, "L")],
                    ["Aktivite Seviyesi", "#168346", `${formatNumber(animal?.activityMinutes)} dk`],
                    ["Geviş Getirme", "#168346", `${formatNumber(animal?.ruminationMinutes)} dk`],
                    ["Vücut Isısı", "#8764cc", `${formatDecimal(animal?.bodyTemperature)} °C`],
                  ].map(([title, color, value]) => (
                    <div key={title as string}>
                      <small>{title as string}</small>
                      <strong>{value as string}</strong>
                      <TrendChart data={data.milkSeries} color={color as string} />
                    </div>
                  ))}
                </div>
              ) : (
                <SkeletonBlock rows={4} height={40} />
              )}
            </Panel>

            <div className="detail-split">
              <Panel title="Kamera ve Görsel Doğrulama">
                <div className="video-thumb video-thumb-large">
                  <Image src="/assets/camera_barn.png" alt="" fill unoptimized />
                  <i>▶</i>
                </div>
              </Panel>
              <Panel title="Aşı / Tedavi Geçmişi">
                <div className="compact-list">
                  {!data && <SkeletonBlock rows={4} height={30} />}
                  {data?.healthRecords.slice(0, 5).map((record) => (
                    <div key={record._id}>
                      <Stethoscope />
                      <span>
                        <strong>{record.title}</strong>
                        <small>{formatDate(record.date)}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="Akıllı Tasma Durumu">
              <div className="device-status">
                <span>
                  <BatteryCharging />
                  <small>Batarya</small>
                  <b>{device?.batteryLevel != null ? `%${device.batteryLevel}` : "—"}</b>
                </span>
                <span>
                  <Wifi />
                  <small>Sinyal Kalitesi</small>
                  <b>{signalLabel(device?.batteryLevel)}</b>
                </span>
                <span>
                  <Activity />
                  <small>Son Senkronizasyon</small>
                  <b>{formatTime(device?.lastSeenAt ?? animal?.lastSeenAt)}</b>
                </span>
                <span>
                  <Bluetooth />
                  <small>Bağlantı</small>
                  <b>{device ? "BLE / Gateway" : "Bağlı değil"}</b>
                </span>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* Yeni Yavru Ekleme Modalı */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "28px",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "20px" }}>Yeni Yavru (Buzağı) Kaydı</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
              Anne Küpe No: <strong>{animal?.earTag}</strong>
            </p>
            <form onSubmit={handleAddChild} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Yavru Küpe Numarası *
                </label>
                <input
                  required
                  type="text"
                  value={newEarTag}
                  onChange={(e) => setNewEarTag(e.target.value)}
                  placeholder="Örn: TR380099112"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Yavru İsmi / Lakabı
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Minik Pamuk"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Cinsiyet *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="disi">Dişi (♀)</option>
                    <option value="erkek">Erkek (♂)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Doğum Tarihi *
                  </label>
                  <input
                    required
                    type="date"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
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
                  Yavruyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HerdDetailView;
