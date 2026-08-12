"use client";

import { CheckCircle2, Send } from "lucide-react";
import { FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

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
    setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-success">
        <CheckCircle2 />
        <h3>Mesajınız bize ulaştı</h3>
        <p>Uzman ekibimiz bir iş günü içinde sizinle iletişime geçecek.</p>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setSent(false);
            setName("");
            setPhone("");
            setPhoneError("");
          }}
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Ad Soyad
          <input
            required
            name="name"
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
              required
              name="phone"
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
          E-posta (İsteğe bağlı)
          <input name="email" type="email" placeholder="ornek@isletme.com" />
        </label>
        <label>
          İşletme Türü
          <select defaultValue="" name="business">
            <option value="" disabled>Seçiniz</option>
            <option>Büyükbaş Hayvancılık</option>
            <option>Küçükbaş Hayvancılık</option>
            <option>Kanatlı Hayvancılık</option>
            <option>Bitkisel Üretim</option>
            <option>Entegre İşletme</option>
            <option>Diğer</option>
          </select>
        </label>
      </div>
      <label>
        Mesajınız
        <textarea
          required
          name="message"
          rows={5}
          placeholder="İşletmeniz ve ihtiyaçlarınız hakkında kısaca bilgi verin."
        />
      </label>
      <button className="btn btn-primary" type="submit">
        Mesajı Gönder <Send size={17} />
      </button>
    </form>
  );
}
