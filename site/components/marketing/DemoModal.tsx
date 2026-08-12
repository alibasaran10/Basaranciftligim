"use client";

import { CheckCircle2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeDemoModal } from "@/store/slices/uiSlice";

export function DemoModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.demoModalOpen);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece harf ve boşluk karakterlerine izin ver (rakamlar engellenir), max 50 karakter
    const value = e.target.value.replace(/[0-9]/g, "").slice(0, 50);
    setName(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamlara izin ver (harfler engellenir), tam 10 hane
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(value);
    if (value.length > 0 && value.length < 10) {
      setPhoneError("Telefon numarası 10 haneli olmalıdır.");
    } else {
      setPhoneError("");
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phone.length !== 10) {
      setPhoneError("Telefon numarası 10 haneli olmalıdır.");
      return;
    }
    setSubmitted(true);
  };

  const close = () => {
    setSubmitted(false);
    setName("");
    setPhone("");
    setPhoneError("");
    dispatch(closeDemoModal());
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="demo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
      >
        <button
          className="modal-close"
          onClick={close}
          aria-label="Pencereyi kapat"
        >
          <X />
        </button>
        {submitted ? (
          <div className="form-success">
            <CheckCircle2 size={52} />
            <h2 id="demo-title">Talebiniz Alındı</h2>
            <p>
              Çiftliğinize özel demo planı için uzmanlarımız kısa sürede sizinle
              iletişime geçecek.
            </p>
            <button
              className="btn btn-primary"
              onClick={close}
            >
              Tamam
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Ücretsiz demo</span>
            <h2 id="demo-title">Çiftliğinizi Birlikte Dijitalleştirelim</h2>
            <p>
              İşletme yapınızı dinleyelim, size uygun modülleri ve kurulum
              planını birlikte oluşturalım.
            </p>
            <form onSubmit={submit} className="demo-form">
              <label>
                Ad Soyad
                <input
                  name="name"
                  required
                  value={name}
                  onChange={handleNameChange}
                  maxLength={50}
                  placeholder="Adınız ve soyadınız"
                />
              </label>
              <label>
                Telefon
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">+90</span>
                  <input
                    name="phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    placeholder="5XX XXX XX XX"
                  />
                </div>
                {phoneError && (
                  <small style={{ color: "#ef4444", marginTop: "4px", display: "block" }}>
                    {phoneError}
                  </small>
                )}
              </label>
              <label>
                İşletme türü
                <select name="business" defaultValue="">
                  <option value="" disabled>
                    Seçiniz
                  </option>
                  <option>Büyükbaş Hayvancılık</option>
                  <option>Küçükbaş Hayvancılık</option>
                  <option>Kanatlı Hayvancılık</option>
                  <option>Bitkisel Üretim</option>
                  <option>Entegre İşletme</option>
                  <option>Diğer</option>
                </select>
              </label>
              <button className="btn btn-primary btn-block" type="submit">
                Demo Talebini Gönder
              </button>
              <small>
                Bilgileriniz yalnızca demo planlaması için kullanılacaktır.
              </small>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
