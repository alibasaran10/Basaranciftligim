"use client";

import {
  AlarmClock,
  BarChart3,
  Beef,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Leaf,
  Lock,
  LogOut,
  Menu,
  Moon,
  PackageOpen,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sprout,
  Sun,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api, SITE_BASE_URL, type ApiUser } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, logout } from "@/store/slices/sessionSlice";
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
  { label: "Alarmlar", href: "/alarmlar", icon: AlarmClock, badge: "alerts" },
  { label: "Takvim", href: "/takvim", icon: CalendarDays },
  { label: "Kameralar", href: "/kameralar", icon: Camera },
  { label: "Evraklar", href: "/raporlar", icon: ClipboardList },
  { label: "Finansal", href: "/finans", icon: Coins, adminOnly: true },
  { label: "Kullanıcılar", href: "/kullanicilar", icon: Users, adminOnly: true },
  { label: "Ayarlar", href: "/ayarlar", icon: Settings },
] as const;

function isNavItemAllowed(href: string, user: ApiUser | null) {
  if (!user) return true;
  const role = user.role;
  const job = user.jobTitle ?? "";

  // Admin (İşletme Yöneticisi) tüm menülere tam erişebilir
  if (role === "admin") return true;

  // Finansal ve Kullanıcılar Yönetimi sadece Yönetici (Admin) için
  if (href === "/finans" || href === "/kullanicilar") {
    return false;
  }

  // Veteriner Hekim: Mahsul/Stok, Kameralar, Evraklar (Raporlar), Tarla erişimi yok
  if (job === "Veteriner Hekim") {
    if (
      href === "/stok" ||
      href === "/kameralar" ||
      href === "/raporlar" ||
      href === "/tarlalar" ||
      href.startsWith("/ekim-hasat")
    ) {
      return false;
    }
  }

  // Ziraat Sorumlusu / Mühendisi: Sürü, Kameralar, Evraklar (Raporlar) erişimi yok
  if (job === "Ziraat Sorumlusu" || job === "Ziraat Mühendisi") {
    if (
      href === "/suru" ||
      href === "/kameralar" ||
      href === "/raporlar"
    ) {
      return false;
    }
  }

  // Operatör: Sadece izleme ve kamera/alarm (Sürü, Tarla, Stok, Raporlar gizli)
  if (role === "viewer" || job === "Operatör") {
    if (
      href === "/suru" ||
      href === "/tarlalar" ||
      href.startsWith("/ekim-hasat") ||
      href === "/stok" ||
      href === "/raporlar"
    ) {
      return false;
    }
  }

  return true;
}

type AlertSummary = { totals: { pendingAction: number } };
type FarmSettings = {
  business: { name: string };
  subscription: { plan: string; renewalAt: string | null };
};

const DEMO_PROFILES = [
  {
    name: "Ali Başaran",
    email: "info@basaranciftligi.com",
    roleLabel: "👑 İşletme Yöneticisi (Admin)",
    jobTitle: "İşletme Yöneticisi",
  },
  {
    name: "Dr. Selin Kaya",
    email: "veteriner@basaranciftligim.com",
    roleLabel: "🩺 Veteriner Hekim",
    jobTitle: "Veteriner Hekim",
  },
  {
    name: "Hasan Demir",
    email: "hasan@basaranciftligi.com",
    roleLabel: "🌾 Ziraat Sorumlusu",
    jobTitle: "Ziraat Sorumlusu",
  },
  {
    name: "Ali Yıldız",
    email: "ali@basaranciftligi.com",
    roleLabel: "📹 Operatör",
    jobTitle: "Operatör",
  },
];

function UserProfileSection({
  collapsed,
  variant = "sidebar",
}: {
  collapsed?: boolean;
  variant?: "sidebar" | "topbar";
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.session.user);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchAccount = async (targetEmail: string) => {
    if (currentUser?.email === targetEmail) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const user = await api.login(targetEmail, "Parola00");
      dispatch(login({ user, remembered: true }));
      dispatch(showToast(`${user.name} (${user.jobTitle || user.role}) hesabına geçiş yapıldı.`));
      setOpen(false);
    } catch {
      dispatch(showToast("Hesap değiştirilemedi."));
    } finally {
      setSwitching(false);
    }
  };

  const avatar =
    currentUser?.avatarUrl ||
    (currentUser?.gender === "kadin"
      ? "/assets/profile_farmer_female.png"
      : "/assets/profile_farmer.png");

  if (variant === "topbar") {
    return (
      <div ref={containerRef} style={{ position: "relative" }}>
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "8px",
              minWidth: "240px",
              background: "var(--surface)",
              border: "1px solid var(--line-strong)",
              borderRadius: "14px",
              padding: "10px",
              boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
              zIndex: 100,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                paddingBottom: "8px",
                marginBottom: "6px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              Profiller Arası Geçiş
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {DEMO_PROFILES.map((p) => {
                const active = currentUser?.email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    disabled={switching}
                    onClick={() => handleSwitchAccount(p.email)}
                    className={`profile-switch-item ${active ? "is-active" : ""}`}
                    style={{
                      border: active ? "1px solid var(--green-600)" : "1px solid transparent",
                      background: active ? "rgba(22, 131, 70, 0.16)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: active ? 700 : 600, color: "var(--text)" }}>
                        {p.name}
                      </span>
                      <small style={{ fontSize: "11px", color: "var(--muted)" }}>{p.roleLabel}</small>
                    </div>
                    {active && <Check size={16} style={{ color: "var(--green-600)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <div
            className="topbar-user sidebar-user-info"
            onClick={() => router.push("/ayarlar")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
            title="Ayarlar Sayfasına Git"
          >
            <div className="topbar-avatar-wrap">
              <Image src={avatar} alt="" width={38} height={38} unoptimized />
            </div>
            <span>
              <strong>{currentUser?.name ?? "—"}</strong>
              <small>{currentUser?.jobTitle ?? "Kullanıcı"}</small>
            </span>
          </div>
          <button
            type="button"
            className="profile-switch-btn"
            aria-label="Profil Değiştir"
            onClick={() => setOpen((v) => !v)}
            style={{
              background: open ? "var(--line)" : "transparent",
            }}
            title="Profiller Arası Geçiş Yap"
          >
            <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", marginTop: "4px" }}>
      {open && !collapsed && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: "8px",
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
            borderRadius: "14px",
            padding: "10px",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              paddingBottom: "8px",
              marginBottom: "6px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            Profiller Arası Geçiş
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {DEMO_PROFILES.map((p) => {
              const active = currentUser?.email === p.email;
              return (
                <button
                  key={p.email}
                  type="button"
                  disabled={switching}
                  onClick={() => handleSwitchAccount(p.email)}
                  className={`profile-switch-item ${active ? "is-active" : ""}`}
                  style={{
                    border: active ? "1px solid var(--green-600)" : "1px solid transparent",
                    background: active ? "rgba(22, 131, 70, 0.16)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: active ? 700 : 600, color: "var(--text)" }}>
                      {p.name}
                    </span>
                    <small style={{ fontSize: "11px", color: "var(--muted)" }}>{p.roleLabel}</small>
                  </div>
                  {active && <Check size={16} style={{ color: "var(--green-600)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="sidebar-user"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "8px 9px",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "10px",
        }}
      >
        <div
          className="sidebar-user-info"
          onClick={() => {
            dispatch(setMobileMenu(false));
            router.push("/ayarlar");
          }}
          title="Ayarlar Sayfasına Git"
        >
          <Image
            src={avatar}
            alt={currentUser?.name ?? ""}
            width={42}
            height={42}
            unoptimized
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          {!collapsed && (
            <span style={{ display: "grid", minWidth: 0, flex: 1 }}>
              <strong style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUser?.name ?? "—"}
              </strong>
              <small style={{ fontSize: "11.5px", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUser?.jobTitle ?? "Kullanıcı"}
              </small>
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            className="profile-switch-btn"
            aria-label="Profil Değiştir"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            style={{
              background: open ? "rgba(255, 255, 255, 0.18)" : "transparent",
            }}
            title="Profiller Arası Geçiş Yap"
          >
            <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }} />
          </button>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  openAlerts,
  settings,
}: {
  openAlerts: number | null;
  settings: FarmSettings | null;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const user = useAppSelector((state) => state.session.user);

  const filteredNav = nav.filter((item) => isNavItemAllowed(item.href, user));

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
          {filteredNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
              (item.href === "/tarlalar" && pathname.startsWith("/ekim-hasat"));
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
                  {(item.href === "/finans" || item.href === "/tarlalar" || item.href === "/takvim") &&
                    !collapsed && <ChevronDown />}
                </Link>
                {item.href === "/finans" && active && !collapsed && (
                  <div className="nav-submenu">
                    <Link
                      href="/finans"
                      className={pathname === "/finans" ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Genel Bakış
                    </Link>
                    <Link
                      href="/finans/gelirler"
                      className={pathname.startsWith("/finans/gelirler") ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Gelirler
                    </Link>
                    <Link
                      href="/finans/giderler"
                      className={pathname.startsWith("/finans/giderler") ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Giderler
                    </Link>
                  </div>
                )}
                {item.href === "/tarlalar" && active && !collapsed && (
                  <div className="nav-submenu">
                    <Link
                      href="/tarlalar"
                      className={pathname === "/tarlalar" || pathname.startsWith("/tarlalar/") ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Tarlalarım
                    </Link>
                    <Link
                      href="/ekim-hasat"
                      className={pathname.startsWith("/ekim-hasat") ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Ekim / Hasat Kayıtları
                    </Link>
                  </div>
                )}
                {item.href === "/takvim" && active && !collapsed && (
                  <div className="nav-submenu">
                    <Link
                      href="/takvim?tab=gunum"
                      className={!searchParams.get("tab") || searchParams.get("tab") === "gunum" ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Takvim Görünümü
                    </Link>
                    <Link
                      href="/takvim?tab=notlar"
                      className={searchParams.get("tab") === "notlar" ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Notlar
                    </Link>
                    <Link
                      href="/takvim?tab=yakindakiler"
                      className={searchParams.get("tab") === "yakindakiler" ? "is-active" : ""}
                      onClick={() => dispatch(setMobileMenu(false))}
                    >
                      Yakındakiler
                    </Link>
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
              <a
                href={`${SITE_BASE_URL}/fiyatlandirma`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 650,
                  borderRadius: "6px",
                  background: "var(--green-600)",
                  color: "#ffffff",
                  textDecoration: "none",
                  marginTop: "8px",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                Planı Yükselt
              </a>
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
        <UserProfileSection collapsed={collapsed} variant="sidebar" />
      </aside>
    </>
  );
}

function Topbar({ openAlerts }: { openAlerts: number | null }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const mode = useAppSelector((state) => state.theme.mode);
  const search = useAppSelector((state) => state.ui.search);

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
        <UserProfileSection variant="topbar" />
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

  const quickModalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (modal && quickModalRef.current) {
      quickModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [modal]);

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
            ref={quickModalRef}
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
  const pathname = usePathname();
  const authenticated = useAppSelector((state) => state.session.authenticated);
  const user = useAppSelector((state) => state.session.user);

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
  const isRestrictedRoute = Boolean(user && user.role !== "admin" && !isNavItemAllowed(pathname, user));

  return (
    <div className="app-shell">
      <Sidebar openAlerts={openAlerts} settings={settings} />
      <div className="app-frame">
        <Topbar openAlerts={openAlerts} />
        <main className="app-main">
          {isRestrictedRoute ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", maxWidth: "560px", margin: "2rem auto" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem"
              }}>
                <ShieldAlert size={32} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Yetkisiz Erişim</h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Bu sayfaya erişim yetkiniz bulunmamaktadır. Şu anki hesabınız: <strong>{user?.name}</strong> ({user?.jobTitle || user?.role}).
                Bu alana sadece <strong>İşletme Yöneticisi (Admin)</strong> rolüne sahip kullanıcılar erişebilir.
              </p>
              <button className="button button-primary" onClick={() => router.push("/dashboard")}>
                Ana Sayfaya Dön
              </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <GlobalOverlays />
    </div>
  );
}
