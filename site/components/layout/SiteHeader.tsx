"use client";

import {
  ArrowRight,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/themeSlice";
import { openDemoModal, setMobileMenu } from "@/store/slices/uiSlice";
import { Logo } from "../shared/Logo";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/nasil-calisir", label: "Nasıl Çalışır?" },
  { href: "/referanslar", label: "Referanslar" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const theme = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    dispatch(setMobileMenu(false));
  }, [pathname, dispatch]);

  const onThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("surum-theme", next);
    dispatch(toggleTheme());
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav
          className={`main-nav ${mobileOpen ? "is-open" : ""}`}
          aria-label="Ana menü"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "is-active" : ""}
            >
              {item.label}
            </Link>
          ))}
          <button
            className="btn btn-primary nav-demo-mobile"
            onClick={() => dispatch(openDemoModal())}
          >
            Demo Talep Et <ArrowRight size={17} />
          </button>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
            onClick={onThemeToggle}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <button
            className="btn btn-primary header-demo"
            onClick={() => dispatch(openDemoModal())}
          >
            Demo Talep Et <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => dispatch(setMobileMenu(!mobileOpen))}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
