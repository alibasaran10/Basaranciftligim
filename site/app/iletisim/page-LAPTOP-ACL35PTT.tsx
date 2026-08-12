import type { Metadata } from "next";
import {
  Clock3,
  Headphones,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { ContactForm } from "@/components/marketing/ContactForm";
import { Faq } from "@/components/marketing/Faq";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "SÜRÜM demo talebi, satış ve teknik destek için ekibimizle iletişime geçin.",
};

const contactCards = [
  [Phone, "Satış & Demo", "+90 850 255 00 55", "Hafta içi 09.00 – 18.00"],
  [Mail, "E-posta", "info@surum.com", "Bir iş günü içinde yanıt"],
  [Headphones, "Teknik Destek", "destek@surum.com", "7/24 kritik olay desteği"],
  [MapPin, "Merkez Ofis", "Konya / Türkiye", "Teknoloji Geliştirme Bölgesi"],
] as const;

export default function ContactPage() {
  return (
    <main>
      <section className="simple-hero simple-hero--contact">
        <div className="container">
          <span className="eyebrow">Sizin için buradayız</span>
          <h1>
            Çiftliğinizin Dijital Dönüşümünü{" "}
            <span>Birlikte Planlayalım</span>
          </h1>
          <p>
            İşletmenizi ve hedeflerinizi dinleyelim; size uygun modül, donanım
            ve kurulum planını uzmanlarımızla birlikte oluşturalım.
          </p>
        </div>
      </section>

      <section className="section container contact-layout">
        <Reveal className="contact-form-card">
          <span className="eyebrow">Bizimle İletişime Geçin</span>
          <h2>Ürünlerimizi ücretsiz denemek ve bizlerden bilgi almak için</h2>
          <p>
            Formu doldurun, çiftlik teknolojileri uzmanımız sizinle iletişime
            geçsin.
          </p>
          <ContactForm />
        </Reveal>
        <div className="contact-side">
          {contactCards.map(([Icon, title, value, detail], index) => (
            <Reveal delay={index * 70} key={title}>
              <article className="contact-card">
                <Icon />
                <div>
                  <span>{title}</span>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </div>
              </article>
            </Reveal>
          ))}
          <article className="contact-hours">
            <Clock3 />
            <div>
              <strong>Hızlı geri dönüş</strong>
              <p>Demo taleplerine ortalama 2 saat içinde dönüş yapıyoruz.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container faq-layout">
          <SectionHeading
            eyebrow="Yardım merkezi"
            title="Sık Sorulan Sorular"
            align="left"
          />
          <Faq />
        </div>
      </section>
    </main>
  );
}
