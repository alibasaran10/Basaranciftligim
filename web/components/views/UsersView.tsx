"use client";

import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Coins,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

type UserTitle =
  | "İşletme Sahibi"
  | "İşletme Yöneticisi"
  | "Veteriner Hekim"
  | "Ziraat Görevlisi"
  | "Operatör"
  | "Çalışan";

type AppUserItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "erkek" | "kadin";
  avatarUrl?: string;
  title: UserTitle;
  accessScope: string;
  allowedModules: string[];
  status: "aktif" | "bekliyor" | "pasif";
  createdAt: string;
};

const TITLE_CONFIG: Record<
  UserTitle,
  {
    accessScope: string;
    allowedModules: string[];
    tone: "purple" | "green" | "blue" | "orange" | "gray";
    icon: typeof ShieldCheck;
  }
> = {
  "İşletme Sahibi": {
    accessScope: "Tüm Sistem & Tam Yetki (Admin)",
    allowedModules: ["Dashboard", "Sürü", "Tarla", "Finans", "Stok", "Kameralar", "Alarmlar", "Raporlar", "Kullanıcılar", "Ayarlar"],
    tone: "purple",
    icon: ShieldCheck,
  },
  "İşletme Yöneticisi": {
    accessScope: "Operasyonel Yönetim & Tüm Modüller",
    allowedModules: ["Dashboard", "Sürü", "Tarla", "Finans", "Stok", "Kameralar", "Alarmlar", "Raporlar"],
    tone: "green",
    icon: Users,
  },
  "Veteriner Hekim": {
    accessScope: "Sürü Sağlığı, Biyolojik Takvim & Alarmlar",
    allowedModules: ["Sürü Yönetimi", "Sağlık Kayıtları", "Aşılama & Tedavi", "Biyolojik Takvim", "Alarmlar"],
    tone: "blue",
    icon: Stethoscope,
  },
  "Ziraat Görevlisi": {
    accessScope: "Tarla Yönetimi, Ekim/Hasat & Gübreleme",
    allowedModules: ["Tarla Yönetimi", "Ekim & Hasat", "Gübre & Tohum Stoğu", "Arazi Raporları"],
    tone: "orange",
    icon: Sprout,
  },
  "Operatör": {
    accessScope: "Cihazlar, Kameralar & Sensör Verileri",
    allowedModules: ["Kameralar", "Akıllı Tasmalar", "ESP32 Gateway", "Canlı İzleme", "Alarmlar"],
    tone: "blue",
    icon: Camera,
  },
  "Çalışan": {
    accessScope: "Temel Sürü & Görev Takibi (Görüntüleme)",
    allowedModules: ["Sürü Listesi", "Günlük Görevler", "Sadece Görüntüleme"],
    tone: "gray",
    icon: Wrench,
  },
};

const INITIAL_USERS: AppUserItem[] = [
  {
    id: "usr-1",
    name: "Ali Başaran",
    email: "ali@basaranciftligim.com",
    phone: "+90 532 111 22 33",
    gender: "erkek",
    avatarUrl: "/assets/profile_farmer.png",
    title: "İşletme Sahibi",
    accessScope: TITLE_CONFIG["İşletme Sahibi"].accessScope,
    allowedModules: TITLE_CONFIG["İşletme Sahibi"].allowedModules,
    status: "aktif",
    createdAt: "2026-01-10",
  },
  {
    id: "usr-2",
    name: "Mehmet Yılmaz",
    email: "mehmet@basaranciftligim.com",
    phone: "+90 533 222 33 44",
    gender: "erkek",
    avatarUrl: "/assets/profile_farmer.png",
    title: "İşletme Yöneticisi",
    accessScope: TITLE_CONFIG["İşletme Yöneticisi"].accessScope,
    allowedModules: TITLE_CONFIG["İşletme Yöneticisi"].allowedModules,
    status: "aktif",
    createdAt: "2026-02-01",
  },
  {
    id: "usr-3",
    name: "Dr. Ayşe Kaya",
    email: "ayse.kaya@vetmed.com",
    phone: "+90 535 333 44 55",
    gender: "kadin",
    avatarUrl: "/assets/profile_farmer_female.png",
    title: "Veteriner Hekim",
    accessScope: TITLE_CONFIG["Veteriner Hekim"].accessScope,
    allowedModules: TITLE_CONFIG["Veteriner Hekim"].allowedModules,
    status: "aktif",
    createdAt: "2026-02-15",
  },
  {
    id: "usr-4",
    name: "Ahmet Demir",
    email: "ahmet@basaranciftligim.com",
    phone: "+90 542 444 55 66",
    gender: "erkek",
    avatarUrl: "/assets/profile_farmer.png",
    title: "Ziraat Görevlisi",
    accessScope: TITLE_CONFIG["Ziraat Görevlisi"].accessScope,
    allowedModules: TITLE_CONFIG["Ziraat Görevlisi"].allowedModules,
    status: "aktif",
    createdAt: "2026-03-01",
  },
  {
    id: "usr-5",
    name: "Caner Öztürk",
    email: "caner@basaranciftligim.com",
    phone: "+90 555 555 66 77",
    gender: "erkek",
    avatarUrl: "/assets/profile_farmer.png",
    title: "Operatör",
    accessScope: TITLE_CONFIG["Operatör"].accessScope,
    allowedModules: TITLE_CONFIG["Operatör"].allowedModules,
    status: "aktif",
    createdAt: "2026-03-10",
  },
  {
    id: "usr-6",
    name: "Mustafa Şahin",
    email: "mustafa@basaranciftligim.com",
    phone: "+90 536 666 77 88",
    gender: "erkek",
    avatarUrl: "/assets/profile_farmer.png",
    title: "Çalışan",
    accessScope: TITLE_CONFIG["Çalışan"].accessScope,
    allowedModules: TITLE_CONFIG["Çalışan"].allowedModules,
    status: "bekliyor",
    createdAt: "2026-04-05",
  },
];

const TITLE_OPTIONS = [
  { value: "İşletme Sahibi", label: "İşletme Sahibi (Admin)" },
  { value: "İşletme Yöneticisi", label: "İşletme Yöneticisi" },
  { value: "Veteriner Hekim", label: "Veteriner Hekim" },
  { value: "Ziraat Görevlisi", label: "Ziraat Görevlisi" },
  { value: "Operatör", label: "Operatör" },
  { value: "Çalışan", label: "Çalışan" },
];

const STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif" },
  { value: "bekliyor", label: "Bekliyor / Davet Edildi" },
  { value: "pasif", label: "Pasif" },
];

export function UsersView() {
  const dispatch = useAppDispatch();
  const [users, setUsers] = useState<AppUserItem[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const addModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddModal && addModalRef.current) {
      addModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddModal]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "erkek" as "erkek" | "kadin",
    title: "İşletme Yöneticisi" as UserTitle,
    status: "aktif" as "aktif" | "bekliyor" | "pasif",
  });
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phone?: string; email?: string }>({});

  const handleNameChange = (val: string) => {
    const cleanVal = val.replace(/[^a-zA-ZçğışöüÇĞİŞÖÜ\s]/g, "");
    setFormData((prev) => ({ ...prev, fullName: cleanVal }));
    if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handlePhoneChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleanVal }));
    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")) ||
        u.email.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")) ||
        u.phone.includes(search);
      const matchTitle = !selectedTitle || u.title === selectedTitle;
      const matchStatus = !selectedStatus || u.status === selectedStatus;
      return matchSearch && matchTitle && matchStatus;
    });
  }, [users, search, selectedTitle, selectedStatus]);

  const totals = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "aktif").length,
      invited: users.filter((u) => u.status === "bekliyor").length,
      owners: users.filter((u) => u.title === "İşletme Sahibi").length,
    };
  }, [users]);

  const handleAddUserSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: { fullName?: string; phone?: string; email?: string } = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = "Lütfen geçerli bir İsim Soyisim girin (rakam içeremez).";
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      errors.phone = "Lütfen 10 haneli geçerli bir telefon numarası girin.";
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Lütfen geçerli bir e-posta adresi girin.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      dispatch(showToast("Lütfen form alanlarını eksiksiz ve doğru biçimde doldurun."));
      return;
    }

    const config = TITLE_CONFIG[formData.title];
    const avatar = formData.gender === "kadin" ? "/assets/profile_farmer_female.png" : "/assets/profile_farmer.png";

    const newUser: AppUserItem = {
      id: `usr-${Date.now()}`,
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: `+90 ${formData.phone}`,
      gender: formData.gender,
      avatarUrl: avatar,
      title: formData.title,
      accessScope: config.accessScope,
      allowedModules: config.allowedModules,
      status: formData.status,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      gender: "erkek",
      title: "İşletme Yöneticisi",
      status: "aktif",
    });
    setFormErrors({});
    dispatch(showToast(`Yeni kullanıcı ${newUser.name} (${newUser.title}) başarıyla eklendi.`));
  };

  const handleDeleteUser = (index: number) => {
    const userToDelete = filteredUsers[index];
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    dispatch(showToast(`${userToDelete.name} kullanıcı hesabı kaldırıldı.`));
  };

  const rows = filteredUsers.map((u) => {
    const config = TITLE_CONFIG[u.title];
    const statusLabel =
      u.status === "aktif" ? "Aktif" : u.status === "bekliyor" ? "Bekliyor" : "Pasif";

    const userAvatar =
      u.avatarUrl ||
      (u.gender === "kadin" ? "/assets/profile_farmer_female.png" : "/assets/profile_farmer.png");

    return [
      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="topbar-avatar-wrap" style={{ width: "34px", height: "34px" }}>
          <Image src={userAvatar} alt="" width={34} height={34} unoptimized />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <strong>{u.name}</strong>
          <small style={{ color: "var(--muted)", fontSize: "11.5px" }}>{u.phone}</small>
        </div>
      </div>,
      u.email,
      <Badge key={`title-${u.id}`} tone={config.tone}>
        {u.title}
      </Badge>,
      <div key={`scope-${u.id}`} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{u.accessScope}</span>
        <small style={{ color: "var(--muted)", fontSize: "11px" }}>
          Modüller: {u.allowedModules.slice(0, 3).join(", ")}
          {u.allowedModules.length > 3 ? "..." : ""}
        </small>
      </div>,
      statusLabel,
    ];
  });

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Kullanıcılar ve Erişim Yetkileri"
        description="Çiftlik çalışanlarını ünvanlarına göre ekleyin, rol ve modül erişim izinlerini yönetin."
        icon={<Users />}
        primaryLabel="Yeni Kullanıcı Ekle"
        showActions={true}
        onPrimaryClick={() => setShowAddModal(true)}
      />

      {/* İstatistik Kartları */}
      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<Users />}
          label="Toplam Kullanıcı"
          value={formatNumber(totals.total)}
          meta="İşletme personeli"
        />
        <StatCard
          icon={<UserCheck />}
          label="Aktif Kullanıcı"
          value={formatNumber(totals.active)}
          meta="Sisteme erişimi açık"
          tone="green"
        />
        <StatCard
          icon={<ShieldCheck />}
          label="İşletme Sahibi"
          value={formatNumber(totals.owners)}
          meta="Tam yetkili admin"
          tone="purple"
        />
        <StatCard
          icon={<UserPlus />}
          label="Bekleyen Davet"
          value={formatNumber(totals.invited)}
          meta="Aktivasyon bekliyor"
          tone="orange"
        />
      </div>

      {/* Kullanıcı Listesi Paneli */}
      <Panel
        title="Kullanıcı Listesi"
        action={
          <button
            className="button button-primary"
            onClick={() => setShowAddModal(true)}
            style={{ padding: "6px 12px", fontSize: "12.5px" }}
          >
            <Plus size={15} /> + Yeni Kullanıcı Ekle
          </button>
        }
      >
        <Filters
          placeholder="Ad, e-posta veya telefon ara..."
          search={search}
          onSearchChange={(value) => setSearch(value)}
          onSelectChange={(name, value) => {
            if (name === "title") setSelectedTitle(value);
            if (name === "status") setSelectedStatus(value);
          }}
          selects={[
            { name: "title", placeholder: "Tüm Ünvanlar", value: selectedTitle, options: TITLE_OPTIONS },
            { name: "status", placeholder: "Tüm Durumlar", value: selectedStatus, options: STATUS_OPTIONS },
          ]}
        />
        <DataTable
          headers={["Ad Soyad & Tel", "E-posta", "Ünvan", "Erişim Alanı", "Durum"]}
          rows={rows}
          onDelete={(index) => handleDeleteUser(index)}
        />
      </Panel>

      {/* ÜNVAN VE ERİŞİM ALANLARI MATRİSİ */}
      <Panel title="Ünvan Rolleri ve Modül Erişim Matrisi">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            padding: "14px",
          }}
        >
          {(Object.keys(TITLE_CONFIG) as UserTitle[]).map((titleKey) => {
            const cfg = TITLE_CONFIG[titleKey];
            const IconComp = cfg.icon;
            return (
              <div
                key={titleKey}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  background: "var(--surface-2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "8px" }}>
                  <IconComp size={20} style={{ color: "var(--green-600)" }} />
                  <strong style={{ fontSize: "14px", flex: 1 }}>{titleKey}</strong>
                  <Badge tone={cfg.tone}>{titleKey}</Badge>
                </div>
                <small style={{ color: "var(--muted)", fontSize: "11.5px", fontWeight: 600 }}>
                  Erişim Kapsamı: {cfg.accessScope}
                </small>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {cfg.allowedModules.map((mod) => (
                    <span
                      key={mod}
                      style={{
                        fontSize: "10.5px",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        color: "var(--text-soft)",
                      }}
                    >
                      ✓ {mod}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* MODAL: Yeni Kullanıcı Ekle */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            ref={addModalRef}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <UserPlus style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>İşletmeye Yeni Kullanıcı Ekle</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ayşe Kaya"
                  value={formData.fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: formErrors.fullName ? "1px solid var(--red)" : "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                  }}
                />
                {formErrors.fullName && (
                  <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "2px", display: "block" }}>
                    {formErrors.fullName}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Cinsiyet *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "erkek" | "kadin" })}
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <option value="erkek">Erkek (Bay)</option>
                    <option value="kadin">Kadın (Bayan)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Varsayılan Görsel
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
                    <div className="topbar-avatar-wrap" style={{ width: "32px", height: "32px" }}>
                      <Image
                        src={
                          formData.gender === "kadin"
                            ? "/assets/profile_farmer_female.png"
                            : "/assets/profile_farmer.png"
                        }
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                      />
                    </div>
                    <small style={{ color: "var(--muted)", fontSize: "11.5px" }}>
                      {formData.gender === "kadin" ? "Kadın Çiftçi Görseli" : "Erkek Çiftçi Görseli"}
                    </small>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Telefon No (10 Hane) *
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        padding: "9px 10px",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        background: "var(--surface-2)",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      +90
                    </span>
                    <input
                      type="tel"
                      placeholder="5XX XXX XX XX"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                      style={{
                        width: "100%",
                        padding: "9px 11px",
                        borderRadius: "8px",
                        border: formErrors.phone ? "1px solid var(--red)" : "1px solid var(--line)",
                        background: "var(--surface-2)",
                        color: "inherit",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  {formErrors.phone && (
                    <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "2px", display: "block" }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@basaranciftligim.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      borderRadius: "8px",
                      border: formErrors.email ? "1px solid var(--red)" : "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontSize: "13px",
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ color: "var(--red)", fontSize: "11px", marginTop: "2px", display: "block" }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Kullanıcı Ünvanı / İşletme Rolü *
                </label>
                <select
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value as UserTitle })}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {TITLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dinamik Ünvan İzin Göstergesi */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(22, 131, 70, 0.08)",
                  border: "1px solid rgba(22, 131, 70, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <small style={{ color: "var(--green-700)", fontWeight: 700, fontSize: "11.5px" }}>
                  Seçilen Ünvan Erişim Kapsamı:
                </small>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>
                  {TITLE_CONFIG[formData.title].accessScope}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  <UserPlus size={15} /> Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersView;
