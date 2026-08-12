"use client";

import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  nextReference,
  previousReference,
  setActiveReference,
  setPaused,
} from "@/store/slices/referencesSlice";

export const testimonials = [
  {
    name: "Mehmet Karaca",
    business: "150 Baş Holstein Süt Çiftliği",
    city: "Samsun",
    type: "Büyükbaş İşletmesi",
    image: "/images/farmer-1.png",
    quote:
      "Doğum alarmı sayesinde birçok olası kaybın önüne geçtik. Geceleri rahat uyuyabiliyoruz çünkü sistem bizim için nöbette.",
    metrics: ["%35 Verim Artışı", "%28 Maliyet Azalması"],
  },
  {
    name: "Hasan Demir",
    business: "2.500 Dönüm Arazi",
    city: "Adana",
    type: "Bitkisel Üretim",
    image: "/images/farmer-2.png",
    quote:
      "Tarlalarımı ve mahsul stokumu tek ekrandan yönetiyorum. Hangi tarlada ne var, ne kadar ürünüm kaldı; her şey net.",
    metrics: ["%40 Zaman Tasarrufu", "%25 Verim Artışı"],
  },
  {
    name: "Ali Yıldız",
    business: "300 Baş Entegre İşletme",
    city: "Balıkesir",
    type: "Entegre İşletme",
    image: "/images/farmer-3.png",
    quote:
      "Süt verimi, kızgınlık takibi, yem tüketimi… Hepsi bir arada. Artık kararlarımı verilere göre veriyorum.",
    metrics: ["%30 Süt Verimi Artışı", "%20 İş Gücü Tasarrufu"],
  },
  {
    name: "İbrahim Kaya",
    business: "80 Baş Küçükbaş İşletme",
    city: "Nevşehir",
    type: "Küçükbaş İşletmesi",
    image: "/images/farmer-4.png",
    quote:
      "Küçük bir işletmeyiz ama bu sistemle büyük işletmeler gibi profesyonel yönetim yapıyoruz. Her kuruşun karşılığını aldık.",
    metrics: ["%45 Kayıp Azalması", "%30 Karlılık Artışı"],
  },
];

export function Testimonials({ title = true }: { title?: boolean }) {
  const dispatch = useAppDispatch();
  const active = useAppSelector((state) => state.references.activeIndex);
  const paused = useAppSelector((state) => state.references.paused);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => dispatch(nextReference(testimonials.length)),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [dispatch, paused]);

  useEffect(() => {
    const viewport = windowRef.current;
    const track = viewport?.querySelector<HTMLElement>(".testimonial-track");
    const card = viewport?.querySelector<HTMLElement>(".testimonial-card");
    if (!viewport || !track || !card) return;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 20;
    viewport.scrollTo({
      left: active * (card.offsetWidth + gap),
      behavior: "smooth",
    });
  }, [active]);

  return (
    <section
      className="testimonials"
      onMouseEnter={() => dispatch(setPaused(true))}
      onMouseLeave={() => dispatch(setPaused(false))}
    >
      {title && (
        <div className="section-heading">
          <span className="eyebrow">Gerçek kullanıcı deneyimleri</span>
          <h2>Çiftçilerimiz Ne Diyor?</h2>
        </div>
      )}
      <div className="testimonial-window" ref={windowRef}>
        <div className="testimonial-track">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="testimonial-photo">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes="320px"
                />
                <span>{item.type}</span>
              </div>
              <div className="testimonial-body">
                <Quote className="quote-icon" />
                <p>{item.quote}</p>
                <strong>{item.name}</strong>
                <small>
                  {item.business} · {item.city}
                </small>
                <div className="testimonial-metrics">
                  {item.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <button
        className="slider-button slider-button--prev"
        onClick={() => dispatch(previousReference(testimonials.length))}
        aria-label="Önceki çiftçi yorumu"
      >
        <ArrowLeft />
      </button>
      <button
        className="slider-button slider-button--next"
        onClick={() => dispatch(nextReference(testimonials.length))}
        aria-label="Sonraki çiftçi yorumu"
      >
        <ArrowRight />
      </button>
      <div className="slider-dots">
        {testimonials.map((item, index) => (
          <button
            aria-label={`${item.name} yorumunu göster`}
            className={active === index ? "is-active" : ""}
            onClick={() => dispatch(setActiveReference(index))}
            key={item.name}
          />
        ))}
      </div>
    </section>
  );
}
