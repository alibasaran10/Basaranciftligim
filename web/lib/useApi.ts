"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, ApiError, type ApiEnvelope, type ApiMeta } from "./api";

export type AsyncResult<T> = {
  data: T | null;
  meta: ApiMeta | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Tek bir GET ucundan veri ceker.
 *
 * - `path` degistiginde otomatik yeniden cagrilir.
 * - Onceki istek iptal edilir (AbortController) -> yaris kosulu olmaz.
 * - `refetch` ile elle yenilenebilir (yazma isleminden sonra).
 */
export function useApi<T>(path: string | null, deps: unknown[] = []): AsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<ApiMeta | undefined>(undefined);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!path) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let active = true;
    // Veri cekme efekti: istegin basladigini bildirmek icin setState zorunlu.
    setLoading(true);
    setError(null);

    api
      .get<T>(path, controller.signal)
      .then((envelope: ApiEnvelope<T>) => {
        if (!active) return;
        setData(envelope.data);
        setMeta(envelope.meta);
      })
      .catch((err: unknown) => {
        if (!active || (err as Error)?.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "Veri alınamadı.");
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce, ...deps]);

  return { data, meta, loading, error, refetch };
}

/**
 * Birden fazla ucu paralel ceker. Ekranlarin cogunda "summary" + "list"
 * ikilisi gerektigi icin pratik bir kisayol.
 */
export function useApiAll<T extends Record<string, unknown>>(
  paths: Record<keyof T, string | null>,
  deps: unknown[] = [],
): {
  data: Partial<T>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);
  const key = JSON.stringify(paths);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const entries = Object.entries(paths).filter(([, value]) => !!value) as [string, string][];

    Promise.all(
      entries.map(([name, url]) =>
        api.get<unknown>(url, controller.signal).then((envelope) => [name, envelope.data] as const),
      ),
    )
      .then((results) => {
        if (!active) return;
        setData(Object.fromEntries(results) as Partial<T>);
      })
      .catch((err: unknown) => {
        if (!active || (err as Error)?.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "Veri alınamadı.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, ...deps]);

  return { data, loading, error, refetch };
}

export default useApi;
