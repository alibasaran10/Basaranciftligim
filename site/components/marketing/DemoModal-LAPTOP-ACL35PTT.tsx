"use client";

import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { FormEvent, useEffect, useState, ChangeEvent } from "react";

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

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/[0-9]/g, ""));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    const trimmed = digitsOnly.slice(0, 12);
    setPhone(trimmed);
    if (phoneError) setPhoneError("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length !== 11 && digits.length !== 12) {
      setPhoneError("Hatalı, kontrol ediniz");
      return;
    }
    setPhoneError("");
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
                  placeholder="Adınız ve soyadınız" 
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+90 xxx xxx xx xx"
                  maxLength={12}
                />
                {phoneError && (
                  <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={14} /> {phoneError}
                  </span>
                )}
              </label>
              <label>
                İşletme türü
                <select name="business" defaultValue="">
                  <option value="" disabled>
                    Seçiniz
                  </option>
                  <option>Büyükbaş hayvancılık</option>
                  <option>Küçükbaş hayvancılık</option>
                  <option>Kanatlı Hayvan Yetiştiriciliği</option>
                  <option>Bitkisel üretim</option>
                  <option>Entegre işletme</option>
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
