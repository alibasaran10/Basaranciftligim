import type { Metadata } from "next";
import { CheckCircle2, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShowcase } from "@/components/marketing/AppShowcase";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { LogoRail } from "@/components/marketing/LogoRail";
import { ModuleGrid } from "@/components/marketing/ModuleGrid";
import { PricingCards } from "@/components/marketing/PricingCards";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";
import { StatsBar } from "@/components/marketing/StatsBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { DemoButton } from "@/components/shared/DemoButton";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  description:
    "Sürünüzü, tarlalarınızı ve verilerinizi akıllı tasma, kamera ve bulut teknolojileriyle tek platformdan yönetin.",
};

export default function HomePage() {
  return (
    <main>
      <section className="hero home-hero">
        <div className="hero-grid-pattern" />
        <div className="container hero-grid">
          <div className="hero-copy hero-copy--animated">
            <span className="eyebrow">Basaranciftligim Yenilikçi Çiftlik Yönetim Sistemi</span>
            <h1>
              Sürünüzü, Tarlalarınızı ve Verilerinizi{" "}
              <span>Tek Platformda Yönetin</span>
            </h1>
            <p>
              IoT akıllı tasma, mobil uygulama, RTSP kamera entegrasyonu ve
              tarla/mahsul yönetimi ile çiftliğinizin tüm süreçlerini
              dijitalleştirin.
            </p>
            <div className="button-row">
              <DemoButton />
              <Link className="btn btn-secondary" href="/nasil-calisir">
                <PlayCircle size={18} /> Tanıtım Videosunu İzle
              </Link>
            </div>
            <div className="hero-proof">
              <span><CheckCircle2 /> Kolay Kurulum</span>
              <span><CheckCircle2 /> 7/24 Destek</span>
              <span><CheckCircle2 /> Güvenli Bulut</span>
            </div>
          </div>
          <div className="hero-visual hero-visual--animated">
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <Image
              src="/images/hero-devices.png"
              alt="Basaranciftligim mobil ve web uygulamaları"
              fill
              priority
              unoptimized
              sizes="(max-width: 900px) 90vw, 48vw"
            />
          </div>
        </div>
      </section>

      <StatsBar />

      <section className="section container">
        <SectionHeading
          eyebrow="Tüm ihtiyaçlarınız tek platformda"
          title="Kapsamlı Modüller ile Akıllı Yönetim"
          description="Sahadaki günlük işlerinizi sadeleştiren, kararlarınızı veriye dönüştüren güçlü araçlar."
        />
        <ModuleGrid />
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Nasıl çalışır?"
            title="Veriniz, Değerli Bilgiye Dönüşür"
            description="Sensörden karara kadar kesintisiz ve güvenli veri akışı."
          />
          <ProcessSteps />
        </div>
      </section>

      <section className="section container">
        <AppShowcase />
      </section>

      <section className="section section-soft pricing-preview">
        <div className="container">
          <SectionHeading
            eyebrow="Şeffaf ve ölçeklenebilir"
            title="İşletmenize Uygun Planı Seçin"
            description="Küçük başlayın, işletmeniz büyüdükçe aynı sistemle ölçeklenin."
          />
          <PricingCards />
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          eyebrow="Bizi tercih edenler"
          title="Türkiye'nin Dört Bir Yanında Güven"
        />
        <LogoRail />
      </section>

      <section className="section section-soft">
        <div className="container">
          <Reveal>
            <Testimonials />
          </Reveal>
        </div>
      </section>

      <div className="section">
        <CtaBanner />
      </div>
    </main>
  );
}
