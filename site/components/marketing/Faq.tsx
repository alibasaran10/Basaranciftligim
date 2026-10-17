"use client";

import { ChevronDown } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleFaq } from "@/store/slices/uiSlice";

const questions = [
  {
    question: "Ücretsiz sohbet hakkımı nasıl kullanabilirim?",
    answer:
      "Sisteme kayıt olduğunuz anda hesabınıza otomatik olarak 1 adet ücretsiz sohbet hakkı tanımlanır. Fotoğraf, video veya vaka açıklaması ekleyerek uzman veteriner hekim veya ziraat mühendisimizle anında sohbet başlatabilirsiniz.",
  },
  {
    question: "Pro ve Plus planlardaki sohbet hakları nasıl çalışır?",
    answer:
      "Pro planda her ay 3 sohbet hakkı, Plus planda ise her ay 5 sohbet hakkı sunulur. Sohbet haklarınızı ister sürü sağlığı ister tarla, gübreleme ve bitki koruma alanında dilediğiniz gibi kullanabilirsiniz.",
  },
  {
    question: "Uzmanlar soruları ne kadar sürede yanıtlar?",
    answer:
      "Tüm vakalar alanında yetkili uzman veteriner hekimler ve ziraat mühendisleri tarafından incelenir. Plus plan kullanıcılarımıza ortalama 2 saat içinde öncelikli yanıt verilirken, Pro plan sohbetleri en geç aynı gün içinde detaylı raporla cevaplanır.",
  },
  {
    question: "Soruma fotoğraf, video veya tahlil raporu ekleyebilir miyim?",
    answer:
      "Kesinlikle. Sohbetiniz sırasında vakanıza ait fotoğraf, video, toprak analizi veya laboratuvar test sonuçlarını doğrudan iletebilirsiniz. Uzmanlarımız sahaya inmeden sorunu kapsamlı şekilde değerlendirip size özel reçete ve eylem planı oluşturur.",
  },
  {
    question: "Ay içinde sohbet hakkım biterse veya daha fazla sohbete ihtiyacım olursa ne olur?",
    answer:
      "Planınızı istediğiniz an Plus plana yükseltebilir ya da büyük işletmeniz/kooperatifiniz için sınırsız sohbet kotası ve özel danışmanlık içeren Kurumsal planımıza geçiş yapabilirsiniz.",
  },
];

export function Faq() {
  const dispatch = useAppDispatch();
  const active = useAppSelector((state) => state.ui.activeFaq);

  return (
    <div className="faq-list">
      {questions.map((item, index) => {
        const open = active === index;
        return (
          <article className={`faq-item ${open ? "is-open" : ""}`} key={item.question}>
            <button
              onClick={() => dispatch(toggleFaq(index))}
              aria-expanded={open}
            >
              {item.question}
              <ChevronDown />
            </button>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
