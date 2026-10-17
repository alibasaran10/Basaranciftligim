import {
  CalendarHeart,
  CloudCog,
  FileQuestion,
  Leaf,
  Sprout,
  Stethoscope,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { Reveal } from "../shared/Reveal";

export const moduleItems = [
  {
    icon: Sprout,
    title: "Tarla ve Mahsul Yönetimi",
    text: "Arazi kayıtları, sulama ve toprak analizi süreçlerini tek ekrandan yönetin.",
  },
  {
    icon: Leaf,
    title: "Ekim ve Hasat Takibi",
    text: "Ekimden hasada kadar tüm üretim sürecini planlayın ve verimi ölçün.",
  },
  {
    icon: Warehouse,
    title: "Verim ve Stok Yönetimi",
    text: "Ürün, yem, tohum ve silo stoklarınızı otomatik olarak güncel tutun.",
  },
  {
    icon: TrendingUp,
    title: "Sürü Takip Yönetimi",
    text: "Hayvan kartları, aşı takvimi, sağlık ve günlük verimleri izleyin.",
  },
  {
    icon: CalendarHeart,
    title: "Tohumlama & Doğum Takvimi",
    text: "Kritik üreme tarihlerini planlayın, yaklaşan doğumları vaktinde takip edin.",
  },
  {
    icon: Stethoscope,
    title: "Veteriner Soru Havuzu",
    text: "Sürü sağlığı vakalarınızı iletin, sahaya inmeden hızlı ön teşhis alın.",
  },
  {
    icon: FileQuestion,
    title: "Ziraat Danışmanlığı",
    text: "Toprak analizi, gübreleme ve bitki koruma sorularınızı uzmanlara yöneltin.",
  },
  {
    icon: CloudCog,
    title: "Bulut ve Veri Güvenliği",
    text: "Verilerinizi ve uzman raporlarınızı güvenle saklayın, her yerden erişin.",
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
          </article>
        </Reveal>
      ))}
    </div>
  );
}
