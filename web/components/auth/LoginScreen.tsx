"use client";

import {
  BarChart3,
  Bell,
  Cloud,
  Eye,
  EyeOff,
  Globe2,
  Leaf,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sprout,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { api, ApiError } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/sessionSlice";

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authenticated = useAppSelector((state) => state.session.authenticated);

  const [email, setEmail] = useState("info@basaranciftligi.com");
  const [password, setPassword] = useState("Parola00");
  const [showPassword, setShowPassword] = useState(false);
  const [remembered, setRemembered] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zaten oturum acikken giris ekraninda kalinmaz.
  useEffect(() => {
    if (authenticated) router.replace("/dashboard");
  }, [authenticated, router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await api.login(email.trim(), password);
      dispatch(login({ user, remembered }));
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Giriş yapılamadı, tekrar deneyin.",
      );
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Parola00");
    setError(null);
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-overlay" />
        <div className="login-brand">
          <Logo />
        </div>
        <div className="login-copy">
          <h1>
            Çiftliğiniz
            <br />
            Parmaklarınızın
            <br />
            <span>Ucunda</span>
          </h1>
          <p>
            Sürü takibi, tarla yönetimi, üretim planlama ve daha fazlası tek bir
            akıllı sistemde.
          </p>
          <div className="login-features">
            {[
              [Sprout, "Akıllı Sürü Takibi"],
              [Leaf, "Tarla & Mahsul Yönetimi"],
              [BarChart3, "Veri Analizi & Raporlama"],
              [Bell, "Anlık Uyarı Sistemleri"],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof Sprout;
              return (
                <span key={label as string}>
                  <FeatureIcon />
                  <small>{label as string}</small>
                </span>
              );
            })}
          </div>
        </div>
        <div className="login-trust">
          <span>
            <ShieldCheck />
            <strong>%99,9</strong>
            <small>Sistem Güvenilirliği</small>
          </span>
          <span>
            <Cloud />
            <strong>7/24</strong>
            <small>Kesintisiz Erişim</small>
          </span>
          <span>
            <LockKeyhole />
            <strong>256-bit SSL</strong>
            <small>Güvenli Bağlantı</small>
          </span>
        </div>
      </section>

      <section className="login-form-side">
        <div className="language-picker">
          <Globe2 />
          <span>Türkçe</span>
        </div>
        <div className="login-card">
          <div className="login-card-icon">
            <Sprout />
          </div>
          <h2>Hoş Geldiniz!</h2>
          <p>Hesabınıza giriş yaparak sisteme devam edin.</p>

          <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Hızlı Demo Hesap Seçimi:</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {[
                { label: "👑 Yönetici", demoEmail: "info@basaranciftligi.com" },
                { label: "🩺 Veteriner", demoEmail: "veteriner@basaranciftligim.com" },
                { label: "🌾 Ziraat Sorumlusu", demoEmail: "hasan@basaranciftligi.com" },
              ].map(({ label, demoEmail }) => {
                const isSelected = email === demoEmail;
                return (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() => setDemoAccount(demoEmail)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.8rem",
                      borderRadius: "0.5rem",
                      border: isSelected ? "1px solid var(--green-600)" : "1px solid var(--line)",
                      background: isSelected ? "var(--surface-3)" : "var(--surface-2)",
                      color: isSelected ? "var(--text)" : "var(--muted)",
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 500,
                      transition: "all 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={submit}>
            <label>
              E-posta Adresi
              <span className="input-wrap">
                <Mail />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                />
              </span>
            </label>
            <label>
              Şifre
              <span className="input-wrap">
                <LockKeyhole />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifrenizi giriniz"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            {error && (
              <p className="login-error" role="alert">
                <TriangleAlert /> {error}
              </p>
            )}
            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  checked={remembered}
                  onChange={(event) => setRemembered(event.target.checked)}
                />
                Beni Hatırla
              </label>
              <button type="button">Şifremi Unuttum?</button>
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              <LogIn />
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
          <div className="login-divider">
            <span>veya</span>
          </div>
          <button className="google-button" type="button" disabled>
            <b>G</b> Google ile Giriş Yap
          </button>
          <p className="signup-copy">
            Hesabınız yok mu? <button type="button">Hemen kayıt olun</button>
          </p>
        </div>
      </section>
      <footer className="login-footer">
        <Logo />
        <span>
          <ShieldCheck />
          <b>Verileriniz Güvende</b>
          <small>256-bit SSL ile korunur</small>
        </span>
        <span>
          <Globe2 />
          <b>Türkiye Lokasyonlu Sunucu</b>
          <small>Hızlı ve kesintisiz erişim</small>
        </span>
        <span>
          <Wifi />
          <b>Yedekli & Güvenilir Altyapı</b>
          <small>Verileriniz her zaman güvende</small>
        </span>
        <small>© 2026 Sürü & Çiftlik Yönetim Sistemi.</small>
      </footer>
    </main>
  );
}
