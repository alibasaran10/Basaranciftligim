"use client";

import { CheckCircle2, Send, AlertCircle } from "lucide-react";
import { FormEvent, useState, ChangeEvent } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Isim kismina rakam girilmesin: rakamlari otomatik temizle
    const cleanValue = e.target.value.replace(/[0-9]/g, "");
    setName(cleanValue);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Telefon kismina harf girilmesin: sadece rakamlar ve max 12 basamak
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    const trimmed = digitsOnly.slice(0, 12);
    setPhone(trimmed);
    if (phoneError) setPhoneError("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phone.replace(/[^0-9]/g, "");
    // Form gonderilirken kontrol et: 11 veya 12 haneli degilse hatayi goster
    if (digits.length !== 11 && digits.length !== 12) {
      setPhoneError("Hatalı, kontrol ediniz");
      return;
    }
    setPhoneError("");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-success">
        <CheckCircle2 />
        <h3>Mesajınız bize ulaştı</h3>
        <p>Uzman ekibimiz en kısa sürede aktif dönüş sağlayarak sizinle iletişime geçecektir.</p>
        <button className="btn btn-secondary" onClick={() => setSent(false)}>
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
            placeholder="Adınız ve soyadınız" 
          />
        </label>
        <label>
          Telefon
          <input 
            required 
            name="phone" 
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
          E-posta
          <input required name="email" type="email" placeholder="ornek@isletme.com" />
        </label>
        <label>
          İşletme Türü
          <select defaultValue="" name="business">
            <option value="" disabled>Seçiniz</option>
            <option>Büyükbaş hayvancılık</option>
            <option>Küçükbaş hayvancılık</option>
            <option>Kanatlı Hayvan Yetiştiriciliği</option>
            <option>Bitkisel üretim</option>
            <option>Entegre işletme</option>
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
