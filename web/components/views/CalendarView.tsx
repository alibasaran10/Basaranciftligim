"use client";

import {
  AlarmClock,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplets,
  Filter,
  Pencil,
  Plus,
  Search,
  Sprout,
  Stethoscope,
  StickyNote,
  Trash2,
  UserCheck,
  UsersRound,
  Wheat,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { CalendarBoard } from "@/components/calendar/CalendarBoard";
import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatNumber, formatRelative } from "@/lib/format";
import type { CalendarMonth, CalendarSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

type CalendarTab = "gunum" | "notlar" | "yakindakiler";

type CalendarNoteItem = {
  id: string;
  date: string;
  title: string;
  content: string;
  category: "Sürü & Sağlık" | "Tarla & Ekim" | "Ekipman & Bakım" | "Genel";
  priority: "yüksek" | "normal" | "düşük";
  author: string;
  createdAt: string;
};

type UpcomingEventItem = {
  id: string;
  type: "doğum" | "sulama" | "veteriner" | "hasat" | "aşı";
  title: string;
  entityName: string;
  targetLink: string;
  date: string;
  daysLeft: number;
  assignedPerson: string;
  status: "planlandı" | "hazırlıkta" | "kritik";
};

const INITIAL_NOTES: CalendarNoteItem[] = [
  {
    id: "note-1",
    date: "2026-08-17",
    title: "Büyükbaş Sürü Şap Aşısı Takibi",
    content: "Tüm Holstein ırkı gebe ineklerin ikinci doz şap ve koruyucu aşı tazelemesi tamamlanacak.",
    category: "Sürü & Sağlık",
    priority: "yüksek",
    author: "Dr. Ayşe Kaya",
    createdAt: "2026-08-15",
  },
  {
    id: "note-2",
    date: "2026-08-18",
    title: "Kuzey Tarlası Azot Gübrelemesi",
    content: "40 dönümlük mısır tarlasına damla sulama kanalıyla azotlu sıvı gübre takviyesi yapılacak.",
    category: "Tarla & Ekim",
    priority: "normal",
    author: "Ahmet Demir",
    createdAt: "2026-08-16",
  },
  {
    id: "note-3",
    date: "2026-08-19",
    title: "John Deere Traktör 250 Saat Bakımı",
    content: "Traktör motor yağı, hidrolik filtreleri ve ön takım gresleme işlemleri serviste yapılacak.",
    category: "Ekipman & Bakım",
    priority: "normal",
    author: "Caner Öztürk",
    createdAt: "2026-08-14",
  },
  {
    id: "note-4",
    date: "2026-08-21",
    title: "Süt Soğutma Tankı CIP Hijyen Yıkaması",
    content: "Bölüm B 5.000 litrelik paslanmaz süt soğutma tankının asidik deterjanla dezenfeksiyonu.",
    category: "Genel",
    priority: "düşük",
    author: "Mehmet Yılmaz",
    createdAt: "2026-08-16",
  },
];

const INITIAL_UPCOMING: UpcomingEventItem[] = [
  {
    id: "up-1",
    type: "doğum",
    title: "Simmental TR-3401 Gebe Doğumu",
    entityName: "Kulak No: TR-3401 (Ahır 1)",
    targetLink: "/suru",
    date: "2026-08-19",
    daysLeft: 2,
    assignedPerson: "Dr. Ayşe Kaya",
    status: "kritik",
  },
  {
    id: "up-2",
    type: "sulama",
    title: "Kuzey Tarlası (Mısır) 3. Gece Sulaması",
    entityName: "Kuzey Tarlası (40 Dönüm)",
    targetLink: "/tarlalar",
    date: "2026-08-18",
    daysLeft: 1,
    assignedPerson: "Ahmet Demir",
    status: "planlandı",
  },
  {
    id: "up-3",
    type: "veteriner",
    title: "Rutin Sürü Mastitis Taraması",
    entityName: "Bölüm B Sağmal Sürü (28 Baş)",
    targetLink: "/suru",
    date: "2026-08-20",
    daysLeft: 3,
    assignedPerson: "Dr. Ayşe Kaya",
    status: "hazırlıkta",
  },
  {
    id: "up-4",
    type: "hasat",
    title: "Güney Tarlası Yonca 2. Biçim Hasadı",
    entityName: "Güney Tarlası (25 Dönüm)",
    targetLink: "/tarlalar",
    date: "2026-08-23",
    daysLeft: 6,
    assignedPerson: "Ahmet Demir",
    status: "planlandı",
  },
  {
    id: "up-5",
    type: "aşı",
    title: "Yenidoğan Buzağılar Karma Aşı Programı",
    entityName: "Buzağı Paddock 3",
    targetLink: "/suru",
    date: "2026-08-25",
    daysLeft: 8,
    assignedPerson: "Dr. Ayşe Kaya",
    status: "planlandı",
  },
];

export function CalendarView() {
  const dispatch = useAppDispatch();
  const today = new Date();

  // Sub-tabs State: "gunum" | "notlar" | "yakindakiler"
  const [activeTab, setActiveTab] = useState<CalendarTab>("gunum");

  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const { data: month, loading: monthLoading } = useApi<CalendarMonth>(
    withQuery("/events", { year: cursor.year, month: cursor.month }),
    [cursor.year, cursor.month],
  );

  const { data: summary, loading, error, refetch } = useApi<CalendarSummary>("/events/summary");

  const totals = summary?.totals;

  // Notlar State
  const [notes, setNotes] = useState<CalendarNoteItem[]>(INITIAL_NOTES);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteCategoryFilter, setNoteCategoryFilter] = useState("");
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteToDeleteConfirm, setNoteToDeleteConfirm] = useState<CalendarNoteItem | null>(null);

  // Yakındakiler State
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventItem[]>(INITIAL_UPCOMING);
  const [upcomingTypeFilter, setUpcomingTypeFilter] = useState<string>("all");

  // Modal Refs for Smooth Scroll
  const addNoteModalRef = useRef<HTMLDivElement>(null);
  const deleteNoteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddNoteModal && addNoteModalRef.current) {
      addNoteModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddNoteModal]);

  useEffect(() => {
    if (noteToDeleteConfirm && deleteNoteModalRef.current) {
      deleteNoteModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [noteToDeleteConfirm]);

  // Form State (Yeni Not)
  const [newNoteForm, setNewNoteForm] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    category: "Sürü & Sağlık" as CalendarNoteItem["category"],
    priority: "normal" as CalendarNoteItem["priority"],
    author: "Ali Başaran",
  });

  /** Ay ileri/geri; yıl sınırında doğru sarmalar. */
  const navigate = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  };

  // Not Ekle Submit
  const handleAddNoteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNoteForm.title.trim() || !newNoteForm.content.trim()) {
      dispatch(showToast("Lütfen not başlığı ve içeriğini eksiksiz doldurun."));
      return;
    }

    const createdNote: CalendarNoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteForm.title.trim(),
      content: newNoteForm.content.trim(),
      date: newNoteForm.date,
      category: newNoteForm.category,
      priority: newNoteForm.priority,
      author: newNoteForm.author,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setNotes((prev) => [createdNote, ...prev]);
    setShowAddNoteModal(false);
    setNewNoteForm({
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
      category: "Sürü & Sağlık",
      priority: "normal",
      author: "Ali Başaran",
    });
    dispatch(showToast(`"${createdNote.title}" takvim notu eklendi.`));
  };

  // Not Sil Onay
  const confirmDeleteNote = () => {
    if (!noteToDeleteConfirm) return;
    const title = noteToDeleteConfirm.title;
    setNotes((prev) => prev.filter((n) => n.id !== noteToDeleteConfirm.id));
    setNoteToDeleteConfirm(null);
    dispatch(showToast(`"${title}" takvim notu silindi.`));
  };

  // Filtrelenmiş Notlar
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !noteSearch ||
        n.title.toLocaleLowerCase("tr-TR").includes(noteSearch.toLocaleLowerCase("tr-TR")) ||
        n.content.toLocaleLowerCase("tr-TR").includes(noteSearch.toLocaleLowerCase("tr-TR"));
      const matchCat = !noteCategoryFilter || n.category === noteCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [notes, noteSearch, noteCategoryFilter]);

  // Filtrelenmiş Yakındakiler
  const filteredUpcoming = useMemo(() => {
    if (upcomingTypeFilter === "all") return upcomingEvents;
    return upcomingEvents.filter((u) => u.type === upcomingTypeFilter);
  }, [upcomingEvents, upcomingTypeFilter]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Takvim ve Operasyon Planlayıcı"
        description="Çiftliğinizdeki günlük faaliyetleri, takvim notlarını ve yaklaşan kritik etkinlikleri yönetin."
        icon={<CalendarDays />}
        primaryLabel="Yeni Etkinlik"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* ALT BAR / SUB-TABS NAVİGASYONU (GÜNÜM - NOTLAR - YAKINDAKİLER) */}
      <div
        className="tabs"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--line)",
          marginBottom: "16px",
          paddingBottom: "2px",
        }}
      >
        <button
          type="button"
          className={activeTab === "gunum" ? "is-active" : ""}
          onClick={() => setActiveTab("gunum")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: activeTab === "gunum" ? 750 : 600,
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <CalendarDays size={16} />
          GÜNÜM
        </button>

        <button
          type="button"
          className={activeTab === "notlar" ? "is-active" : ""}
          onClick={() => setActiveTab("notlar")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: activeTab === "notlar" ? 750 : 600,
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <StickyNote size={16} />
          NOTLAR ({notes.length})
        </button>

        <button
          type="button"
          className={activeTab === "yakindakiler" ? "is-active" : ""}
          onClick={() => setActiveTab("yakindakiler")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: activeTab === "yakindakiler" ? 750 : 600,
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Clock size={16} />
          YAKINDAKİLER ({upcomingEvents.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEKMEYE GÖRE İÇERİK */}
      {/* ========================================================================= */}

      {/* 1. SEKMELER: GÜNÜM */}
      {activeTab === "gunum" && (
        <div className="page-stack page-enter">
          <div className="stats-grid stats-grid-6">
            <StatCard
              icon={<CalendarDays />}
              label="Bugünkü Etkinlikler"
              value={formatNumber(totals?.today)}
              meta="Bugün planlanan"
              loading={loading}
            />
            <StatCard
              icon={<UsersRound />}
              label="Yaklaşan Doğumlar"
              value={formatNumber(totals?.upcomingBirths)}
              meta="15 gün içinde"
              tone="purple"
              loading={loading}
            />
            <StatCard
              icon={<Wheat />}
              label="Planlı Hasatlar"
              value={formatNumber(totals?.plannedHarvests)}
              meta="15 gün içinde"
              tone="orange"
              loading={loading}
            />
            <StatCard
              icon={<Stethoscope />}
              label="Veteriner Randevuları"
              value={formatNumber(totals?.vetAppointments)}
              meta="Bu hafta"
              tone="blue"
              loading={loading}
            />
            <StatCard
              icon={<Droplets />}
              label="Sulama Planları"
              value={formatNumber(totals?.irrigationPlans)}
              meta="Bu hafta"
              tone="blue"
              loading={loading}
            />
            <StatCard
              icon={<AlarmClock />}
              label="Kritik Hatırlatmalar"
              value={formatNumber(totals?.criticalReminders)}
              meta="Acil aksiyon gerekli"
              tone="red"
              loading={loading}
            />
          </div>

          <div className="calendar-layout">
            <Panel>
              <CalendarBoard
                month={month}
                loading={monthLoading}
                onNavigate={navigate}
                onToday={() =>
                  setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })
                }
              />
            </Panel>

            <div className="calendar-sidebar">
              <Panel title="Bugünkü Ajanda">
                <div className="agenda-list">
                  {!summary && <SkeletonBlock rows={4} height={26} />}
                  {summary?.todayAgenda.map((item) => (
                    <span key={item.id}>
                      <time>{item.time}</time>
                      <b>{item.title}</b>
                      <small>{item.meta || "—"}</small>
                    </span>
                  ))}
                  {summary?.todayAgenda.length === 0 && (
                    <span>
                      <time>—</time>
                      <b>Bugün etkinlik yok</b>
                      <small>Takviminiz boş görünüyor.</small>
                    </span>
                  )}
                </div>
              </Panel>

              <Panel title="Yaklaşan Doğumlar" action={<Link href="/suru">Sürüye Git</Link>}>
                <div className="compact-list">
                  {!summary && <SkeletonBlock rows={3} height={30} />}
                  {summary?.upcomingBirthList.map((animal) => (
                    <Link key={animal.id} href={`/suru/${animal.id}`}>
                      <UsersRound />
                      <span>
                        <strong>{animal.earTag}</strong>
                        <small>
                          {[animal.breed, animal.ageLabel].filter(Boolean).join(" · ")}
                        </small>
                      </span>
                      <b>{animal.daysLeft} gün</b>
                    </Link>
                  ))}
                </div>
              </Panel>

              <Panel title="Son Hatırlatmalar" action={<Link href="/alarmlar">Tümü</Link>}>
                <div className="alert-list">
                  {!summary && <SkeletonBlock rows={2} height={30} />}
                  {summary?.reminders.map((reminder) => (
                    <span
                      key={reminder.id}
                      className={reminder.severity === "kritik" ? "alert-red" : "alert-orange"}
                    >
                      <AlarmClock />
                      <b>{reminder.title}</b>
                      <small>
                        {reminder.message} · {formatRelative(reminder.createdAt)}
                      </small>
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          <div className="module-bottom-grid">
            <Panel title="Haftalık Operasyon Planı">
              <div className="compact-list">
                {!summary && <SkeletonBlock rows={5} height={30} />}
                {summary?.weeklyPlan.map((day) => (
                  <div key={day.date}>
                    <CalendarDays />
                    <span>
                      <strong>{day.label}</strong>
                      <small>
                        {day.count} etkinlik · {day.irrigation} sulama
                      </small>
                    </span>
                    <b>Planlı</b>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Görev Dağılımı">
              <div className="progress-list">
                {!summary && <SkeletonBlock rows={4} height={22} />}
                {summary?.assigneeLoad.map((person) => (
                  <span key={person.name}>
                    <UsersRound />
                    <b>{person.name}</b>
                    <i>
                      <em style={{ width: `${person.percent}%` }} />
                    </i>
                    <small>{person.count}</small>
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Etkinlik Türleri">
              <div className="info-grid">
                {!summary && <SkeletonBlock rows={3} height={24} />}
                {summary?.typeCounts.slice(0, 6).map((item) => (
                  <span key={item.type}>
                    <small>{item.name}</small>
                    <b>{item.count}</b>
                  </span>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* 2. SEKMELER: NOTLAR */}
      {activeTab === "notlar" && (
        <div className="page-stack page-enter">
          <Panel
            title="Takvim Üzerindeki Notlar"
            action={
              <button
                className="button button-primary"
                onClick={() => setShowAddNoteModal(true)}
                style={{ padding: "6px 12px", fontSize: "12.5px" }}
              >
                <Plus size={15} /> + Yeni Not Ekle
              </button>
            }
          >
            <Filters
              placeholder="Not başlığı veya içerik ara..."
              search={noteSearch}
              onSearchChange={(val) => setNoteSearch(val)}
              onSelectChange={(name, val) => {
                if (name === "category") setNoteCategoryFilter(val);
              }}
              selects={[
                {
                  name: "category",
                  placeholder: "Tüm Kategoriler",
                  value: noteCategoryFilter,
                  options: [
                    { value: "Sürü & Sağlık", label: "Sürü & Sağlık" },
                    { value: "Tarla & Ekim", label: "Tarla & Ekim" },
                    { value: "Ekipman & Bakım", label: "Ekipman & Bakım" },
                    { value: "Genel", label: "Genel Notlar" },
                  ],
                },
              ]}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: "14px",
                marginTop: "14px",
              }}
            >
              {filteredNotes.map((note) => {
                const priorityColor =
                  note.priority === "yüksek"
                    ? "var(--red)"
                    : note.priority === "normal"
                    ? "var(--green-600)"
                    : "var(--muted)";

                return (
                  <div
                    key={note.id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <Badge tone={note.category === "Sürü & Sağlık" ? "blue" : note.category === "Tarla & Ekim" ? "orange" : "gray"}>
                          {note.category}
                        </Badge>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: priorityColor }}>
                          • {note.priority.toUpperCase()} ÖNCELİK
                        </span>
                      </div>

                      <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700 }}>{note.title}</h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.45 }}>
                        {note.content}
                      </p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <small style={{ fontSize: "11px", color: "var(--muted)" }}>Tarih: {note.date}</small>
                        <small style={{ fontSize: "11px", fontWeight: 600 }}>Ekleyen: {note.author}</small>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNoteToDeleteConfirm(note)}
                        style={{
                          background: "none",
                          border: 0,
                          color: "var(--red)",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                        title="Notu Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredNotes.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <StickyNote size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Kayıtlı not bulunamadı.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* 3. SEKMELER: YAKINDAKİLER */}
      {activeTab === "yakindakiler" && (
        <div className="page-stack page-enter">
          <Panel title="Yaklaşan Faaliyetler ve Takvim İşleri (Gelecek 30 Gün)">
            {/* Tür Filtre Butonları */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                className={upcomingTypeFilter === "all" ? "button button-primary" : "button button-secondary"}
                onClick={() => setUpcomingTypeFilter("all")}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                Tümü ({upcomingEvents.length})
              </button>
              <button
                type="button"
                className={upcomingTypeFilter === "doğum" ? "button button-primary" : "button button-secondary"}
                onClick={() => setUpcomingTypeFilter("doğum")}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                🐮 Yaklaşan Doğumlar
              </button>
              <button
                type="button"
                className={upcomingTypeFilter === "sulama" ? "button button-primary" : "button button-secondary"}
                onClick={() => setUpcomingTypeFilter("sulama")}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                💧 Sulama Planları
              </button>
              <button
                type="button"
                className={upcomingTypeFilter === "veteriner" ? "button button-primary" : "button button-secondary"}
                onClick={() => setUpcomingTypeFilter("veteriner")}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                🩺 Veteriner & Kontrol
              </button>
              <button
                type="button"
                className={upcomingTypeFilter === "hasat" ? "button button-primary" : "button button-secondary"}
                onClick={() => setUpcomingTypeFilter("hasat")}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                🌾 Hasat & Gübreleme
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredUpcoming.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background:
                          item.type === "doğum"
                            ? "rgba(135, 100, 204, 0.15)"
                            : item.type === "sulama"
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(22, 131, 70, 0.15)",
                        color:
                          item.type === "doğum"
                            ? "var(--purple)"
                            : item.type === "sulama"
                            ? "var(--blue)"
                            : "var(--green-700)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                      }}
                    >
                      {item.type === "doğum" ? "🐮" : item.type === "sulama" ? "💧" : item.type === "veteriner" ? "🩺" : "🌾"}
                    </div>

                    <div>
                      <strong style={{ fontSize: "14.5px", display: "block" }}>{item.title}</strong>
                      <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                        {item.entityName} · Sorumlu: {item.assignedPerson}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, display: "block" }}>{item.date}</span>
                      <small
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: item.daysLeft <= 2 ? "var(--red)" : "var(--green-700)",
                        }}
                      >
                        {item.daysLeft === 0 ? "Bugün!" : item.daysLeft === 1 ? "Yarın!" : `${item.daysLeft} gün kaldı`}
                      </small>
                    </div>

                    <Link
                      href={item.targetLink}
                      className="button button-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      İncele →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* MODAL: Yeni Not Ekle */}
      {showAddNoteModal && (
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
            ref={addNoteModalRef}
            style={{
              width: "100%",
              maxWidth: "500px",
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
                <StickyNote style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Takvime Yeni Not Ekle</h3>
              </div>
              <button
                onClick={() => setShowAddNoteModal(false)}
                style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                  Not Başlığı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kuzey Tarlası Azot Gübrelemesi"
                  value={newNoteForm.title}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, title: e.target.value })}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Tarih *
                  </label>
                  <input
                    type="date"
                    value={newNoteForm.date}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, date: e.target.value })}
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

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori *
                  </label>
                  <select
                    value={newNoteForm.category}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, category: e.target.value as any })}
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
                    <option value="Sürü & Sağlık">Sürü & Sağlık</option>
                    <option value="Tarla & Ekim">Tarla & Ekim</option>
                    <option value="Ekipman & Bakım">Ekipman & Bakım</option>
                    <option value="Genel">Genel Not</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Öncelik Derecesi
                  </label>
                  <select
                    value={newNoteForm.priority}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, priority: e.target.value as any })}
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
                    <option value="yüksek">Yüksek Öncelik</option>
                    <option value="normal">Normal Öncelik</option>
                    <option value="düşük">Düşük Öncelik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Notu Ekleyen
                  </label>
                  <input
                    type="text"
                    value={newNoteForm.author}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, author: e.target.value })}
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
                  Not Detayı & Açıklama *
                </label>
                <textarea
                  rows={3}
                  placeholder="Yapılacak operasyon, hatırlatma detayları..."
                  value={newNoteForm.content}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, content: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddNoteModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Not Sil Onay */}
      {noteToDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            ref={deleteNoteModalRef}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--red)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
                Takvim Notunu Sil?
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.45 }}>
                <strong style={{ color: "var(--text)" }}>{noteToDeleteConfirm.title}</strong> notunu silmek istediğinize emin misiniz?
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setNoteToDeleteConfirm(null)}
              >
                İptal
              </button>
              <button
                type="button"
                className="button button-danger"
                style={{ flex: 1, justifyContent: "center", background: "var(--red)", color: "white" }}
                onClick={confirmDeleteNote}
              >
                Evet, Notu Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
