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
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type { FarmSettings } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/sessionSlice";
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

function ProfilePhotoSection() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.session.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentGender = currentUser?.gender || "erkek";
  const defaultAvatar = currentGender === "kadin" ? "/assets/profile_farmer_female.png" : "/assets/profile_farmer.png";

  const handleGenderChange = (newGender: "erkek" | "kadin") => {
    if (!currentUser) return;
    const newAvatar = newGender === "kadin" ? "/assets/profile_farmer_female.png" : "/assets/profile_farmer.png";
    dispatch(setUser({ ...currentUser, gender: newGender, avatarUrl: newAvatar }));
    try {
      localStorage.setItem("user_gender", newGender);
      localStorage.setItem("user_avatar", newAvatar);
    } catch {
      // Fallback
    }
    dispatch(showToast(`Cinsiyet ${newGender === "kadin" ? "Kadın" : "Erkek"} olarak güncellendi.`));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      dispatch(showToast("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP)."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch(showToast("Görsel boyutu 5 MB'dan küçük olmalıdır."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (currentUser) {
        dispatch(setUser({ ...currentUser, avatarUrl: dataUrl }));
        try {
          localStorage.setItem("user_avatar", dataUrl);
        } catch {
          // LocalStorage quota fallback
        }
      }
      dispatch(showToast("Profil fotoğrafınız başarıyla güncellendi."));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (currentUser) {
      dispatch(setUser({ ...currentUser, avatarUrl: defaultAvatar }));
      try {
        localStorage.removeItem("user_avatar");
      } catch {
        // Fallback
      }
    }
    dispatch(showToast("Profil fotoğrafınız varsayılana sıfırlandı."));
  };

  return (
    <div className="profile-avatar-card">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div className="profile-avatar-wrapper">
        <Image
          src={currentUser?.avatarUrl || defaultAvatar}
          alt="Profil Fotoğrafı"
          width={76}
          height={76}
          unoptimized
        />
      </div>
      <div className="profile-avatar-info">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <strong>{currentUser?.name ?? "Ali Başaran"}</strong>
            <small style={{ display: "block" }}>{currentUser?.jobTitle ?? "İşletme Sahibi"}</small>
          </div>
          {/* Cinsiyet Seçim Butonları */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600 }}>Cinsiyet:</span>
            <button
              type="button"
              onClick={() => handleGenderChange("erkek")}
              style={{
                padding: "4px 9px",
                fontSize: "11.5px",
                borderRadius: "6px",
                border: currentGender === "erkek" ? "1px solid var(--green-600)" : "1px solid var(--line)",
                background: currentGender === "erkek" ? "rgba(22, 131, 70, 0.15)" : "var(--surface)",
                color: currentGender === "erkek" ? "var(--green-700)" : "var(--muted)",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Erkek
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange("kadin")}
              style={{
                padding: "4px 9px",
                fontSize: "11.5px",
                borderRadius: "6px",
                border: currentGender === "kadin" ? "1px solid var(--purple)" : "1px solid var(--line)",
                background: currentGender === "kadin" ? "rgba(135, 100, 204, 0.15)" : "var(--surface)",
                color: currentGender === "kadin" ? "var(--purple)" : "var(--muted)",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Kadın
            </button>
          </div>
        </div>
        <div className="profile-avatar-btns" style={{ marginTop: "8px" }}>
          <button
            type="button"
            className="button button-primary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Fotoğraf Yükle / Değiştir
          </button>
          {currentUser?.avatarUrl && currentUser.avatarUrl !== defaultAvatar && (
            <button
              type="button"
              className="button button-secondary"
              style={{ padding: "6px 10px", fontSize: "12px", color: "var(--red)" }}
              onClick={handleRemovePhoto}
            >
              <Trash2 size={14} /> Varsayılana Sıfırla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    const value = e.target.value.replace(/[0-9]/g, "").slice(0, 50);
    setName(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <label style={{ gridColumn: "1 / -1" }}>
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
      <label style={{ gridColumn: "1 / -1" }}>
        E-posta (İsteğe bağlı)
        <input
          name="email"
          type="email"
          defaultValue={business.email}
          placeholder="ornek@isletme.com"
        />
      </label>
      <button className="button button-primary" type="submit" disabled={saving} style={{ gridColumn: "1 / -1" }}>
        <Save /> {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}

export function SettingsView() {
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useApi<FarmSettings>("/farm/settings");

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
        description="Hesap, işletme, profil fotoğrafı, cihaz ve sistem tercihlerinizi yönetin."
        icon={<Settings />}
        showActions={false}
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
        <Panel title="Profil Fotoğrafı & İşletme Bilgileri">
          <ProfilePhotoSection />
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
