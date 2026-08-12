import type { Metadata } from "next";
import { BadgeCheck, Database, Quote, UsersRound } from "lucide-react";
import Image from "next/image";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { LogoRail } from "@/components/marketing/LogoRail";
import { Testimonials } from "@/components/marketing/Testimonials";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Referanslar",
  description:
    "SÜRÜM ile verimini artıran çiftçilerin ve büyüyen işletmelerin başarı hikâyeleri.",
};

const referenceStats = [
  [UsersRound, 250, "+", "Mutlu Çiftçi"],
  [BadgeCheck, 25000, "+", "Takip Edilen Hayvan"],
  [Database, 500000, "+", "Toplanan Veri (GB)"],
  [BadgeCheck, 98, "%", "Müşteri Memnuniyeti"],
] as const;

export default function ReferencesPage() {
  return (
    <main>
      <section className="references-hero">
        <div className="container references-hero-grid">
          <div className="references-copy">
            <span className="eyebrow eyebrow--light">Referanslarımız</span>
            <h1>
              Güvenen Çiftçiler, <span>Büyüyen İşletmeler</span>
            </h1>
            <p>
              Sistemimizi kullanan çiftçilerin deneyimleri, başarımızın en büyük
              kanıtıdır. Onların memnuniyeti, bizi her gün daha iyisini yapmaya
              motive ediyor.
            </p>
          </div>
          <div className="reference-quote">
            <Quote />
            <p>
              Teknolojiyle tanıştıktan sonra çiftliğimdeki her şey değişti.
              Artık verilerle yönetiyor, daha az maliyetle daha fazla verim elde
              ediyorum.
            </p>
            <strong>Ahmet Yılmaz</strong>
            <small>Büyükbaş Üreticisi / Konya</small>
          </div>
          <div className="reference-farmer">
            <Image
              src="/images/farmer-hero.png"
              alt="SÜRÜM kullanıcısı çiftçi"
              fill
              unoptimized
            />
          </div>
        </div>
      </section>

      <div className="container reference-stats">
        {referenceStats.map(([Icon, value, suffix, label]) => (
          <div key={label}>
            <Icon />
            <span>
              <strong><AnimatedCounter value={value} suffix={suffix} /></strong>
              <small>{label}</small>
            </span>
          </div>
        ))}
      </div>

      <section className="section container">
        <SectionHeading
          eyebrow="Başarı hikâyeleri"
          title="Çiftçilerimiz Ne Diyor?"
          description="Farklı ölçekteki işletmelerin gerçek deneyimleri."
        />
        <Reveal>
          <Testimonials title={false} />
        </Reveal>
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Güçlü iş birlikleri"
            title="Bizi Tercih Eden Kurumlar"
          />
          <LogoRail />
        </div>
      </section>

      <div className="section">
        <CtaBanner />
      </div>
    </main>
  );
}
