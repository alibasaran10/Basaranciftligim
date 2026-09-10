"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { api, ApiError, tokenStore } from "@/lib/api";
import { makeStore } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateSession, logout } from "@/store/slices/sessionSlice";
import { setTheme } from "@/store/slices/themeSlice";

function Hydrator() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  // Tema tercihi: Varsayılan olarak kullanıcının işletim sistemi/tarayıcı temasına bakar.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      const savedTheme = window.localStorage.getItem("entegre-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        dispatch(setTheme(savedTheme));
      } else {
        const preferred = mediaQuery.matches ? "dark" : "light";
        dispatch(setTheme(preferred));
      }
    };

    syncTheme();

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!window.localStorage.getItem("entegre-theme")) {
        dispatch(setTheme(e.matches ? "dark" : "light"));
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  /**
   * Oturumu geri yukle: once yerel kayittan (aninda gorunsun), ardindan
   * /auth/me ile dogrula. Token gecersizse oturum dusurulur.
   */
  useEffect(() => {
    const handleAuthLogout = () => {
      dispatch(logout());
    };
    window.addEventListener("auth:logout", handleAuthLogout);

    const cached = tokenStore.user();
    if (!tokenStore.access()) {
      dispatch(hydrateSession({ user: null }));
    } else {
      dispatch(hydrateSession({ user: cached }));
    }

    if (!tokenStore.access()) {
      return () => {
        window.removeEventListener("auth:logout", handleAuthLogout);
      };
    }

    let active = true;
    api
      .me()
      .then((envelope) => {
        if (!active) return;
        const user = { ...envelope.data, id: envelope.data.id ?? envelope.data._id ?? "" };
        tokenStore.save({ accessToken: tokenStore.access() as string }, user);
        dispatch(hydrateSession({ user }));
      })
      .catch((error: unknown) => {
        if (!active) return;

        // Yalnizca kimligin GERCEKTEN gecersiz oldugu durumda oturumu dusur.
        // Sunucuya ulasilamamasi (backend yeniden baslatildi, ag koptu) gecici
        // bir durumdur; kullaniciyi cikisa zorlamak yerine onbellekteki
        // oturumla devam edilir, sonraki istek tekrar dener.
        const status = error instanceof ApiError ? error.status : 0;
        if (status === 401 || status === 403) {
          tokenStore.clear();
          dispatch(logout());
        }
      });

    return () => {
      active = false;
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [dispatch]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <Hydrator />
      {children}
    </Provider>
  );
}
