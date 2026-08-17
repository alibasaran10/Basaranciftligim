"use client";

import {
  Beef,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Coins,
  HelpCircle,
  Search,
  Send,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

type FAQItem = {
  id: string;
  category: "suru" | "tarla" | "finans" | "kamera" | "genel";
  question: string;
  answer: string;
  tags: string[];
};

const FAQ_DATA: FAQItem[] = [
  {
    id: "suru-1",
    category: "suru",
    question: "Sürüye yeni hayvan nasıl eklenir ve küpe numarası nasıl tanımlanır?",
    answer:
      "Sürü Yönetimi sayfasında sağ üstte bulunan '+ Yeni Hayvan' butonuna tıklayarak açılan formda küpe numarası, ırk, doğum tarihi, cinsiyet ve bağlı bulunduğu ahır bölümünü seçerek saniyeler içinde yeni kayıt oluşturabilirsiniz.",
    tags: ["küpe", "hayvan ekleme", "ırk", "ahır"],
  },
  {
    id: "suru-2",
    category: "suru",
    question: "Gebe hayvanların beklenen doğum tarihleri nasıl takip edilir?",
    answer:
      "Hayvan detay kartındaki Biyolojik Takvim sekmesinden tohumlama tarihini girdiğinizde, sistem ortalama gebelik süresini otomatik hesaplayarak beklenen doğum tarihini Takvim ve Dashboard ekranına yaklaşıyor olarak ekler.",
    tags: ["gebelik", "tohumlama", "doğum", "biyolojik takvim"],
  },
  {
    id: "tarla-1",
    category: "tarla",
    question: "Tarla kaydı oluşturup ekim ve gübreleme işlemleri nasıl girilir?",
    answer:
      "Tarla Yönetimi alanından yeni arazi ekleyebilir; 'Ekim / Hasat' bölümünden tarlalarınıza uygulanan tohum türünü, gübreleme miktarını ve beklenen rekolte bilgilerini kaydeterek geçmiş sezona dair verileri raporlayabilirsiniz.",
    tags: ["tarla", "ekim", "gübreleme", "hasat"],
  },
  {
    id: "finans-1",
    category: "finans",
    question: "Yeni gelir veya gider kaydı eklediğimde raporlara nasıl yansır?",
    answer:
      "Finansal menüsünde yer alan 'Gelirler' veya 'Giderler' sayfalarındaki '+ Yeni Gelir Ekle' butonunu kullandığınızda, girdiğiniz tutar anında Aylık Gelir Trendi, Kategori Dağılımı ve Tahsilat Oranı grafiklerine yansır.",
    tags: ["gelir", "gider", "finans", "tahsilat", "fatura"],
  },
  {
    id: "kamera-1",
    category: "kamera",
    question: "Ahır içi kameralar ve akıllı tasmalar sisteme nasıl entegre edilir?",
    answer:
      "Kameralar sekmesinden IP kamera RTSP yayın adresini ekleyebilir; Akıllı Tasma bölümünden ESP32/BLE tabanlı sensörlerin MAC adreslerini tanımlayarak anlık geviş getirme, hareket ve sıcaklık verilerini izleyebilirsiniz.",
    tags: ["kamera", "ip kamera", "tasma", "esp32", "sensör"],
  },
  {
    id: "genel-1",
    category: "genel",
    question: "Çiftlik çalışanlarına ve veterinerlere özel kullanıcı rolü nasıl verilir?",
    answer:
      "Kullanıcılar sayfasından çiftliğinize yeni personel ekleyebilir; Yönetici, Veteriner veya Çiftlik İşçisi yetkileri atayarak hangi ekranlara erişebileceklerini belirleyebilirsiniz.",
    tags: ["kullanıcı", "personel", "yetki", "rol", "veteriner"],
  },
];

const CATEGORIES = [
  { key: "all", label: "Tüm Konular", icon: BookOpen },
  { key: "suru", label: "Sürü Yönetimi", icon: Beef },
  { key: "tarla", label: "Tarla & Ekim", icon: Sprout },
  { key: "finans", label: "Finans & Muhasebe", icon: Coins },
  { key: "kamera", label: "Kamera & Alarmlar", icon: Camera },
  { key: "genel", label: "Genel & Yetkiler", icon: ShieldCheck },
];

export function HelpView() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("suru-1");

  // Form State & Validation Errors
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    subject: "Sorun Bildirimi",
    message: "",
  });
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Isim alanına sadece harf ve bosluk kabul et (Rakamları engelle)
  const handleFullNameChange = (val: string) => {
    const cleanVal = val.replace(/[^a-zA-ZçğışöüÇĞİŞÖÜ\s]/g, "");
    setFormData((prev) => ({ ...prev, fullName: cleanVal }));
    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  // Telefon alanına sadece rakam, bosluk ve telefon karakterleri kabul et (Harfleri engelle)
  const handlePhoneChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9\s+()-]/g, "");
    setFormData((prev) => ({ ...prev, phone: cleanVal }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
      const qLower = search.toLocaleLowerCase("tr-TR");
      const matchesSearch =
        !search ||
        faq.question.toLocaleLowerCase("tr-TR").includes(qLower) ||
        faq.answer.toLocaleLowerCase("tr-TR").includes(qLower) ||
        faq.tags.some((t) => t.toLocaleLowerCase("tr-TR").includes(qLower));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const handleSubmitSupport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: { fullName?: string; phone?: string; message?: string } = {};

    // Isim Kontrolu
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Lütfen geçerli bir İsim Soyisim girin (rakam içeremez).";
    }

    // Telefon Kontrolu (En az 10 rakam olmali)
    const digitsOnly = formData.phone.replace(/[^0-9]/g, "");
    if (!formData.phone.trim() || digitsOnly.length < 10) {
      newErrors.phone = "Lütfen geçerli bir Telefon Numarası girin (en az 10 rakam).";
    }

    // Mesaj Kontrolu
    if (!formData.message.trim()) {
      newErrors.message = "Lütfen yaşadığınız sorunu veya talebinizi detaylandırın.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      dispatch(
        showToast("Form gönderilemedi: Lütfen İsim Soyisim ve Telefon Numarası alanlarını eksiksiz doldurun."),
      );
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      dispatch(
        showToast("Destek talebiniz başarıyla iletildi. Ekibimiz sizinle en kısa sürede iletişime geçecektir."),
      );
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        subject: "Sorun Bildirimi",
        message: "",
      });
      setErrors({});
    } catch {
      dispatch(showToast("Talep iletilirken bir hata oluştu."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow="Basaranciftligim / Destek & Rehber"
        title="Yardım Merkezi ve Kullanım Kılavuzu"
        description="Basaranciftligim platformu kullanımı hakkında sıkça sorulan sorular, modül rehberleri ve direkt teknik destek kanalları."
        icon={<CircleHelp />}
        showActions={false}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* SOL KOLON: SSS ve Kullanım Kılavuzu */}
        <Panel title="Sıkça Sorulan Sorular & Kullanım Kılavuzu">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            {/* Arama Barı */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                background: "var(--surface-2)",
                marginBottom: "12px",
              }}
            >
              <Search size={16} style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Yardım konusunda ara (örn: küpe, ekim, gelir, kamera)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  width: "100%",
                  fontSize: "13.5px",
                  color: "inherit",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer", fontSize: "12px" }}
                >
                  Temizle
                </button>
              )}
            </div>

            {/* Kategori Filtre Butonları */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: active ? "1px solid var(--green-600)" : "1px solid var(--line)",
                      background: active ? "rgba(22, 131, 70, 0.12)" : "var(--surface)",
                      color: active ? "var(--green-700)" : "var(--muted)",
                      fontWeight: active ? 650 : 500,
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SSS Akordeon Listesi */}
          <div style={{ padding: "8px 16px 16px" }}>
            {filteredFaqs.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                Aramanızla eşleşen bir kılavuz konusu bulunamadı. Lütfen farklı kelimelerle arayın veya sağdaki formdan destek talebi oluşturun.
              </div>
            ) : (
              filteredFaqs.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      padding: "12px 0",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                        background: "none",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                        color: isOpen ? "var(--green-700)" : "var(--text)",
                        fontWeight: 650,
                        fontSize: "13.5px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <HelpCircle size={16} style={{ color: isOpen ? "var(--green-600)" : "var(--muted)" }} />
                        {item.question}
                      </span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingLeft: "24px",
                          color: "var(--muted)",
                          fontSize: "13px",
                          lineHeight: 1.55,
                        }}
                      >
                        <p style={{ margin: 0 }}>{item.answer}</p>
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: "10.5px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: "var(--surface-2)",
                                border: "1px solid var(--line)",
                                color: "var(--muted)",
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        {/* SAĞ KOLON: Destek & Sorun Bildirim Formu */}
        <Panel id="support-form-card" title="Destek & Sorun Bildirim Formu">
          <div style={{ padding: "16px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.45 }}>
              Sistemle ilgili yaşadığınız sorunları, soru veya geliştirme taleplerinizi formu doldurarak teknik ekibimize doğrudan iletebilirsiniz.
            </p>

            <form onSubmit={handleSubmitSupport} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ali Başaran"
                  value={formData.fullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: errors.fullName ? "1px solid var(--red)" : "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                  }}
                />
                {errors.fullName && (
                  <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "3px", display: "block" }}>
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Telefon No *
                  </label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      borderRadius: "8px",
                      border: errors.phone ? "1px solid var(--red)" : "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontSize: "13px",
                    }}
                  />
                  {errors.phone && (
                    <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "3px", display: "block" }}>
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@ciftlik.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Destek Konusu / Kategori
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                  }}
                >
                  <option value="Sorun Bildirimi">Sorun Bildirimi / Hata</option>
                  <option value="Kullanım Sorusu">Kullanım Sorusu</option>
                  <option value="Teknik Destek">Cihaz & Kamera Bağlantı Desteği</option>
                  <option value="Öneri / İstek">Öneri & Yeni Özellik İsteği</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Sorun / Talep Detayı *
                </label>
                <textarea
                  rows={4}
                  placeholder="Yaşadığınız sorunu veya talebinizi detaylı olarak açıklayın..."
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: errors.message ? "1px solid var(--red)" : "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />
                {errors.message && (
                  <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "3px", display: "block" }}>
                    {errors.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="button button-primary"
                disabled={submitting}
                style={{ width: "100%", marginTop: "4px", justifyContent: "center" }}
              >
                <Send size={15} />
                {submitting ? "Gönderiliyor..." : "Destek Talebini Gönder"}
              </button>
            </form>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default HelpView;
