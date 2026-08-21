/**
 * Turkce bicimlendirme yardimcilari.
 * Arayuzdeki tum sayi/para/tarih metinleri buradan gecer; boylece sunucudan
 * gelen ham degerler her ekranda ayni sekilde gorunur.
 */

const numberFormat = new Intl.NumberFormat("tr-TR");
const decimalFormat = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 2450 -> "2.450" */
export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return numberFormat.format(Number(value));
}

/** 28.5 -> "28,5" */
export function formatDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0,0";
  return decimalFormat.format(Number(value));
}

/** 2485750 -> "₺ 2.485.750" */
export function formatCurrency(value: number | null | undefined) {
  return `₺ ${formatNumber(Math.round(Number(value ?? 0)))}`;
}

/**
 * Tarla alanını akıllı biçimlendirir:
 * - Çift haneli dönüm (>= 10) ise dönüm cinsinden (Örn: 10,2 Dönüm)
 * - Tek haneli dönüm (< 10) ise m² cinsinden (Örn: 8.500 m²)
 */
export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0 m²";
  const donum = Number(value);
  if (donum >= 10) {
    const text = Number.isInteger(donum) ? formatNumber(donum) : formatDecimal(donum);
    return `${text} Dönüm`;
  }
  const m2 = Math.round(donum * 1000);
  return `${formatNumber(m2)} m²`;
}

/** 12.5 -> "%12,5" (isaret istege bagli) */
export function formatPercent(value: number | null | undefined, withSign = false) {
  const num = Number(value ?? 0);
  const abs = Math.abs(num);
  const text = Number.isInteger(abs) ? String(abs) : decimalFormat.format(abs);
  if (!withSign) return `%${text}`;
  return `${num < 0 ? "−" : ""}%${text}`;
}

/** Trend metni: "%12,5 vs geçen ay" */
export function formatChange(value: number | null | undefined, suffix = "") {
  const num = Number(value ?? 0);
  return `${formatPercent(num, true)}${suffix ? ` ${suffix}` : ""}`;
}

export function trendOf(value: number | null | undefined): "up" | "down" | "neutral" {
  const num = Number(value ?? 0);
  if (num > 0) return "up";
  if (num < 0) return "down";
  return "neutral";
}

/** ISO tarih -> "20.05.2024" */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** ISO tarih -> "20.05.2024 10:24" */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(date)} ${formatTime(date)}`;
}

/** ISO tarih -> "10:24" */
export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "2 dk önce", "3 saat önce", "Dün", "12.05.2024" */
export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;

  return formatDate(date);
}

/** "20 Mayıs 2026" (sayfa başlıklarındaki tarih düğmesi) */
export function formatLongDate(value: string | Date = new Date()) {
  const date = new Date(value);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Süt/miktar gibi birimli değerler: 28.5, "L" -> "28,5 L" */
export function withUnit(value: number | null | undefined, unit?: string | null) {
  const text = Number.isInteger(Number(value ?? 0))
    ? formatNumber(value)
    : formatDecimal(value);
  return unit ? `${text} ${unit}` : text;
}

/**
 * Backend'den gelen görsel yolları ("/assets/x.png") olduğu gibi kullanılır;
 * boş gelirse tasarımdaki yedek görsele düşülür.
 */
export function imageOr(value: string | null | undefined, fallback: string) {
  return value && value.length > 0 ? value : fallback;
}
