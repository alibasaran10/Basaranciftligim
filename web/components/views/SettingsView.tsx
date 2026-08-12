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
  "Kanatlı Hayvancılık",
  "Bitkisel Üretim",
  "Entegre İşletme",
  "Diğer",
];

function BusinessForm({
  business,
  onSubmit,
  saving,
}: {
  business: FarmSettings["business"];
  onSubmit: (payload: { name: string; businessType: string; phone: string; email: string }) => void;
  saving: boolean;
}) {
  const initialDigits = (business.phone || "").replace(/[^0-9]/g, "").slice(-10);
  const [name, setName] = useState(business.name || "");
  const [phone, setPhone] = useState(initialDigits);
  const [phoneError, setPhoneError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece harf ve boşluk (rakam engellenir), max 50 karakter
    const value = e.target.value.replace(/[0-9]/g, "").slice(0, 50);
    setName(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakam (harf engellenir), tam 10 hane
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(value);
    if (value.length > 0 && value.length < 10) {
      setPhoneError("Telefon numarası 10 haneli olmalıdır.");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phone.length > 0 && phone.length !== 10) {
      setPhoneError("Telefon numarası 10 haneli olmalıdır.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const formattedPhone = phone ? `+90 ${phone}` : "";
    onSubmit({
      name,
      businessType: String(formData.get("businessType") || ""),
      phone: formattedPhone,
      email: String(formData.get("email") || ""),
    });
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label>
        İşletme Adı
        <input
          required
          name="name"
          value={name}
          onChange={handleNameChange}
          maxLength={50}
          placeholder="İşletme Adı"
        />
      </label>
      <label>
        İşletme Türü
        <select name="businessType" defaultValue={business.businessType || BUSINESS_TYPES[0]}>
          {Array.from(new Set([business.businessType, ...BUSINESS_TYPES]))
            .filter(Boolean)
            .map((option) => (
              <option key={option}>{option}</option>
            ))}
        </select>
      </label>
      <label>
        Telefon
        <div className="phone-input-wrapper">
          <span className="phone-prefix">+90</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={10}
            placeholder="5XX XXX XX XX"
          />
        </div>
        {phoneError && (
          <small style={{ color: "#ef4444", marginTop: "4px", display: "block" }}>
            {phoneError}
          </small>
        )}
      </label>
      <label>
        E-posta (İsteğe bağlı)
        <input
          name="email"
          type="email"
          defaultValue={business.email}
          placeholder="ornek@isletme.com"
        />
      </label>
      <button className="button button-primary" type="submit" disabled={saving}>
        <Save /> {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}

export function SettingsView() {
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useApi<FarmSettings>("/farm/settings");

  /**
   * Tercihler sunucudan gelir; kullanicinin yaptigi degisiklikler yalnizca
   * "overrides" olarak tutulup uzerine bindirilir.
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
      setOverrides((current) => ({ ...current, [key]: !next }));
      dispatch(showToast("Tercih kaydedilemedi."));
    }
  };

  const handleSaveBusiness = async (payload: {
    name: string;
    businessType: string;
    phone: string;
    email: string;
  }) => {
    setSaving(true);
    try {
      await api.patch("/farm/settings", payload);
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
            <BusinessForm
              key={data.business.id}
              business={data.business}
              onSubmit={handleSaveBusiness}
              saving={saving}
            />
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
