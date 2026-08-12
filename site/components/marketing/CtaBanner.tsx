"use client";

import { ArrowRight, Headphones } from "lucide-react";
import Link from "next/link";

import { useAppDispatch } from "@/store/hooks";
import { openDemoModal } from "@/store/slices/uiSlice";

export function CtaBanner() {
  const dispatch = useAppDispatch();
  return (
    <section className="container cta-banner">
      <div className="cta-farmer" aria-hidden="true" />
      <div className="cta-copy">
        <span className="eyebrow eyebrow--light">Birlikte büyüyelim</span>
        <h2>Çiftliğinizin Geleceğini Bugünden Yönetin</h2>
        <p>
          Verimliliğinizi artırın, kayıplarınızı azaltın ve sürdürülebilir bir
          geleceğe adım atın.
        </p>
        <div className="button-row">
          <button
            className="btn btn-light"
            onClick={() => dispatch(openDemoModal())}
          >
            Demo Talep Et <ArrowRight size={17} />
          </button>
          <Link className="btn btn-outline-light" href="/iletisim">
            Bize Ulaşın
          </Link>
        </div>
      </div>
      <div className="cta-support">
        <Headphones />
        <span>
          <strong>7/24</strong>
          Teknik Destek
        </span>
      </div>
    </section>
  );
}
