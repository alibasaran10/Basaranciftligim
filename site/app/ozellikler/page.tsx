import type { Metadata } from "next";
import {
  BadgeCheck,
  Boxes,
  Camera,
  Cloud,
  Radio,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { FeaturePanel } from "@/components/marketing/FeaturePanel";
import { LogoRail } from "@/components/marketing/LogoRail";
import { ModuleGrid } from "@/components/marketing/ModuleGrid";
import { Testimonials } from "@/components/marketing/Testimonials";
import { DemoButton } from "@/components/shared/DemoButton";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Özellikler",
  description:
    "Tarla, sürü, stok, alarm, kamera ve bulut yönetimi için SÜRÜM özelliklerini keşfedin.",
};

const ecosystem = [
  [Radio, "Akıllı Tasma Donanımı", "Sağlık ve aktivite takibi"],
  [Boxes, "BLE / Gateway", "Kesintisiz yerel veri akışı"],
  [Camera, "RTSP Kameralar", "Mevcut altyapıyla entegrasyon"],
  [Smartphone, "Mobil Uygulama", "iOS ve Android uyumu"],
  [Cloud, "Web Panel ve Bulut", "Her yerden güvenli erişim"],
] as const;

export default function FeaturesPage() {
  return (
    <main>
      <section className="page-hero page-hero--farm">
        <div className="container page-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Tek platformda uçtan uca çiftlik yönetimi</span>
            <h1>
              Çiftliğiniz İçin Geliştirilmiş <span>Güçlü Özellikler</span>
            </h1>
            <p>
              Sürü yönetimi, tarla ve mahsul takibi, akıllı tasma, kamera,
              stok ve bulut güvenliği için ihtiyacınız olan her şey bir arada.
            </p>
            <div className="button-row">
              <DemoButton />
              <Link className="btn btn-secondary" href="#moduller">
                Özellikleri İncele →
              </Link>
            </div>
          </div>
          <div className="page-hero-image">
            <Image
              src="/images/features-devices.png"
              alt="SÜRÜM özellik ekranları"
              fill
              priority
              unoptimized
              sizes="(max-width: 900px) 90vw, 48vw"
            />
          </div>
        </div>
      </section>

      <section className="section container" id="moduller">
        <SectionHeading
          eyebrow="Temel kabiliyetler"
          title="Tüm Operasyonlarınız İçin Kapsamlı Modüller"
        />
        <ModuleGrid compact />
      </section>

      <section className="section section-soft">
        <div className="container feature-stack">
          <FeaturePanel
            number="01"
            title="Tarla ve Mahsul Yönetimi"
            image="/images/app-fields.png"
            items={[
              "Arazi kayıtları ve parsel yönetimi",
              "Toprak tipi ve sulama durumu takibi",
              "Ekim planı oluşturma ve izleme",
              "Hasat verisi kaydı ve analiz",
              "Silo ve stok modülü ile entegrasyon",
            ]}
          />
          <FeaturePanel
            number="02"
            title="Akıllı Sürü ve Biyolojik Takvim"
            image="/images/app-herd.png"
            reverse
            items={[
              "Hayvan kartları ve küpe numarası yönetimi",
              "Tohumlama, gebelik ve kuruya ayırma takibi",
              "Tahmini doğum tarihleri ve bildirimler",
              "Sağlık, aşı ve tedavi kayıtları",
              "Irk, yaş, laktasyon ve verim bilgileri",
            ]}
          />
          <FeaturePanel
            number="03"
            title="Anlık Alarm ve Görsel Doğrulama"
            image="/images/app-camera.png"
            items={[
              "Kızgınlık / stres tespiti ve anlık uyarılar",
              "Doğum yaklaşımı ve doğum sonrası takip",
              "RTSP kameradan canlı görüntü alma",
              "Bildirim kartları ile hızlı aksiyon",
              "Geçmiş alarm kayıtları ve analiz",
            ]}
          />
          <FeaturePanel
            number="04"
            title="Raporlama, Dashboard ve Analitik"
            image="/images/app-sync.png"
            reverse
            items={[
              "Stok durum raporları ve uyarıları",
              "Süt verimi ve performans analizleri",
              "Alarm geçmişi ve olay kayıtları",
              "Sürü dağılımı ve sağlık istatistikleri",
              "Yönetim özetleri ve dışa aktarım",
            ]}
          />
        </div>
      </section>

      <section className="section container" id="entegrasyonlar">
        <SectionHeading
          eyebrow="Mevcut altyapınızla uyumlu"
          title="Donanımınızı Değiştirmeden Dijitalleşin"
          description="SÜRÜM, sahadaki mevcut cihazlarınızla birlikte çalışacak şekilde tasarlandı."
        />
        <div className="ecosystem-grid">
          {ecosystem.map(([Icon, title, text], index) => (
            <Reveal delay={index * 60} key={title}>
              <article className="ecosystem-card">
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
                <BadgeCheck />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <Testimonials />
          <LogoRail />
        </div>
      </section>

      <div className="section">
        <CtaBanner />
      </div>
    </main>
  );
}
