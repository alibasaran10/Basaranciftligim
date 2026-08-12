"use client";

import {
  Bell,
  Camera,
  Cloud,
  KeyRound,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type { FarmSettings } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

/** Ayarlar kartlari <-> backend tercih anahtarlari eslemesi. */
const PREFERENCE_CARDS = [
  { key: "notifications", icon: Bell, title: "Bildirim Ayarları", copy: "Push, SMS ve e-posta bildirimlerini yönetin" },
  { key: "cameraIntegration", icon: Camera, title: "Kamera Entegrasyonu", copy: "RTSP bağlantıları ve kayıt tercihleri" },
  { key: "deviceSettings", icon: Smartphone, title: "Cihaz & Tasma Ayarları", copy: "Gateway ve akıllı tasma yapılandırması" },
  { key: "dataSync", icon: Cloud, title: "Veri Senkronizasyonu", copy: "Bulut yedekleme ve senkronizasyon" },
  { key: "security", icon: ShieldCheck, title: "Güvenlik", copy: "İki aşamalı doğrulama ve oturumlar" },
  { key: "apiIntegrations", icon: KeyRound, title: "API ve Entegrasyonlar", copy: "Harici servis bağlantıları" },
] as const;

const BUSINESS_TYPES = [
  "Büyükbaş Hayvancılık",
  "Küçükbaş Hayvancılık",
  "Entegre Tarım",
  "Bitkisel Üretim",
];

export function SettingsView() {
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useApi<FarmSettings>("/farm/settings");

  /**
   * Tercihler sunucudan gelir; kullanicinin yaptigi degisiklikler yalnizca
   * "overrides" olarak tutulup uzerine bindirilir. Boylece efekt icinde
   * kopyalama yapmaya gerek kalmaz ve yeniden cekilen veri kaybolmaz.
   */
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const preferences: Record<string, boolean> = { ...(data?.preferences ?? {}), ...overrides };

  const togglePreference = async (key: string) => {
    const next = !preferences[key];
    setOverrides((current) => ({ ...current, [key]: next }));
    try {
      await api.patch("/farm/preferences", { [key]: next });
    } catch {
      // Sunucu reddederse eski duruma don.
      setOverrides((current) => ({ ...current, [key]: !next }));
      dispatch(showToast("Tercih kaydedilemedi."));
    }
  };

  const saveBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.patch("/farm/settings", {
        name: String(values.get("name") || ""),
        businessType: String(values.get("businessType") || ""),
        phone: String(values.get("phone") || ""),
        email: String(values.get("email") || ""),
      });
      dispatch(showToast("İşletme bilgileri kaydedildi."));
      refetch();
    } catch {
      dispatch(showToast("İşletme bilgileri kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  };

  const subscription = data?.subscription;

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Ayarlar"
        description="Hesap, işletme, cihaz ve sistem tercihlerinizi yönetin."
        icon={<Settings />}
        primaryLabel="Kaydet"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="settings-grid">
        {PREFERENCE_CARDS.map((card) => {
          const ItemIcon = card.icon;
          return (
            <Panel key={card.key}>
              <div className="setting-card">
                <ItemIcon />
                <span>
                  <strong>{card.title}</strong>
                  <small>{card.copy}</small>
                </span>
                <button
                  className={`switch ${preferences[card.key] ? "is-on" : ""}`}
                  aria-label={`${card.title} durumunu değiştir`}
                  disabled={loading}
                  onClick={() => togglePreference(card.key)}
                >
                  <i />
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="settings-columns">
        <Panel title="İşletme Bilgileri">
          {data ? (
            <form className="settings-form" onSubmit={saveBusiness} key={data.business.id}>
              <label>
                İşletme Adı
                <input name="name" defaultValue={data.business.name} required />
              </label>
              <label>
                İşletme Türü
                <select name="businessType" defaultValue={data.business.businessType || BUSINESS_TYPES[0]}>
                  {Array.from(new Set([data.business.businessType, ...BUSINESS_TYPES]))
                    .filter(Boolean)
                    .map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                </select>
              </label>
              <label>
                Telefon
                <input name="phone" defaultValue={data.business.phone} />
              </label>
              <label>
                E-posta
                <input name="email" type="email" defaultValue={data.business.email} />
              </label>
              <button className="button button-primary" type="submit" disabled={saving}>
                <Save /> {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
              </button>
            </form>
          ) : (
            <SkeletonBlock rows={5} height={34} />
          )}
        </Panel>

        <Panel title="Abonelik ve Güvenlik">
          {data ? (
            <div className="security-summary">
              <ShieldCheck />
              <h3>
                {data.security.twoFactorEnabled ? "Hesabınız Güvende" : "Güvenlik Zayıf"}
              </h3>
              <p>
                {data.security.twoFactorEnabled
                  ? "İki aşamalı doğrulama etkin."
                  : "İki aşamalı doğrulama kapalı."}{" "}
                {data.security.passwordChangedDaysAgo != null
                  ? `Son parola değişikliği ${data.security.passwordChangedDaysAgo} gün önce yapıldı.`
                  : ""}
              </p>
              <div className="info-grid">
                <span>
                  <small>Paket</small>
                  <b>{subscription?.plan}</b>
                </span>
                <span>
                  <small>Yenilenme</small>
                  <b>{formatDate(subscription?.renewalAt)}</b>
                </span>
                <span>
                  <small>Hayvan</small>
                  <b>
                    {formatNumber(subscription?.animals.used)} / {formatNumber(subscription?.animals.limit)}
                  </b>
                </span>
                <span>
                  <small>Tarla</small>
                  <b>
                    {formatNumber(subscription?.fields.used)} / {formatNumber(subscription?.fields.limit)}
                  </b>
                </span>
                <span>
                  <small>Kamera</small>
                  <b>
                    {formatNumber(subscription?.cameras.used)} / {formatNumber(subscription?.cameras.limit)}
                  </b>
                </span>
                <span>
                  <small>Depolama</small>
                  <b>
                    {formatNumber(subscription?.storage.used)} / {formatNumber(subscription?.storage.limit)} GB
                  </b>
                </span>
              </div>
              <button className="button button-secondary">Güvenlik Ayarlarını Aç</button>
            </div>
          ) : (
            <SkeletonBlock rows={5} height={30} />
          )}
        </Panel>
      </div>
    </div>
  );
}

export default SettingsView;
