"use client";

import { CheckCircle2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openDemoModal, setBillingCycle } from "@/store/slices/uiSlice";

const plans = [
  {
    name: "Pro Plan",
    description: "Orta ölçekli çiftlikler ve üreticiler için uzman danışmanlık",
    monthly: 199,
    yearly: 1990,
    features: [
      "Her ay 3 Uzman Sohbet Hakkı",
      "Veteriner ve Ziraat Mühendisi soru havuzu",
      "Fotoğraflı ve detaylı vaka incelemesi",
      "Sahaya inmeden hızlı ön teşhis ve çözüm",
      "Tarla, mahsul ve sürü takip modülleri",
    ],
  },
  {
    name: "Plus Plan",
    description: "Hızlı yanıt ve kapsamlı reçete desteği arayan çiftlikler için",
    monthly: 299,
    yearly: 2990,
    popular: true,
    features: [
      "Her ay 5 Uzman Sohbet Hakkı",
      "Öncelikli uzman yanıtı (ortalama 2 saat)",
      "Reçete, ilaçlama ve besleme tavsiyeleri",
      "Veteriner & Ziraat Mühendisi ortak değerlendirmesi",
      "Gelişmiş arşiv, takip ve operasyon raporları",
    ],
  },
  {
    name: "Kurumsal",
    description: "Büyük işletmeler, entegre tesisler ve kooperatifler için",
    monthly: 0,
    yearly: 0,
    features: [
      "İşletmeye özel esnek / sınırsız sohbet kotası",
      "Atanmış özel Veteriner Hekim & Ziraat Mühendisi",
      "Çoklu lokasyon ve ekip yönetimi",
      "Telefonla doğrudan vaka istişaresi",
      "Öncelikli kurumsal SLA desteği",
    ],
  },
];

export function PricingCards() {
  const dispatch = useAppDispatch();
  const cycle = useAppSelector((state) => state.ui.billingCycle);

  return (
    <>
      <div className="billing-toggle" role="group" aria-label="Fatura dönemi">
        <button
          className={cycle === "monthly" ? "is-active" : ""}
          onClick={() => dispatch(setBillingCycle("monthly"))}
        >
          Aylık
        </button>
        <button
          className={cycle === "yearly" ? "is-active" : ""}
          onClick={() => dispatch(setBillingCycle("yearly"))}
        >
          Yıllık <span>2 ay ücretsiz</span>
        </button>
      </div>
      <div className="pricing-grid">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.monthly : plan.yearly;
          return (
            <article
              className={`pricing-card ${plan.popular ? "is-popular" : ""}`}
              key={plan.name}
            >
              {plan.popular && <span className="popular-badge">En Popüler</span>}
              <span className="eyebrow">{plan.name}</span>
              <p>{plan.description}</p>
              <div className="price">
                {price ? (
                  <>
                    <strong>{price.toLocaleString("tr-TR")} ₺</strong>
                    <small>{cycle === "monthly" ? "/ ay + KDV" : "/ yıl + KDV"}</small>
                  </>
                ) : (
                  <strong>Teklif Alın</strong>
                )}
              </div>
              <button
                className={`btn ${plan.popular ? "btn-primary" : "btn-secondary"} btn-block`}
                onClick={() => dispatch(openDemoModal())}
              >
                {price ? "Ücretsiz Deneyin" : "Teklif Alın"}
              </button>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 /> {feature}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </>
  );
}