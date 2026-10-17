import type { Metadata } from "next";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  GraduationCap,
  Leaf,
  MessageSquare,
  Stethoscope,
} from "lucide-react";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Faq } from "@/components/marketing/Faq";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Uzman veteriner ve ziraat mühendisi soru havuzu paketleri ile çiftliğiniz için en uygun danışmanlık planını seçin.",
};

const expertServices = [
  [Stethoscope, "Uzman Veteriner Desteği", "Plan Dahilinde", "Sürü sağlığı, hastalık semptomları ve koruyucu hekimlik tavsiyeleri"],
  [Leaf, "Ziraat Mühendisi Havuzu", "Plan Dahilinde", "Toprak analizi, gübreleme, ekim planı ve bitki koruma çözümleri"],
  [Clock, "Hızlı & Öncelikli Yanıt", "Ortalama 2 Saat", "Sahaya inmeden fotoğraflı vaka analizi ve hızlı geri dönüş"],
  [FileCheck, "Reçete ve Eylem Planı", "Pakete Dahil", "Bilimsel tedavi protokolleri, besleme ve uygulama rehberleri"],
] as const;

export default function PricingPage() {
  return (
    <main>
      <section className="simple-hero">
        <div className="container">
          <span className="eyebrow">Şeffaf ve sohbet bazlı maliyet</span>
          <h1>
            İşletmenize Uygun, <span>Uzman Destekli Sohbet Planları</span>
          </h1>
          <p>
            Her yeni kullanıcıya 1 ücretsiz sohbet hakkı! Hayvan ve kullanıcı
            sınırına takılmadan, doğrudan ihtiyacınız olan uzman desteğini seçin.
          </p>
          <div className="hero-proof hero-proof--center">
            <span><CheckCircle2 /> İlk sohbet ücretsiz (1 sohbet hakkı hediye)</span>
            <span><CheckCircle2 /> Sahaya inmeden uzman teşhisi</span>
            <span><CheckCircle2 /> Veteriner & Ziraat Mühendisi desteği</span>
          </div>
        </div>
      </section>

      <section className="section container pricing-page">
        <PricingCards />
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Uzman havuzu ve danışmanlık"
            title="Sahaya İnmeden Profesyonel Çözüm"
            description="Yetkili veteriner hekim ve ziraat mühendislerimiz sorularınızı en profesyonel şekilde, zaman kaybetmeden ve saha masrafı olmadan yanıtlar."
          />
          <div className="hardware-grid">
            {expertServices.map(([Icon, title, price, text], index) => (
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
