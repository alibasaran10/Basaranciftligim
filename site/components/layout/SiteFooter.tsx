import { Camera, CirclePlay, Mail, MapPin, Network, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "../shared/Logo";

const groups = [
  {
    title: "Ürün",
    links: [
      ["Özellikler", "/ozellikler"],
      ["Nasıl Çalışır?", "/nasil-calisir"],
      ["Fiyatlandırma", "/fiyatlandirma"],
      ["Entegrasyonlar", "/ozellikler#entegrasyonlar"],
    ],
  },
  {
    title: "Kurumsal",
    links: [
      ["Hakkımızda", "/#hakkimizda"],
      ["Referanslar", "/referanslar"],
      ["Kariyer", "/iletisim"],
      ["Blog", "/#blog"],
    ],
  },
  {
    title: "Destek",
    links: [
      ["Yardım Merkezi", "/nasil-calisir#sss"],
      ["Sık Sorulan Sorular", "/nasil-calisir#sss"],
      ["Kullanım Kılavuzu", "/iletisim"],
      ["Teknik Destek", "/iletisim"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>
            Hayvancılık ve tarla yönetimini tek platformda buluşturan akıllı
            çiftlik yönetim sistemi.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Instagram">
              <Camera size={17} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Network size={17} />
            </a>
            <a href="#" aria-label="YouTube">
              <CirclePlay size={17} />
            </a>
          </div>
        </div>
        {groups.map((group) => (
          <div className="footer-column" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => (
              <Link href={href} key={label}>
                {label}
              </Link>
            ))}
          </div>
        ))}
        <div className="footer-column footer-contact">
          <h3>İletişim</h3>
          <a href="tel:+908502550055">
            <Phone size={15} /> +90 850 255 00 55
          </a>
          <a href="mailto:info@surum.com">
            <Mail size={15} /> info@surum.com
          </a>
          <span>
            <MapPin size={15} /> Teknoloji Geliştirme Bölgesi, Konya / Türkiye
          </span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 SÜRÜM. Tüm hakları saklıdır.</span>
        <div>
          <Link href="/gizlilik">Gizlilik Politikası</Link>
          <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
          <Link href="/kvkk">KVKK</Link>
        </div>
      </div>
    </footer>
  );
}
