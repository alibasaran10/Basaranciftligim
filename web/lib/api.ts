/**
 * Backend (Node.js + Express) API istemcisi.
 *
 * Tasarim kararlari:
 *  - Tum veri istemci tarafinda cekilir; boylece kullaniciya ozel JWT ile
 *    calisir ve sayfalar kullaniciya gore dogru veriyi gosterir.
 *  - Access token kisa omurludur; 401 alindiginda refresh token ile TEK SEFER
 *    yenilenip istek tekrarlanir. Es zamanli 401'lerde tek bir yenileme
 *    istegi paylasilir (thundering herd onlenir).
 *  - Token'lar localStorage'da tutulur; XSS'e karsi asil savunma backend'in
 *    girdi temizligi ve CSP'dir, burada ayrica hicbir token loglanmaz.
 */

const DEFAULT_BASE_URL = "http://localhost:4000/api/v1";

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  DEFAULT_BASE_URL;

export const SITE_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL) ||
  "http://localhost:3000";

const ACCESS_KEY = "entegre-access-token";
const REFRESH_KEY = "entegre-refresh-token";
const USER_KEY = "entegre-user";

export type ApiUser = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  gender?: "erkek" | "kadin";
  farm?: string | null;
};

export type ApiMeta = {
  pagination?: {
    strategy: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
  message?: string;
};

/** Sunucudan gelen hatayi durum koduyla birlikte tasir. */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const isBrowser = () => typeof window !== "undefined";

export const tokenStore = {
  access: () => (isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null),
  refresh: () => (isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null),
  user: (): ApiUser | null => {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ApiUser;
    } catch {
      window.localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  save: (tokens: { accessToken: string; refreshToken?: string }, user?: ApiUser) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
    try {
      window.dispatchEvent(new Event("auth:logout"));
    } catch {
      // SSR or non-browser fallback
    }
  },
};

/** Es zamanli 401'lerde tek bir yenileme istegi paylasilir. */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const body = (await response.json()) as ApiEnvelope<{
          accessToken: string;
          refreshToken: string;
        }>;
        tokenStore.save(body.data);
        return body.data.accessToken;
      } catch {
        return null;
      } finally {
        // Sonraki 401'ler yeni bir yenileme baslatabilsin.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }

  return refreshInFlight;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Kimlik gerektirmeyen uclar (login/register) icin false. */
  auth?: boolean;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, auth = true, signal } = options;

  if (auth && !tokenStore.access()) {
    tokenStore.clear();
    throw new ApiError("Erişim tokeni eksik. Lütfen tekrar giriş yapın.", 401);
  }

  const send = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };

  let response: Response;
  try {
    response = await send(auth ? tokenStore.access() : null);
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError(
      "Sunucuya ulaşılamıyor. Backend çalışıyor mu? (" + API_BASE_URL + ")",
      0,
    );
  }

  // Token suresi dolduysa bir kez yenileyip tekrar dene.
  if (response.status === 401 && auth) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      response = await send(fresh);
    } else {
      tokenStore.clear();
    }
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const envelope = payload as { message?: string; error?: { message?: string; details?: unknown } } | null;
    const message =
      envelope?.error?.message ||
      envelope?.message ||
      `İstek başarısız (${response.status})`;
    throw new ApiError(message, response.status, envelope?.error?.details);
  }

  return (payload ?? { success: true, data: null }) as ApiEnvelope<T>;
}

/** Sorgu parametrelerini guvenli sekilde URL'e ekler (bos degerler atlanir). */
export function withQuery(path: string, params: Record<string, unknown> = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Giris: token'lari saklar ve kullaniciyi doner. */
  login: async (email: string, password: string) => {
    const body = await request<{
      user: ApiUser;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    const user = { ...body.data.user, id: body.data.user.id ?? body.data.user._id ?? "" };
    tokenStore.save(body.data, user);
    return user;
  },

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Sunucuya ulasilamasa bile yerel oturum temizlenir.
    }
    tokenStore.clear();
  },

  me: () => request<ApiUser>("/auth/me"),
};

export default api;
