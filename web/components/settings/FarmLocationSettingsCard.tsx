"use client";

import { AlertCircle, CheckCircle2, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Panel } from "@/components/ui/Panel";

export type FarmLocationItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isPrimary?: boolean;
};

export const DEFAULT_FARMS_LIST: FarmLocationItem[] = [
  {
    id: "farm-default-1",
    name: "Başaran Çiftliği (Merkez)",
    lat: 37.8716,
    lng: 32.4851,
    isPrimary: true,
  },
];

export function getSavedFarmsList(): FarmLocationItem[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("entegre-farm-locations-list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Migration from single location storage if available
      const singleSaved = localStorage.getItem("entegre-farm-location");
      if (singleSaved) {
        const parsedSingle = JSON.parse(singleSaved);
        if (parsedSingle && parsedSingle.name && typeof parsedSingle.lat === "number") {
          return [
            {
              id: "farm-migrated",
              name: parsedSingle.name,
              lat: parsedSingle.lat,
              lng: parsedSingle.lng,
              isPrimary: true,
            },
          ];
        }
      }
    } catch {}
  }
  return DEFAULT_FARMS_LIST;
}

export function FarmLocationSettingsCard() {
  const [farms, setFarms] = useState<FarmLocationItem[]>(getSavedFarmsList);

  const [farmName, setFarmName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state with storage
  useEffect(() => {
    const sync = () => {
      setFarms(getSavedFarmsList());
    };
    sync();
    window.addEventListener("farm-locations-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("farm-locations-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const saveFarmsList = (updated: FarmLocationItem[]) => {
    setFarms(updated);
    try {
      localStorage.setItem("entegre-farm-locations-list", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("farm-locations-changed", { detail: updated }));
    } catch {}
  };

  const handleAddFarm = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = farmName.trim();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!trimmedName) {
      setErrorMsg("Lütfen geçerli bir çiftlik ismi girin.");
      return;
    }

    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMsg("Lütfen geçerli sayısal Enlem ve Boylam koordinatları girin.");
      return;
    }

    // 1. Check duplicate name (case-insensitive)
    const duplicateName = farms.some(
      (f) => f.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      setErrorMsg(`"${trimmedName}" isminde bir çiftlik zaten kayıtlı! Aynı isimde ikinci bir çiftlik eklenemez.`);
      return;
    }

    // 2. Check duplicate coordinates
    const duplicateCoords = farms.some(
      (f) => Math.abs(f.lat - latNum) < 0.0001 && Math.abs(f.lng - lngNum) < 0.0001
    );
    if (duplicateCoords) {
      setErrorMsg(`Enlem: ${latNum}, Boylam: ${lngNum} koordinatlarında bir çiftlik zaten kayıtlı!`);
      return;
    }

    const newFarm: FarmLocationItem = {
      id: "farm-" + Date.now(),
      name: trimmedName,
      lat: latNum,
      lng: lngNum,
      isPrimary: farms.length === 0,
    };

    const updatedList = [...farms, newFarm];
    saveFarmsList(updatedList);

    setFarmName("");
    setLat("");
    setLng("");
    setSuccessMsg(`"${trimmedName}" çiftliği başarıyla eklendi! Harita üzerinde tüm çiftlikleriniz aynı anda gösterilecektir.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleDeleteFarm = (id: string, name: string) => {
    if (farms.length <= 1) {
      setErrorMsg("Sistemde en az 1 adet aktif çiftlik bulunmalıdır. Son çiftliği silemezsiniz.");
      return;
    }

    const updatedList = farms.filter((f) => f.id !== id);
    saveFarmsList(updatedList);
    setSuccessMsg(`"${name}" çiftliği silindi.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <Panel title="🌾 Çiftliklerim ve Lokasyon Yönetimi">
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.45 }}>
          Birden fazla çiftlik ve arazinizi sisteme ekleyebilirsiniz. Tüm çiftlikleriniz Kontrol Paneli üzerindeki haritada aynı anda gösterilecek ve canlı hava durumları ayrı ayrı takip edilecektir.
        </p>

        {/* Saved Farms List */}
        <div>
          <small style={{ color: "var(--muted)", fontWeight: 700, display: "block", marginBottom: "10px", letterSpacing: "0.5px" }}>
            KAYITLI ÇİFTLİKLERİNİZ ({farms.length})
          </small>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {farms.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(34, 197, 94, 0.15)",
                      color: "var(--green-600)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14.5px", display: "block" }}>{f.name}</strong>
                    <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                      Koordinatlar: {f.lat.toFixed(4)}° N, {f.lng.toFixed(4)}° E
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => handleDeleteFarm(f.id, f.name)}
                    disabled={farms.length <= 1}
                    title={farms.length <= 1 ? "En az 1 çiftlik bulunmalıdır" : "Çiftliği Sil"}
                    style={{ padding: "6px 12px", fontSize: "12px", gap: "5px" }}
                  >
                    <Trash2 size={14} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Farm Form */}
        <form
          onSubmit={handleAddFarm}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            borderTop: "1px solid var(--line)",
            paddingTop: "16px",
          }}
        >
          <strong style={{ fontSize: "14px" }}>+ Yeni Çiftlik / Arazi Ekle</strong>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--text)" }}>
                Çiftlik İsim / Etiketi
              </label>
              <input
                type="text"
                placeholder="Örn: Kuzey Ovası Çiftliği"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: "13.5px",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--text)" }}>
                Enlem (Latitude)
              </label>
              <input
                type="text"
                placeholder="Örn: 39.6484"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: "13.5px",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--text)" }}>
                Boylam (Longitude)
              </label>
              <input
                type="text"
                placeholder="Örn: 27.8826"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: "13.5px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="button button-primary"
              style={{ padding: "9px 22px", fontSize: "13px", gap: "6px" }}
            >
              <Plus size={16} /> Yeni Çiftliği Ekle
            </button>
          </div>
        </form>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "#f87171",
              fontSize: "13.5px",
              fontWeight: 650,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "10px",
              color: "var(--green-700)",
              fontSize: "13.5px",
              fontWeight: 650,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </Panel>
  );
}
