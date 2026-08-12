"use client";

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

/**
 * Veri cekme durumlarinin ortak gosterimi.
 * Tasarim bozulmasin diye yukleme sirasinda ayni yerlesimde "iskelet"
 * bloklari gosterilir; hata durumunda tekrar deneme sunulur.
 */

export function Skeleton({
  height = 16,
  width = "100%",
  radius = 8,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="skeleton"
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Kart/panel icin dikey iskelet grubu. */
export function SkeletonBlock({ rows = 3, height = 16 }: { rows?: number; height?: number }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={height} width={index === rows - 1 ? "62%" : "100%"} />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`state-box is-error ${compact ? "is-compact" : ""}`} role="alert">
      <AlertTriangle />
      <span>
        <strong>Veri yüklenemedi</strong>
        <small>{message}</small>
      </span>
      {onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          <RefreshCw /> Tekrar Dene
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Kayıt bulunamadı",
  description = "Bu görünüm için henüz veri girilmemiş.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={`state-box ${compact ? "is-compact" : ""}`}>
      <Inbox />
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </div>
  );
}

/**
 * Yukleme / hata / bos durumlarini tek yerde ele alan sarmalayici.
 * `data` geldiyse children render edilir.
 */
export function AsyncBoundary<T>({
  loading,
  error,
  data,
  onRetry,
  skeleton,
  emptyWhen,
  emptyTitle,
  children,
}: {
  loading: boolean;
  error: string | null;
  data: T | null | undefined;
  onRetry?: () => void;
  skeleton?: React.ReactNode;
  emptyWhen?: (data: T) => boolean;
  emptyTitle?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (loading && (data === null || data === undefined)) {
    return <>{skeleton ?? <SkeletonBlock rows={4} />}</>;
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (data === null || data === undefined) return <EmptyState title={emptyTitle} />;
  if (emptyWhen?.(data)) return <EmptyState title={emptyTitle} />;
  return <>{children(data)}</>;
}

export default AsyncBoundary;
