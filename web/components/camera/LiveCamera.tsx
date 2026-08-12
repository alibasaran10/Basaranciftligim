"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, API_BASE_URL } from "@/lib/api";
import type { CameraStreamToken } from "@/lib/types";

/**
 * Canli kamera goruntusu.
 *
 * NEDEN IKI AYRI MOD:
 * Tarayicilar ayni sunucuya es zamanli acilabilecek baglanti sayisini
 * sinirlar (HTTP/1.1'de kabaca 6). MJPEG akisi baglantiyi SUREKLI acik
 * tuttugu icin, 12 kameralik bir izgarada hepsine akis acmak son
 * kameralari kalici olarak kilitlerdi.
 *
 * Bu yuzden:
 *  - Izgaradaki kucuk kartlar "snapshot" modunda calisir: birkac saniyede
 *    bir tek kare ceker, baglanti hemen kapanir. Hafif ve sinirsiz sayida
 *    kamera ile sorunsuz.
 *  - Secilen/buyutulen kamera "live" modunda calisir: gercek MJPEG akisi,
 *    tam kare hizinda.
 *
 * Kimlik dogrulama: <img> etiketi Authorization basligi gonderemedigi icin
 * kisa omurlu, tek kameraya kapsamli akis jetonu kullanilir (bkz. backend
 * tokens.js#signStreamToken). Jeton 2 dakikada oldugu icin arka planda
 * yenilenir.
 */

/** Jeton 120sn omurlu; bitmeden guvenli bir pay birakarak yenile. */
const TOKEN_REFRESH_MS = 90_000;

/** Izgara kartlarinda kare tazeleme araligi. */
const SNAPSHOT_INTERVAL_MS = 2_000;

/**
 * Bir kamera icin akis jetonu alir ve suresi dolmadan yeniler.
 * Kamera canli degilse jeton istenmez --- bos yere sunucu mesgul edilmez.
 */
function useStreamToken(cameraId: string | null, enabled: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cameraId || !enabled) {
      setToken(null);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchToken = async () => {
      try {
        const envelope = await api.post<CameraStreamToken>(
          `/cameras/${cameraId}/stream-token`,
        );
        if (!active) return;
        setToken(envelope.data.token);
        setError(null);
      } catch {
        if (!active) return;
        setError("Canlı görüntü izni alınamadı.");
        setToken(null);
      }
      if (active) timer = setTimeout(fetchToken, TOKEN_REFRESH_MS);
    };

    void fetchToken();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [cameraId, enabled]);

  return { token, error };
}

type LiveCameraProps = {
  cameraId: string;
  cameraName: string;
  /** Saha ajani su an kare gonderiyor mu. */
  live: boolean;
  /** Ajan yokken gosterilecek durgun gorsel. */
  posterUrl?: string | null;
  mode?: "live" | "snapshot";
  className?: string;
};

export function LiveCamera({
  cameraId,
  cameraName,
  live,
  posterUrl,
  mode = "snapshot",
  className,
}: LiveCameraProps) {
  const { token, error } = useStreamToken(cameraId, live);
  const [failed, setFailed] = useState(false);
  // Snapshot modunda URL'yi degistirerek tarayiciyi yeni kare cekmeye zorlar.
  const [tick, setTick] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Kamera canliya gecince onceki hatayi unut.
  useEffect(() => {
    setFailed(false);
  }, [cameraId, live, token]);

  useEffect(() => {
    if (mode !== "snapshot" || !token || !live) return;
    const timer = setInterval(() => setTick((value) => value + 1), SNAPSHOT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mode, token, live]);

  const handleError = useCallback(() => {
    // Akis koptu (ag hatasi / sunucu yeniden basladi). Poster'a dus;
    // jeton yenilendiginde otomatik tekrar denenecek.
    setFailed(true);
  }, []);

  const showPlaceholder = !live || !token || failed || !!error;

  if (showPlaceholder) {
    return (
      <div className={className} data-camera-state={live ? "bekliyor" : "cevrimdisi"}>
        {posterUrl ? (
          // Canli akis yokken son bilinen gorsel; next/image kullanilmaz
          // cunku bu kaynak sunucudan gelen degisken bir yoldur.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt={cameraName} />
        ) : (
          <div className="camera-empty" />
        )}
        <span className="camera-badge is-offline">
          {error ?? (live ? "Bağlanıyor…" : "Çevrimdışı")}
        </span>
      </div>
    );
  }

  const base = `${API_BASE_URL}/cameras/${cameraId}`;
  const src =
    mode === "live"
      ? `${base}/stream.mjpeg?token=${encodeURIComponent(token)}`
      : `${base}/snapshot.jpg?token=${encodeURIComponent(token)}&t=${tick}`;

  return (
    <div className={className} data-camera-state="canli">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={`${cameraName} canlı görüntü`}
        onError={handleError}
        // Canli goruntu asla onbellekten gelmemeli.
        decoding="async"
      />
      <span className="camera-badge is-live">CANLI</span>
    </div>
  );
}

export default LiveCamera;
