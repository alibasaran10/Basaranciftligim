"use client";

import { CheckCircle2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openDemoModal, setBillingCycle } from "@/store/slices/uiSlice";

const plans = [
  {
    name: "Başlangıç",
    description: "Küçük işletmeler için temel dijital takip",
    monthly: 199,
    yearly: 149,
    features: [
      "30 hayvana kadar",
      "3 kullanıcı",
      "Tarla ve sürü kayıtları",
      "Temel raporlar",
      "E-posta destek",
    ],
  },
  {
    name: "Profesyonel",
    description: "Büyüyen çiftlikler için tam operasyon yönetimi",
    monthly: 349,
    yearly: 249,
    popular: true,
    features: [
      "100 hayvana kadar",
      "5 kullanıcı",
      "Gelişmiş analitik",
      "7/24 öncelikli destek",
    ],
  },
  {
    name: "Kurumsal",
    description: "Büyük ve çok lokasyonlu işletmeler için",
    monthly: 0,
    yearly: 0,
    features: [
      "Sınırsız hayvan ve tarla",
      "Sınırsız kullanıcı",
      "Çoklu işletme yönetimi",
      "API ve özel entegrasyon",
      "Kurumsal SLA",
      "Atanmış başarı yöneticisi",
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
                    <small>/ ay + KDV</small>
                  </>
                ) : (
                  <strong>Özel Teklif</strong>
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