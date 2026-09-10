import type { Metadata } from "next";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Cloud,
  Headphones,
  Radio,
} from "lucide-react";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Faq } from "@/components/marketing/Faq";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "İşletmenizin ölçeğine uygun Basaranciftligim yazılım ve donanım paketlerini karşılaştırın.",
};

const hardware = [
  [Radio, "Akıllı Tasma", "600 ₺ / adet", "Sağlık, hareket ve kızgınlık takibi"],
  [Cloud, "Gateway + Kurulum", "1.000 ₺", "Yerel veri toplama ve güvenli aktarım"],
  [Camera, "Kamera Entegrasyonu", "Özel teklif", "Mevcut RTSP altyapısıyla uyum"],
  [Headphones, "Yerinde Eğitim", "Pakete dahil", "Kurulum ve ekip eğitimi"],
] as const;

export default function PricingPage() {
  return (
    <main>
      <section className="simple-hero">
        <div className="container">
          <span className="eyebrow">Şeffaf ve sürdürülebilir maliyet</span>
          <h1>
            İşletmenize Uygun, <span>Büyüdükçe Ölçeklenen Planlar</span>
          </h1>
          <p>
            İhtiyacınız olan modüllerle başlayın, çiftliğiniz büyüdükçe yeni
            özellikleri kolayca ekleyin. Gizli ücret yok.
          </p>
          <div className="hero-proof hero-proof--center">
            <span><CheckCircle2 /> 14 gün ücretsiz</span>
            <span><CheckCircle2 /> Kurulum desteği</span>
            <span><CheckCircle2 /> İstediğiniz zaman yükseltin</span>
          </div>
        </div>
      </section>

      <section className="section container pricing-page">
        <PricingCards />
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Donanım ve altyapı"
            title="Sahaya Hazır Teknoloji Paketleri"
            description="Yalnızca ihtiyacınız olan donanımı seçin; mevcut altyapınızı kullanarak maliyeti düşürün."
          />
          <div className="hardware-grid">
            {hardware.map(([Icon, title, price, text], index) => (
              <Reveal delay={index * 70} key={title}>
                <article className="hardware-card">
                  <Icon />
                  <h3>{title}</h3>
                  <strong>{price}</strong>
                  <p>{text}</p>
                  <BadgeCheck />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section container faq-layout" id="sss">
        <SectionHeading
          eyebrow="Fiyatlandırma soruları"
          title="Karar Vermeden Önce"
          align="left"
        />
        <Faq />
      </section>

      <div className="section">
        <CtaBanner />
      </div>
    </main>
  );
}
