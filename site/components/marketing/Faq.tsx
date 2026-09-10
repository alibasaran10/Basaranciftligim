"use client";

import { ChevronDown } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleFaq } from "@/store/slices/uiSlice";

const questions = [
  {
    question: "Mevcut kameralarımızı kullanabilir miyiz?",
    answer:
      "Evet. Standart RTSP desteği bulunan mevcut IP kameralarınızı sisteme kolayca entegre edebiliriz.",
  },
  {
    question: "Tasma verileri nasıl iletilir?",
    answer:
      "Akıllı tasmalar veriyi düşük enerji tüketimli BLE bağlantısıyla gateway cihazına, gateway ise güvenli biçimde buluta iletir.",
  },
  {
    question: "İnternet kesilirse ne olur?",
    answer:
      "Gateway verileri yerel bellekte saklar. Bağlantı yeniden kurulduğunda kayıtlar otomatik olarak senkronize edilir.",
  },
  {
    question: "Kaç hayvana kadar kullanılabilir?",
    answer:
      "Basaranciftligim modüler ve ölçeklenebilir yapıdadır; küçük aile işletmelerinden binlerce hayvanlı tesislere kadar büyüyebilir.",
  },
  {
    question: "Mobil uygulama hangi cihazlarda çalışır?",
    answer:
      "iOS ve Android telefon/tabletlerde çalışır. Ayrıca güncel bir tarayıcı üzerinden web paneline erişebilirsiniz.",
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
