import {
  BarChart3,
  CheckCircle2,
  Cloud,
  Smartphone,
} from "lucide-react";
import Image from "next/image";

import { Reveal } from "../shared/Reveal";

const benefits = [
  "Gerçek zamanlı bildirimler ve uyarılar",
  "Kapsamlı raporlar ve grafikler",
  "Kolay kullanım, modern arayüz",
  "iOS, Android ve web uyumu",
];

export function AppShowcase() {
  return (
    <Reveal>
      <section className="app-showcase">
        <div className="app-screens">
          <div className="screen-card screen-card--one">
            <Image
              src="/images/app-home.png"
              alt="SÜRÜM ana ekranı"
              fill
              unoptimized
            />
          </div>
          <div className="screen-card screen-card--two">
            <Image
              src="/images/app-fields.png"
              alt="Tarla yönetimi ekranı"
              fill
              unoptimized
            />
          </div>
          <div className="screen-card screen-card--three">
            <Image
              src="/images/app-herd.png"
              alt="Sürü yönetimi ekranı"
              fill
              unoptimized
            />
          </div>
          <div className="dashboard-mock" aria-label="Web panel özeti">
            <div className="dashboard-top">
              <strong>Genel Bakış</strong>
              <span>Canlı</span>
            </div>
            <div className="dashboard-stats">
              <span>56<small>Hayvan</small></span>
              <span>32<small>Sağmal</small></span>
              <span>14<small>Kuru</small></span>
              <span>10<small>Buzağı</small></span>
            </div>
            <div className="dashboard-chart">
              <BarChart3 />
            </div>
          </div>
        </div>
        <div className="app-showcase-copy">
          <span className="eyebrow">Mobil, tablet ve web</span>
          <h2>Her Yerden Kontrol Sizde</h2>
          <p>
            Çiftliğinizi sahadan, ofisten veya seyahatteyken aynı güncel
            verilerle yönetin.
          </p>
          <ul className="check-list">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <CheckCircle2 /> {benefit}
              </li>
            ))}
          </ul>
          <div className="store-buttons">
            <span><Smartphone /> App Store</span>
            <span><Smartphone /> Google Play</span>
            <span><Cloud /> Web Panel</span>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
