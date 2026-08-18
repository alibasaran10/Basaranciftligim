"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Compass,
  Droplets,
  MapPin,
  Settings,
  Sun,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { FarmLocationItem, getSavedFarmsList } from "@/components/settings/FarmLocationSettingsCard";
import { SkeletonBlock } from "@/components/ui/AsyncState";
import { Panel } from "@/components/ui/Panel";

type WeatherResult = {
  farmId: string;
  farmName: string;
  lat: number;
  lng: number;
  temp: number;
  humidity: number;
  wind: number;
  code: number;
  daily: Array<{ date: string; max: number; min: number; code: number }>;
};

function getWeatherIconAndLabel(code: number) {
  if (code === 0) return { icon: Sun, label: "Güneşli", color: "#f59e0b" };
  if ([1, 2, 3].includes(code)) return { icon: CloudSun, label: "Parçalı Bulutlu", color: "#3b82f6" };
  if ([45, 48].includes(code)) return { icon: CloudFog, label: "Sisli", color: "#6b7280" };
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { icon: CloudRain, label: "Yağmurlu", color: "#2563eb" };
  if ([71, 73, 75, 77].includes(code)) return { icon: CloudSnow, label: "Karlı", color: "#38bdf8" };
  if ([80, 81, 82].includes(code)) return { icon: CloudDrizzle, label: "Sağanak Yağışlı", color: "#1d4ed8" };
  if ([95, 96, 99].includes(code)) return { icon: CloudLightning, label: "Fırtınalı", color: "#7c3aed" };
  return { icon: Cloud, label: "Bulutlu", color: "#6b7280" };
}

export function FarmMapAndWeather() {
  const [farms, setFarms] = useState<FarmLocationItem[]>(getSavedFarmsList);
  const [activeFarmId, setActiveFarmId] = useState<string>("");
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherResult>>({});
  const [loading, setLoading] = useState(true);

  // Sync state with local storage safely without losing any user data
  useEffect(() => {
    const syncFarms = () => {
      const list = getSavedFarmsList();
      setFarms(list);
      if (list.length > 0 && (!activeFarmId || !list.some((f) => f.id === activeFarmId))) {
        setActiveFarmId(list[0].id);
      }
    };

    syncFarms();
    window.addEventListener("farm-locations-changed", syncFarms);
    window.addEventListener("storage", syncFarms);
    return () => {
      window.removeEventListener("farm-locations-changed", syncFarms);
      window.removeEventListener("storage", syncFarms);
    };
  }, []);

  // Set initial active farm ID once farms load
  useEffect(() => {
    if (farms.length > 0 && !activeFarmId) {
      setActiveFarmId(farms[0].id);
    }
  }, [farms]);

  // Fetch Weather for ALL saved farms in parallel
  useEffect(() => {
    if (farms.length === 0) return;
    setLoading(true);

    Promise.all(
      farms.map((f) =>
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${f.lat}&longitude=${f.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.current) {
              const daily = (data.daily?.time ?? []).slice(0, 3).map((d: string, idx: number) => ({
                date: d,
                max: Math.round(data.daily.temperature_2m_max[idx]),
                min: Math.round(data.daily.temperature_2m_min[idx]),
                code: data.daily.weather_code[idx],
              }));
              return {
                farmId: f.id,
                farmName: f.name,
                lat: f.lat,
                lng: f.lng,
                temp: Math.round(data.current.temperature_2m),
                humidity: Math.round(data.current.relative_humidity_2m),
                wind: Math.round(data.current.wind_speed_10m),
                code: data.current.weather_code,
                daily,
              } as WeatherResult;
            }
            return null;
          })
          .catch(() => null)
      )
    )
      .then((results) => {
        const nextMap: Record<string, WeatherResult> = {};
        results.forEach((res) => {
          if (res) nextMap[res.farmId] = res;
        });
        setWeatherMap(nextMap);
      })
      .finally(() => setLoading(false));
  }, [farms]);

  const selectedFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const activeWeather = selectedFarm ? weatherMap[selectedFarm.id] : null;
  const weatherMeta = activeWeather ? getWeatherIconAndLabel(activeWeather.code) : null;
  const WeatherIcon = weatherMeta?.icon ?? CloudSun;

  // Generate interactive Leaflet HTML for iframe srcDoc (Places pins for ALL saved farms & zooms automatically)
  const mapSrcDoc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #111d18; }
    .leaflet-popup-content-wrapper { background: #182820; color: #ffffff; border-radius: 10px; font-family: system-ui, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
    .leaflet-popup-tip { background: #182820; }
    .leaflet-popup-content { margin: 10px 12px; font-size: 13px; line-height: 1.4; }
    .leaflet-container { background: #111d18; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const farms = ${JSON.stringify(farms)};
    const map = L.map('map', { zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    const bounds = [];
    farms.forEach((f) => {
      if (typeof f.lat === 'number' && typeof f.lng === 'number' && !isNaN(f.lat) && !isNaN(f.lng)) {
        const marker = L.marker([f.lat, f.lng]).addTo(map);
        marker.bindPopup('<b>📍 ' + (f.name || 'Çiftlik') + '</b><br/><span style="color:#34d399;font-size:11.5px;">Enlem: ' + f.lat.toFixed(4) + '° · Boylam: ' + f.lng.toFixed(4) + '°</span>');
        bounds.push([f.lat, f.lng]);
      }
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([37.8716, 32.4851], 10);
    }
  </script>
</body>
</html>
`;

  return (
    <Panel
      title={`🌾 Çiftliklerim Haritası ve Canlı Hava Tahmini (${farms.length} Çiftlik Haritada)`}
      action={
        <Link
          href="/ayarlar"
          className="button button-secondary"
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          <Settings size={14} /> Çiftlikleri Yönet
        </Link>
      }
    >
      {/* Grid: Weather & Map */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {/* Weather Section with Farm Selector Tabs */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            {/* Multi-Farm Switcher Buttons */}
            {farms.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                {farms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={selectedFarm?.id === f.id ? "button button-primary" : "button button-secondary"}
                    onClick={() => setActiveFarmId(f.id)}
                    style={{ padding: "4px 10px", fontSize: "12px", gap: "4px" }}
                  >
                    <MapPin size={12} /> {f.name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} style={{ color: "var(--green-600)" }} />
                <strong style={{ fontSize: "14.5px" }}>{selectedFarm?.name}</strong>
              </div>
              {selectedFarm && (
                <span style={{ fontSize: "11px", color: "var(--muted)", background: "var(--surface-3)", padding: "2px 6px", borderRadius: "4px" }}>
                  {selectedFarm.lat.toFixed(2)}°N, {selectedFarm.lng.toFixed(2)}°E
                </span>
              )}
            </div>

            {loading ? (
              <SkeletonBlock rows={3} height={30} />
            ) : activeWeather ? (
              <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "10px 0" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "rgba(52, 211, 153, 0.15)",
                    display: "grid",
                    placeItems: "center",
                    color: weatherMeta?.color ?? "var(--green-600)",
                  }}
                >
                  <WeatherIcon size={32} />
                </div>
                <div>
                  <div style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>
                    {activeWeather.temp}°C
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 650, color: "var(--text)", marginTop: "4px" }}>
                    {weatherMeta?.label}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "10px 0", color: "var(--muted)" }}>Hava verisi yükleniyor...</div>
            )}

            {activeWeather && (
              <div style={{ display: "flex", gap: "14px", marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text)" }}>
                  <Droplets size={14} style={{ color: "var(--blue)" }} />
                  <span>Nem: <b>%{activeWeather.humidity}</b></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text)" }}>
                  <Wind size={14} style={{ color: "var(--green-600)" }} />
                  <span>Rüzgar: <b>{activeWeather.wind} km/s</b></span>
                </div>
              </div>
            )}
          </div>

          {/* 3-Day Forecast */}
          {activeWeather && activeWeather.daily.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
              <small style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 700 }}>
                3 GÜNLÜK TAHMİN ({selectedFarm?.name})
              </small>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {activeWeather.daily.map((d, i) => {
                  const meta = getWeatherIconAndLabel(d.code);
                  const Icon = meta.icon;
                  const dayName = i === 0 ? "Bugün" : i === 1 ? "Yarın" : new Date(d.date).toLocaleDateString("tr-TR", { weekday: "short" });
                  return (
                    <div
                      key={d.date}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "8px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{dayName}</div>
                      <Icon size={18} style={{ margin: "4px auto", color: meta.color }} />
                      <div style={{ fontSize: "11.5px", fontWeight: 700 }}>
                        {d.max}° <small style={{ color: "var(--muted)", fontWeight: 500 }}>{d.min}°</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map Embed Card using Leaflet srcDoc (Places pins for ALL saved farms & zooms automatically) */}
        <div
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--line)",
            background: "var(--surface-2)",
            minHeight: "260px",
            height: "100%",
          }}
        >
          <iframe
            title="Çiftlikler Haritası"
            width="100%"
            height="100%"
            style={{ border: 0, width: "100%", height: "100%", minHeight: "260px" }}
            loading="lazy"
            srcDoc={mapSrcDoc}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              background: "rgba(0, 0, 0, 0.82)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 2,
              maxWidth: "92%",
            }}
          >
            <Compass size={15} style={{ color: "var(--green-400)", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <b>{farms.length} Çiftlik İşaretlendi:</b> {farms.map((f) => f.name).join(", ")}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
