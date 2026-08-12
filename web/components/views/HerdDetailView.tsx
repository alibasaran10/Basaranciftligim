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
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/ui/Charts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
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

const TABS = [
  "Genel Bilgiler",
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
  const [tab, setTab] = useState(0);
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

  // Yasa/gune bagli etiketler sunucudan gelir (render tarafinda saat okunmaz).
  const derived = data?.derived;
  const daysToBirth = derived?.daysToBirth ?? null;

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Sürü Yönetimi Detay"
        eyebrow="Sürü Yönetimi / Detay"
        description="Hayvana ait tüm biyolojik, sağlık ve üretim verilerini buradan yönetebilirsiniz."
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
            {[animal?.breed, derived?.ageLabel ?? "—", animal?.gender === "disi" ? "♀ Dişi" : "♂ Erkek"]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div>
            <Badge>{derived?.lactationLabel ?? "—"}</Badge>
            <Badge tone={device ? "blue" : "gray"}>{device ? "Aktif Tasma" : "Tasma Yok"}</Badge>
            <Badge tone={derived?.healthLabel === "İyi" ? "green" : "orange"}>
              {derived?.healthLabel ?? "—"}
            </Badge>
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
          label="Günlük Süt (Bugün)"
          value={withUnit(animal?.dailyMilkLiters ?? 0, "L")}
          meta="Son ölçüm"
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<Activity />}
          label="Aktivite Seviyesi"
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
          icon={<AlarmClock />}
          label="Son Alarm Durumu"
          value={activeAlert ? (activeAlert.title ?? activeAlert.type) : "Yok"}
          meta={activeAlert ? formatDateTime(activeAlert.createdAt) : "Temiz"}
          tone="red"
          loading={loading}
        />
        <StatCard
          icon={<CalendarDays />}
          label="Gebelik Durumu"
          value={animal?.expectedBirthAt ? "Gebe" : "Gebe değil"}
          meta={daysToBirth !== null ? `${daysToBirth} gün kaldı` : "—"}
          tone="purple"
          loading={loading}
        />
      </div>

      <div className="tabs">
        {TABS.map((label, index) => (
          <button key={label} className={tab === index ? "is-active" : ""} onClick={() => setTab(index)}>
            {label}
          </button>
        ))}
      </div>

      <div className="detail-columns">
        <div>
          <Panel title="Hayvan Kimlik ve Temel Bilgiler">
            {animal ? (
              <div className="info-grid">
                {[
                  ["Küpe No", animal.earTag],
                  ["Irk", animal.breed ?? "—"],
                  ["Yaş", derived?.ageLabel ?? "—"],
                  ["Cinsiyet", animal.gender === "disi" ? "Dişi" : "Erkek"],
                  ["Laktasyon No", `${animal.lactationNumber ?? 0}. Laktasyon`],
                  ["Konum / Ahır", animal.barnSection || animal.currentZone?.name || "—"],
                  ["Akıllı Tasma ID", device?.label ?? device?.macAddress ?? "—"],
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
    </div>
  );
}

export default HerdDetailView;
