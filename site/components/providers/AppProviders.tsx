"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { makeStore } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/themeSlice";

function ThemeHydrator() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    const saved = window.localStorage.getItem("surum-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    dispatch(setTheme(saved === "dark" || saved === "light" ? saved : preferred));
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem("surum-theme", mode);
  }, [mode]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <ThemeHydrator />
      {children}
    </Provider>
  );
}
