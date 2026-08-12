import {
  Camera,
  CloudUpload,
  Network,
  Smartphone,
  Wifi,
} from "lucide-react";

import { Reveal } from "../shared/Reveal";

export const processSteps = [
  {
    icon: Wifi,
    title: "Akıllı Tasma ve Girişler",
    text: "Sağlık, hareket ve üretim verileri sensörlerden ve saha ekiplerinden toplanır.",
  },
  {
    icon: Network,
    title: "Gateway ve Yerel Ağ",
    text: "Veriler güvenli bağlantı üzerinden çiftlik merkezindeki gateway'e aktarılır.",
  },
  {
    icon: Camera,
    title: "Kamera ile Doğrulama",
    text: "Alarm oluştuğunda RTSP kameralar ilgili alanı anlık görsel olarak doğrular.",
  },
  {
    icon: CloudUpload,
    title: "Bulut ve Veri Tabanı",
    text: "Tüm kayıtlar şifrelenir, yedeklenir ve analiz için tek merkezde birleşir.",
  },
  {
    icon: Smartphone,
    title: "Mobil ve Web Paneli",
    text: "Kararlarınızı canlı bildirimler, raporlar ve grafiklerle her yerden yönetin.",
  },
];

export function ProcessSteps({ five = false }: { five?: boolean }) {
  const items = five ? processSteps : processSteps.slice(0, 4);
  return (
    <div className={`process-grid ${five ? "process-grid--five" : ""}`}>
      {items.map(({ icon: Icon, title, text }, index) => (
        <Reveal delay={index * 90} key={title}>
          <article className="process-card">
            <span className="process-number">{index + 1}</span>
            <span className="process-icon">
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
