import {
  FileCheck2,
  HelpCircle,
  Microscope,
  Smartphone,
  Users,
} from "lucide-react";

import { Reveal } from "../shared/Reveal";

export const processSteps = [
  {
    icon: HelpCircle,
    title: "Sorunuzu & Vakanızı İletin",
    text: "Hayvan belirtileri, tarla fotoğrafları veya tahlil sonuçlarınızı sisteme yükleyin.",
  },
  {
    icon: Users,
    title: "Uzman Havuzuna Yönlendirme",
    text: "Sorunuz alanında yetkili veteriner hekim veya ziraat mühendisimize anında atanır.",
  },
  {
    icon: Microscope,
    title: "Detaylı & Bilimsel İnceleme",
    text: "Uzmanlarımız sahaya inmeden önce verileri, semptomları ve görselleri titizlikle analiz eder.",
  },
  {
    icon: FileCheck2,
    title: "Profesyonel Çözüm & Reçete",
    text: "Uygulanabilir tedavi protokolü, koruyucu hekimlik veya gübreleme tavsiyeniz hazırlanır.",
  },
  {
    icon: Smartphone,
    title: "Mobil ve Web Takip",
    text: "Cevabınız panelinize anında iletilir, sonuçları ve süreci dilediğiniz cihazdan takip edersiniz.",
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
