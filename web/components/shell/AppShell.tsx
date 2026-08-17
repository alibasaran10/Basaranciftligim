"use client";

import {
  AlarmClock,
  BarChart3,
  Beef,
  Bell,
  CalendarDays,
  Camera,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Moon,
  PackageOpen,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Sprout,
  Sun,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/sessionSlice";
import { toggleTheme } from "@/store/slices/themeSlice";
import {
  clearToast,
  closeModal,
  openModal,
  setMobileMenu,
  setSearch,
  showToast,
  toggleSidebar,
} from "@/store/slices/uiSlice";

import { Logo } from "../brand/Logo";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sürü Yönetimi", href: "/suru", icon: Beef },
  { label: "Tarla Yönetimi", href: "/tarlalar", icon: Sprout },
  { label: "Mahsul / Stok", href: "/stok", icon: PackageOpen },
  { label: "Ekim / Hasat", href: "/ekim-hasat", icon: Leaf },
  { label: "Alarmlar", href: "/alarmlar", icon: AlarmClock, badge: "alerts" },
  { label: "Takvim", href: "/takvim", icon: CalendarDays },
  { label: "Kameralar", href: "/kameralar", icon: Camera },
  { label: "Raporlar", href: "/raporlar", icon: BarChart3 },
  { label: "Finansal", href: "/finans", icon: Coins },
  { label: "Kullanıcılar", href: "/kullanicilar", icon: Users },
  { label: "Ayarlar", href: "/ayarlar", icon: Settings },
] as const;

type AlertSummary = { totals: { pendingAction: number } };
type FarmSettings = {
  business: { name: string };
  subscription: { plan: string; renewalAt: string | null };
};

function Sidebar({
  openAlerts,
  settings,
}: {
  openAlerts: number | null;
  settings: FarmSettings | null;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const user = useAppSelector((state) => state.session.user);

  return (
    <>
      <button
        aria-label="Menüyü kapat"
        className={`sidebar-scrim ${mobileOpen ? "is-open" : ""}`}
        onClick={() => dispatch(setMobileMenu(false))}
      />
      <aside
        className={`app-sidebar ${collapsed ? "is-collapsed" : ""} ${
          mobileOpen ? "is-mobile-open" : ""
        }`}
      >
        <div className="sidebar-head">
          <Logo compact={collapsed} />
          <button
            className="sidebar-mobile-close"
            aria-label="Menüyü kapat"
            onClick={() => dispatch(setMobileMenu(false))}
          >
            <X />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Uygulama menüsü">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const count = "badge" in item ? openAlerts : null;
            return (
              <div className="nav-item-wrap" key={item.href}>
                <Link
                  className={active ? "is-active" : ""}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={() => dispatch(setMobileMenu(false))}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  {!!count && <b>{count}</b>}
                  {(item.href === "/finans" || item.href === "/tarlalar") &&
                    !collapsed && <ChevronDown />}
                </Link>
                {item.href === "/finans" && active && !collapsed && (
                  <div className="nav-submenu">
                    <Link href="/finans">Genel Bakış</Link>
                    <Link href="/finans/gelirler">Gelirler</Link>
                    <Link href="/finans/giderler">Giderler</Link>
                  </div>
                )}
                {item.href === "/tarlalar" && active && !collapsed && (
                  <div className="nav-submenu">
                    <Link href="/tarlalar">Tarlalarım</Link>
                    <Link href="/ekim-hasat">Ekim / Hasat Kayıtları</Link>
                    <Link href="/stok">Stok Yönetimi</Link>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        {!collapsed && (
          <>
            <div className="plan-card">
              <span>
                {settings
                  ? `${settings.subscription.plan.charAt(0)}${settings.subscription.plan
                      .slice(1)
                      .toLocaleLowerCase("tr-TR")} Plan`
                  : "Plan"}
              </span>
              <small>
                {settings?.subscription.renewalAt
                  ? `Planınız ${formatDate(
                      settings.subscription.renewalAt,
                    )} tarihinde yenilenecek.`
                  : "Abonelik bilgisi yükleniyor."}
              </small>
              <button onClick={() => dispatch(showToast("Plan yönetimi açıldı."))}>
                Planı Yükselt
              </button>
            </div>
            <Link href="/yardim" className="help-card">
              <CircleHelp />
              <strong>Yardım Merkezi</strong>
            </Link>
          </>
        )}
        <button className="collapse-button" onClick={() => dispatch(toggleSidebar())}>
          <PanelLeftClose />
          <span>Menüyü {collapsed ? "Genişlet" : "Daralt"}</span>
        </button>
        <div className="sidebar-user">
          <Image
            src={user?.avatarUrl || "/assets/profile_farmer.png"}
            alt={user?.name ?? ""}
            width={42}
            height={42}
            unoptimized
          />
          {!collapsed && (
            <span>
              <strong>{user?.name ?? "—"}</strong>
              <small>{user?.jobTitle ?? "Kullanıcı"}</small>
            </span>
          )}
          {!collapsed && <ChevronDown />}
        </div>
      </aside>
    </>
  );
}

function Topbar({ openAlerts }: { openAlerts: number | null }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const mode = useAppSelector((state) => state.theme.mode);
  const search = useAppSelector((state) => state.ui.search);
  const user = useAppSelector((state) => state.session.user);

  const signOut = async () => {
    await api.logout();
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header className="app-topbar">
      <button
        className="mobile-menu-trigger"
        aria-label="Menüyü aç"
        onClick={() => dispatch(setMobileMenu(true))}
      >
        <Menu />
      </button>
      <label className="global-search">
        <Search />
        <input
          value={search}
          onChange={(event) => dispatch(setSearch(event.target.value))}
          placeholder="Ara... (hayvan, tarla, stok, rapor...)"
        />
      </label>
      <div className="topbar-actions">
        <button className="button button-primary" onClick={() => dispatch(openModal("quick"))}>
          <Plus /> <span>Hızlı İşlem</span> <ChevronDown />
        </button>
        <button
          className="icon-button"
          aria-label={mode === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
          onClick={() => dispatch(toggleTheme())}
        >
          {mode === "light" ? <Moon /> : <Sun />}
        </button>
        <Link className="icon-button has-badge" aria-label="Bildirimler" href="/alarmlar">
          <Bell />
          {!!openAlerts && <b>{openAlerts}</b>}
        </Link>
        <button className="icon-button" aria-label="Yardım">
          <CircleHelp />
        </button>
        <Link className="topbar-user" href="/ayarlar">
          <Image
            src={user?.avatarUrl || "/assets/profile_farmer.png"}
            alt=""
            width={38}
            height={38}
            unoptimized
          />
          <span>
            <strong>{user?.name ?? "—"}</strong>
            <small>{user?.jobTitle ?? "Kullanıcı"}</small>
          </span>
          <ChevronDown />
        </Link>
        <button className="icon-button signout-button" onClick={signOut} aria-label="Çıkış yap">
          <LogOut />
        </button>
      </div>
    </header>
  );
}

function GlobalOverlays() {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);
  const toast = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dispatch(clearToast()), 2600);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <>
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => dispatch(closeModal())}>
          <section
            className="action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-action-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <span>
                <strong id="quick-action-title">Hızlı İşlem</strong>
                <small>Yeni bir kayıt oluşturun</small>
              </span>
              <button
                className="icon-button"
                aria-label="Hızlı işlem penceresini kapat"
                onClick={() => dispatch(closeModal())}
              >
                <X />
              </button>
            </div>
            <div className="quick-grid">
              {[
                [Beef, "Yeni Hayvan", "Sürüye yeni hayvan ekleyin"],
                [Sprout, "Yeni Tarla", "Arazi kaydı oluşturun"],
                [ClipboardList, "Yeni İşlem", "Operasyon kaydı ekleyin"],
                [Bell, "Alarm İncele", "Aktif uyarıları görüntüleyin"],
              ].map(([Icon, title, copy]) => {
                const ActionIcon = Icon as typeof Beef;
                return (
                  <button
                    key={title as string}
                    onClick={() => {
                      dispatch(closeModal());
                      dispatch(showToast(`${title} ekranı hazırlandı.`));
                    }}
                  >
                    <ActionIcon />
                    <span>
                      <strong>{title as string}</strong>
                      <small>{copy as string}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {toast && <div className="app-toast">{toast}</div>}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authenticated = useAppSelector((state) => state.session.authenticated);

  // Oturum yoksa portal icerigi hic render edilmez.
  useEffect(() => {
    if (authenticated === false) router.replace("/login");
  }, [authenticated, router]);

  // Rozet sayilari her ekranda gorunur; tek bir ozet istegiyle beslenir.
  const { data: alerts } = useApi<AlertSummary>(authenticated ? "/alerts/summary" : null);
  const { data: settings } = useApi<FarmSettings>(authenticated ? "/farm/settings" : null);

  if (authenticated !== true) {
    return <div className="route-guard">Oturum doğrulanıyor…</div>;
  }

  const openAlerts = alerts?.totals.pendingAction ?? null;

  return (
    <div className="app-shell">
      <Sidebar openAlerts={openAlerts} settings={settings} />
      <div className="app-frame">
        <Topbar openAlerts={openAlerts} />
        <main className="app-main">{children}</main>
      </div>
      <GlobalOverlays />
    </div>
  );
}
