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
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { CalendarBoard, CalendarEventItem } from "@/components/calendar/CalendarBoard";
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

const INITIAL_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: "evt-1",
    title: "Gebe Sürü Şap Aşısı",
    date: "2026-08-17",
    time: "09:00",
    type: "aşı",
    priority: "yüksek",
    status: "planlandı",
    assignedPerson: "Dr. Ayşe Kaya",
    location: "Ahır 1",
    description: "Tüm Holstein ırkı gebe ineklerin ikinci doz şap aşısı.",
  },
  {
    id: "evt-2",
    title: "Kuzey Tarlası Sulaması",
    date: "2026-08-18",
    time: "21:30",
    type: "sulama",
    priority: "normal",
    status: "planlandı",
    assignedPerson: "Ahmet Demir",
    location: "Kuzey Tarlası (40 Dönüm)",
    description: "Damla sulama kanalıyla gece sulama turu.",
  },
  {
    id: "evt-3",
    title: "TR-3401 Gebe Doğumu",
    date: "2026-08-19",
    time: "14:00",
    type: "doğum",
    priority: "kritik",
    status: "kritik",
    assignedPerson: "Dr. Ayşe Kaya",
    location: "Doğumhane / Ahır 1",
    description: "Simmental ırkı gebe düve doğumu bekleniyor.",
  },
  {
    id: "evt-4",
    title: "John Deere Traktör Bakımı",
    date: "2026-08-19",
    time: "10:30",
    type: "bakım",
    priority: "normal",
    status: "hazırlıkta",
    assignedPerson: "Caner Öztürk",
    location: "Ekipman Hangarı",
    description: "250 saat motor yağı ve hidrolik filtre değişimi.",
  },
  {
    id: "evt-5",
    title: "Rutin Mastitis Taraması",
    date: "2026-08-20",
    time: "08:00",
    type: "veteriner",
    priority: "normal",
    status: "planlandı",
    assignedPerson: "Dr. Ayşe Kaya",
    location: "Sağımhane B",
    description: "Sağmal inekler için somatik hücre sayımı testi.",
  },
  {
    id: "evt-6",
    title: "CIP Süt Tankı Hijyen Yıkaması",
    date: "2026-08-21",
    time: "16:00",
    type: "bakım",
    priority: "düşük",
    status: "planlandı",
    assignedPerson: "Mehmet Yılmaz",
    location: "Süt Tesisleri",
    description: "Paslanmaz tankın asidik deterjanla temizliği.",
  },
  {
    id: "evt-7",
    title: "Yonca 2. Biçim Hasadı",
    date: "2026-08-23",
    time: "07:00",
    type: "hasat",
    priority: "yüksek",
    status: "planlandı",
    assignedPerson: "Ahmet Demir",
    location: "Güney Tarlası",
    description: "25 dönümlük yonca tarlasının balyalanması.",
  },
];

type AgendaItem = {
  id: string;
  time: string;
  title: string;
  meta: string;
};

const INITIAL_AGENDA_ITEMS: AgendaItem[] = [
  { id: "ag-1", time: "08:30", title: "Süt Tankı CIP Hijyen Yıkaması", meta: "Bölüm B Sağımhane" },
  { id: "ag-2", time: "10:00", title: "Dr. Ayşe Kaya Rutin Sürü Muayenesi", meta: "Gebe Düve Padok 1" },
  { id: "ag-3", time: "14:30", title: "Kuzey Tarlası Azotlu Sıvı Gübreleme", meta: "40 Dönüm Mısır Tarlası" },
  { id: "ag-4", time: "17:00", title: "John Deere Traktör 250 Saat Bakımı", meta: "Teknik Servis Hangar 2" },
];

export function CalendarView() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as CalendarTab | null;

  const today = new Date();

  // Sub-tabs State: "gunum" | "notlar" | "yakindakiler"
  const [activeTab, setActiveTab] = useState<CalendarTab>("gunum");

  useEffect(() => {
    if (tabParam === "notlar") {
      setActiveTab("notlar");
    } else if (tabParam === "yakindakiler") {
      setActiveTab("yakindakiler");
    } else {
      setActiveTab("gunum");
    }
  }, [tabParam]);

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

  // Takvim Etkinlikleri (Grid) State & Modals
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(INITIAL_CALENDAR_EVENTS);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEditEvent, setSelectedEditEvent] = useState<CalendarEventItem | null>(null);

  const [eventForm, setEventForm] = useState<{
    id?: string;
    title: string;
    date: string;
    time: string;
    type: string;
    priority: "yüksek" | "normal" | "düşük" | "kritik";
    status: "planlandı" | "hazırlıkta" | "tamamlandı" | "kritik";
    assignedPerson: string;
    location: string;
    description: string;
  }>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    type: "doğum",
    priority: "normal",
    status: "planlandı",
    assignedPerson: "Dr. Ayşe Kaya",
    location: "Ahır 1",
    description: "",
  });

  const handleOpenAddEventModal = (selectedDate?: string) => {
    setEventForm({
      title: "",
      date: selectedDate || new Date().toISOString().split("T")[0],
      time: "09:00",
      type: "doğum",
      priority: "normal",
      status: "planlandı",
      assignedPerson: "Dr. Ayşe Kaya",
      location: "Ahır 1",
      description: "",
    });
    setShowAddEventModal(true);
  };

  const handleOpenEditEventModal = (evt: CalendarEventItem) => {
    setSelectedEditEvent(evt);
    setEventForm({
      id: evt.id,
      title: evt.title || "",
      date: evt.date || new Date().toISOString().split("T")[0],
      time: evt.time || "09:00",
      type: evt.type || "doğum",
      priority: (evt.priority as any) || "normal",
      status: (evt.status as any) || "planlandı",
      assignedPerson: evt.assignedPerson || "",
      location: evt.location || "",
      description: evt.description || "",
    });
  };

  const handleAddEventSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date) {
      dispatch(showToast("Lütfen etkinlik başlığını ve tarihini eksiksiz doldurun."));
      return;
    }

    const newEvt: CalendarEventItem = {
      id: `evt-${Date.now()}`,
      title: eventForm.title.trim(),
      date: eventForm.date,
      time: eventForm.time,
      type: eventForm.type,
      priority: eventForm.priority,
      status: eventForm.status,
      assignedPerson: eventForm.assignedPerson,
      location: eventForm.location,
      description: eventForm.description,
    };

    setCalendarEvents((prev) => [newEvt, ...prev]);
    setShowAddEventModal(false);
    dispatch(showToast(`"${newEvt.title}" takvime eklendi.`));
  };

  const handleEditEventSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditEvent || !eventForm.title.trim()) return;

    setCalendarEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEditEvent.id
          ? {
              ...e,
              title: eventForm.title.trim(),
              date: eventForm.date,
              time: eventForm.time,
              type: eventForm.type,
              priority: eventForm.priority,
              status: eventForm.status,
              assignedPerson: eventForm.assignedPerson,
              location: eventForm.location,
              description: eventForm.description,
            }
          : e
      )
    );
    setSelectedEditEvent(null);
    dispatch(showToast(`"${eventForm.title}" etkinliği güncellendi.`));
  };

  const handleDeleteEvent = (eventId: string) => {
    const evtToDelete = calendarEvents.find((e) => e.id === eventId);
    setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    setSelectedEditEvent(null);
    dispatch(showToast(`"${evtToDelete?.title || "Etkinlik"}" takvimden silindi.`));
  };

  // Günlük Ajanda State & Modal
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(INITIAL_AGENDA_ITEMS);
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [agendaForm, setAgendaForm] = useState({
    time: "10:00",
    title: "",
    meta: "",
  });

  const handleAddAgendaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agendaForm.title.trim()) {
      dispatch(showToast("Lütfen ajanda etkinlik başlığını doldurun."));
      return;
    }

    const newItem: AgendaItem = {
      id: `ag-${Date.now()}`,
      time: agendaForm.time || "09:00",
      title: agendaForm.title.trim(),
      meta: agendaForm.meta.trim() || "—",
    };

    setAgendaItems((prev) => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setShowAddAgendaModal(false);
    setAgendaForm({ time: "10:00", title: "", meta: "" });
    dispatch(showToast(`"${newItem.title}" günlük ajandaya eklendi.`));
  };

  // Modal Refs & Smooth Scroll
  const addEventModalRef = useRef<HTMLDivElement>(null);
  const editEventModalRef = useRef<HTMLDivElement>(null);
  const addNoteModalRef = useRef<HTMLDivElement>(null);
  const deleteNoteModalRef = useRef<HTMLDivElement>(null);
  const addAgendaModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddEventModal && addEventModalRef.current) {
      addEventModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddEventModal]);

  useEffect(() => {
    if (selectedEditEvent && editEventModalRef.current) {
      editEventModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEditEvent]);

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

  useEffect(() => {
    if (showAddAgendaModal && addAgendaModalRef.current) {
      addAgendaModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddAgendaModal]);

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

  const PRIORITY_MAP: Record<string, number> = {
    yüksek: 1,
    normal: 2,
    düşük: 3,
  };

  // Filtrelenmiş ve Önceliğe & Tarihe Göre Sıralanmış Notlar
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchSearch =
          !noteSearch ||
          n.title.toLocaleLowerCase("tr-TR").includes(noteSearch.toLocaleLowerCase("tr-TR")) ||
          n.content.toLocaleLowerCase("tr-TR").includes(noteSearch.toLocaleLowerCase("tr-TR"));
        const matchCat = !noteCategoryFilter || n.category === noteCategoryFilter;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const rankA = PRIORITY_MAP[a.priority] ?? 2;
        const rankB = PRIORITY_MAP[b.priority] ?? 2;
        if (rankA !== rankB) {
          return rankA - rankB; // Yüksek (1) -> Normal (2) -> Düşük (3)
        }
        return a.date.localeCompare(b.date); // Erken tarihli olan önce
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
        showFilter={false}
        showDateChevron={false}
        showActions={activeTab !== "yakindakiler"}
        onPrimaryClick={() => handleOpenAddEventModal()}
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

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

          <div className="calendar-layout" style={{ gridTemplateColumns: "1fr" }}>
            <Panel>
              <CalendarBoard
                month={month}
                loading={monthLoading}
                events={calendarEvents}
                onNavigate={navigate}
                onToday={() =>
                  setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })
                }
                onEventClick={(evt) => handleOpenEditEventModal(evt)}
                onDayClick={(dateStr) => handleOpenAddEventModal(dateStr)}
              />
            </Panel>
          </div>
        </div>
      )}

      {/* 2. SEKMELER: NOTLAR */}
      {activeTab === "notlar" && (
        <div className="page-stack page-enter">
          <Panel
            title="📋 Bugünkü Ajanda & Planlanan Etkinlikler"
            action={
              <button
                className="button button-primary"
                onClick={() => setShowAddAgendaModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <Plus size={15} /> Ajanda Etkinliği Ekle
              </button>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "10px" }}>
              {agendaItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 750,
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "var(--surface-3)",
                        color: "var(--text)",
                      }}
                    >
                      {item.time}
                    </span>
                    <strong style={{ fontSize: "14px" }}>{item.title}</strong>
                  </div>
                  <small style={{ color: "var(--muted)", fontSize: "12px" }}>{item.meta || "—"}</small>
                </div>
              ))}
              {agendaItems.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "14px", color: "var(--muted)", fontSize: "13px" }}>
                  Bugün için kayıtlı ajanda etkinliği yok. Takviminiz boş görünüyor.
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Takvim Üzerindeki Notlar"
            action={
              <button
                className="button button-primary"
                onClick={() => setShowAddNoteModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <Plus size={15} /> Yeni Not Ekle
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
          <Panel
            title="🐮 Yaklaşan Doğumlar (Sürü Biyolojik Takvimi)"
            action={
              <Link href="/suru" className="button button-secondary" style={{ padding: "4px 10px", fontSize: "12px" }}>
                Sürüye Git →
              </Link>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {!summary && <SkeletonBlock rows={3} height={50} />}
              {summary?.upcomingBirthList.map((animal) => (
                <div
                  key={animal.id}
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
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "rgba(135, 100, 204, 0.15)",
                        color: "var(--purple)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <UsersRound size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "14.5px", display: "block" }}>{animal.earTag}</strong>
                      <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                        {[animal.breed, animal.ageLabel].filter(Boolean).join(" · ")}
                      </small>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge tone="purple" style={{ marginBottom: "4px", display: "inline-block" }}>
                      {animal.daysLeft} gün kaldı
                    </Badge>
                    <Link
                      href={`/suru/${animal.id}`}
                      style={{ fontSize: "11.5px", color: "var(--green-700)", fontWeight: 600, display: "block" }}
                    >
                      İncele →
                    </Link>
                  </div>
                </div>
              ))}
              {summary?.upcomingBirthList.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "16px", color: "var(--muted)", fontSize: "13px" }}>
                  Önümüzdeki 15 gün içinde beklenen bir doğum bulunmuyor.
                </div>
              )}
            </div>
          </Panel>

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

      {/* MODAL 3: Yeni Takvim Etkinliği Ekle (Income/Expense modal stilinde) */}
      {showAddEventModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddEventModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "16px",
          }}
        >
          <div
            ref={addEventModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CalendarDays style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Yeni Etkinlik Ekleyin</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddEventModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tarih *
                  </label>
                  <input
                    required
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Saat
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Etkinlik Başlığı *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Örn: TR-3401 Gebe Doğum Kontrolü"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori / Tür
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="doğum">🐮 Doğum/Hayvan</option>
                    <option value="sulama">💧 Sulama Planı</option>
                    <option value="veteriner">🩺 Veteriner Muayenesi</option>
                    <option value="aşı">💉 Aşı & İlaçlama</option>
                    <option value="hasat">🌾 Hasat & Gübreleme</option>
                    <option value="bakım">🔧 Ekipman & Bakım</option>
                    <option value="diğer">📋 Diğer Etkinlik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Öncelik Seviyesi
                  </label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value as any })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="kritik">🔴 Kritik / Acil</option>
                    <option value="yüksek">🟠 Yüksek Öncelik</option>
                    <option value="normal">🟢 Normal Öncelik</option>
                    <option value="düşük">🔵 Düşük Öncelik</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Sorumlu Kişi
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Dr. Ayşe Kaya"
                    value={eventForm.assignedPerson}
                    onChange={(e) => setEventForm({ ...eventForm, assignedPerson: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Konum / Saha
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ahır 1 / Kuzey Tarlası"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama & Detaylar
                </label>
                <textarea
                  rows={3}
                  placeholder="Etkinlik hakkında operasyonel detaylar..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddEventModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Etkinliği Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Etkinlik Düzenleme Modalı (Income/Expense modal stilinde) */}
      {selectedEditEvent && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEditEvent(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "16px",
          }}
        >
          <div
            ref={editEventModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  ETKİNLİK DÜZENLEME
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  {selectedEditEvent.title}
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedEditEvent(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tarih *
                  </label>
                  <input
                    required
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Saat
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Etkinlik Başlığı *
                </label>
                <input
                  required
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori / Tür
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="doğum">🐮 Doğum/Hayvan</option>
                    <option value="sulama">💧 Sulama Planı</option>
                    <option value="veteriner">🩺 Veteriner Muayenesi</option>
                    <option value="aşı">💉 Aşı & İlaçlama</option>
                    <option value="hasat">🌾 Hasat & Gübreleme</option>
                    <option value="bakım">🔧 Ekipman & Bakım</option>
                    <option value="diğer">📋 Diğer Etkinlik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Öncelik Seviyesi
                  </label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value as any })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="kritik">🔴 Kritik / Acil</option>
                    <option value="yüksek">🟠 Yüksek Öncelik</option>
                    <option value="normal">🟢 Normal Öncelik</option>
                    <option value="düşük">🔵 Düşük Öncelik</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Sorumlu Kişi
                  </label>
                  <input
                    type="text"
                    value={eventForm.assignedPerson}
                    onChange={(e) => setEventForm({ ...eventForm, assignedPerson: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Konum / Saha
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama & Detaylar
                </label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                  onClick={() => handleDeleteEvent(selectedEditEvent.id)}
                >
                  Etkinliği Sil
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditEvent(null)}
                  >
                    İptal
                  </button>
                  <button type="submit" className="button button-primary">
                    Güncelle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Yeni Ajanda Etkinliği Ekle */}
      {showAddAgendaModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddAgendaModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "16px",
          }}
        >
          <div
            ref={addAgendaModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Clock style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Ajandaya Etkinlik Ekle</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddAgendaModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAgendaSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Saat *
                  </label>
                  <input
                    required
                    type="time"
                    value={agendaForm.time}
                    onChange={(e) => setAgendaForm({ ...agendaForm, time: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Etkinlik / Görev *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: Süt Tankı CIP Yıkaması"
                    value={agendaForm.title}
                    onChange={(e) => setAgendaForm({ ...agendaForm, title: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Konum / Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bölüm B Sağımhane"
                  value={agendaForm.meta}
                  onChange={(e) => setAgendaForm({ ...agendaForm, meta: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddAgendaModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Ajandaya Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
