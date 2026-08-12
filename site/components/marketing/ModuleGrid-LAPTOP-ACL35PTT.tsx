import Link from "next/link";
import {
  BellRing,
  CalendarHeart,
  Camera,
  CloudCog,
  Leaf,
  Sprout,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { Reveal } from "../shared/Reveal";

export const moduleItems = [
  {
    icon: Sprout,
    title: "Tarla ve Mahsul Yönetimi",
    text: "Arazi kayıtları, toprak analizi, sulama planı ve hasat verilerini tek ekranda yönetin.",
  },
  {
    icon: Leaf,
    title: "Ekim / Hasat Takibi",
    text: "Ekim tarihinden hasada kadar tüm üretim sürecini planlayın ve verimliliği ölçün.",
  },
  {
    icon: Warehouse,
    title: "Verim ve Stok Yönetimi",
    text: "Ürün, yem, tohum ve silo stoklarını otomatik olarak izleyin.",
  },
  {
    icon: TrendingUp,
    title: "Sürü Yönetimi",
    text: "Hayvan kartları, sağlık, ağırlık ve verim bilgilerini güncel tutun.",
  },
  {
    icon: CalendarHeart,
    title: "Tohumlama ve Doğum Takvimi",
    text: "Kritik üreme tarihlerini planlayın, yaklaşan doğumları kaçırmayın.",
  },
  {
    icon: BellRing,
    title: "Kızgınlık / Stres Alarmı",
    text: "Akıllı tasma verileriyle riskleri anlık tespit edin ve hızlı aksiyon alın.",
  },
  {
    icon: Camera,
    title: "Kamera ile Görsel Doğrulama",
    text: "RTSP kameralarla ahır, mera ve doğum alanlarını uzaktan izleyin.",
  },
  {
    icon: CloudCog,
    title: "Bulut Sunucu ve Veri Güvenliği",
    text: "Verilerinizi güvenle saklayın, yedekleyin ve yetkili cihazlardan erişin.",
  },
];

export function ModuleGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`module-grid ${compact ? "module-grid--compact" : ""}`}>
      {moduleItems.map(({ icon: Icon, title, text }, index) => (
        <Reveal delay={index * 55} key={title}>
          <article className="module-card">
            <span className="module-icon">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            <Link href="/ozellikler" className="module-link">Detayları keşfedin →</Link>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
