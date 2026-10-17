import type { Metadata } from "next";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Leaf,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

import { AppShowcase } from "@/components/marketing/AppShowcase";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Faq } from "@/components/marketing/Faq";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";
import { DemoButton } from "@/components/shared/DemoButton";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Nasıl Çalışır?",
  description:
    "Uzman veteriner hekim ve ziraat mühendislerinin sorularınızı ve vakalarınızı sahaya inmeden nasıl çözüme dönüştürdüğünü görün.",
};

const realTimeExamples = [
  {
    icon: BellRing,
    color: "danger",
    title: "Sürü Sağlığı & Belirti Bildirimi",
    text: "Hayvanınızdaki semptomları ve fotoğrafları sisteme iletin, uzman veteriner hekime anında ulaşsın.",
  },
  {
    icon: Clock3,
    color: "warning",
    title: "Tohumlama ve Doğum Takvimi",
    text: "Biyolojik takvim ve uzman yönlendirmesiyle yaklaşan doğumları ve kritik dönemleri kaçırmayın.",
  },
  {
    icon: Leaf,
    color: "success",
    title: "Toprak ve Mahsul Danışmanlığı",
    text: "Ziraat mühendislerimiz tahlil raporunuzu inceleyip doğrudan uygulanabilir besleme ve gübreleme reçetesi sunar.",
  },
] as const;

const advantages = [
  [TrendingUp, "Daha Az Kayıp", "Erken uzman teşhisi ile üretim kayıplarını en aza indirin."],
  [Clock3, "Daha Hızlı Müdahale", "Sahaya inmeden ortalama 2 saat içinde çözüm alın."],
  [CheckCircle2, "Doğru ve Bilimsel Teşhis", "Yetkili uzmanların hazırladığı reçete ve uygulama protokolleri."],
  [ShieldCheck, "Güvenli Arşiv", "Tüm vaka ve reçete geçmişiniz bulutta güvenle saklanır."],
] as const;

export default function HowItWorksPage() {
  return (
    <main>
      <section className="page-hero page-hero--how">
        <div className="container page-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Sorudan çözüme uzman destekli sistem</span>
            <h1>
              Sorularınız ve Vakalarınız <span>Nasıl Çözüme Dönüşür?</span>
            </h1>
            <p>
              Sürü sağlığından tarla ve gübreleme planına kadar tüm sorularınız
              yetkili veteriner ve ziraat mühendislerimize ulaşır; sahaya
              inmeden güvenilir ve bilimsel çözümlere dönüşür.
            </p>
            <div className="button-row">
              <DemoButton label="Sistemi Canlı Görün" />
            </div>
            <div className="hero-proof">
              <span><CheckCircle2 /> Gerçek Zamanlı</span>
              <span><CheckCircle2 /> Güvenli</span>
              <span><CheckCircle2 /> Kolay Kullanım</span>
            </div>
          </div>
          <div className="page-hero-image page-hero-image--wide">
            <Image
              src="/images/how-devices.png"
              alt="Basaranciftligim çalışma sistemi"
              fill
              unoptimized
              priority
              sizes="(max-width: 900px) 90vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          eyebrow="Uçtan uca veri akışı"
          title="Sistemin 5 Adımda Çalışma Prensibi"
        />
        <ProcessSteps five />
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="İki veri kaynağı, tek platform"
            title="Tarla ve Sürü Verisi Aynı Kararda Birleşir"
          />
          <div className="data-flow">
            <article className="data-flow-group data-flow-group--green">
              <span>Tarla / Mahsul Süreci</span>
              <div>
                {["Tarla Kaydı", "Ekim", "Hasat", "Verim", "Stok"].map((item) => (
                  <strong key={item}>{item}</strong>
                ))}
              </div>
            </article>
            <div className="data-flow-center">
              <Image
                src="/images/onboarding_cow.png"
                alt=""
                fill
                unoptimized
              />
              <span>Tüm Veriler Tek Platformda Birleşir</span>
            </div>
            <article className="data-flow-group data-flow-group--blue">
              <span>Sürü / Biyolojik Takvim</span>
              <div>
                {["Hayvan", "Tohumlama", "Doğum", "Alarm", "Kamera"].map((item) => (
                  <strong key={item}>{item}</strong>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          eyebrow="Sahada anlık değer"
          title="Gerçek Zamanlı Operasyon Örnekleri"
        />
        <div className="operation-grid">
          {realTimeExamples.map(({ icon: Icon, color, title, text }, index) => (
            <Reveal delay={index * 80} key={title}>
              <article className={`operation-card operation-card--${color}`}>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <AppShowcase />
        </div>
      </section>

      <section className="section container">
        <SectionHeading eyebrow="Neden Basaranciftligim?" title="Somut Fayda, Ölçülebilir Sonuç" />
        <div className="advantages-grid">
          {advantages.map(([Icon, title, text], index) => (
            <Reveal delay={index * 60} key={title}>
              <article className="advantage-card">
                <Icon />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section-soft" id="sss">
        <div className="container faq-layout">
          <SectionHeading
            eyebrow="Merak ettikleriniz"
            title="Sık Sorulan Sorular"
            align="left"
          />
          <Faq />
        </div>
      </section>

      <div className="section">
        <CtaBanner />
      </div>
    </main>
  );
}
