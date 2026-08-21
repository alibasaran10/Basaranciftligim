"use client";

import {
  FileText,
  Beef,
  MapPin,
  Truck,
  Download,
  Eye,
  Search,
  FileCheck,
  X,
  CheckCircle2,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, useMemo, FormEvent, ChangeEvent } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatDate } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

export interface FarmDocument {
  id: string;
  category: "pasaport" | "tapu" | "ruhsat";
  categoryLabel: string;
  title: string;
  documentNo: string;
  subDetail: string;
  issueDate: string;
  expiryDate?: string | null;
  fileSize: string;
  fileFormat: "PDF" | "PNG" | "JPG";
  status: "Aktif / Geçerli" | "Yenileme Bekliyor" | "Arşivlendi";
  imageUrl?: string;
}

const INITIAL_DOCUMENTS: FarmDocument[] = [
  // 1. HAYVAN PASAPORTLARI
  {
    id: "doc-1",
    category: "pasaport",
    categoryLabel: "Hayvan Pasaportu",
    title: "TR38009214 - Sımmental Gebe Düve Pasaportu",
    documentNo: "TR-PAS-2025-0012",
    subDetail: "Kulak Küpe No: TR38009214 · Irk: Sımmental · Cinsiyet: Dişi",
    issueDate: "2024-03-15",
    expiryDate: null,
    fileSize: "1.4 MB",
    fileFormat: "JPG",
    status: "Aktif / Geçerli",
    imageUrl: "/assets/farm_map.png",
  },
  {
    id: "doc-2",
    category: "pasaport",
    categoryLabel: "Hayvan Pasaportu",
    title: "TR38008819 - Holstein Sağmal İnek Pasaportu",
    documentNo: "TR-PAS-2024-0891",
    subDetail: "Kulak Küpe No: TR38008819 · Irk: Holstein · Cinsiyet: Dişi",
    issueDate: "2023-11-10",
    expiryDate: null,
    fileSize: "1.1 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
    imageUrl: "/assets/field_north.png",
  },
  {
    id: "doc-3",
    category: "pasaport",
    categoryLabel: "Hayvan Pasaportu",
    title: "TR38007410 - Sımmental Damızlık Boğa Pasaportu",
    documentNo: "TR-PAS-2024-0412",
    subDetail: "Kulak Küpe No: TR38007410 · Irk: Fleckvieh · Cinsiyet: Erkek",
    issueDate: "2024-01-20",
    expiryDate: null,
    fileSize: "1.6 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },
  {
    id: "doc-4",
    category: "pasaport",
    categoryLabel: "Hayvan Pasaportu",
    title: "TR38009550 - Angus Besi Tosunu Pasaportu",
    documentNo: "TR-PAS-2025-0104",
    subDetail: "Kulak Küpe No: TR38009550 · Irk: Black Angus · Cinsiyet: Erkek",
    issueDate: "2025-02-05",
    expiryDate: null,
    fileSize: "980 KB",
    fileFormat: "JPG",
    status: "Aktif / Geçerli",
  },

  // 2. ARAZİ TAPULARI
  {
    id: "doc-5",
    category: "tapu",
    categoryLabel: "Arazi Tapusu",
    title: "Konya / Karatay - Ada 104 / Parsel 12 Tapu Senedi",
    documentNo: "TKGM-TAPU-104-12",
    subDetail: "Müstakil Tapu · 50.0 Dönüm · Tarla Vasfı (Ekmeklik Buğday)",
    issueDate: "2021-06-18",
    expiryDate: null,
    fileSize: "3.2 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
    imageUrl: "/assets/field_east.png",
  },
  {
    id: "doc-6",
    category: "tapu",
    categoryLabel: "Arazi Tapusu",
    title: "Konya / Karatay - Ada 101 / Parsel 3 Tapu Senedi",
    documentNo: "TKGM-TAPU-101-03",
    subDetail: "Hisseli Tapu (%100 Hisse) · 40.0 Dönüm · Sulu Tarım (Mısır)",
    issueDate: "2020-04-12",
    expiryDate: null,
    fileSize: "2.8 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
    imageUrl: "/assets/field_west.png",
  },
  {
    id: "doc-7",
    category: "tapu",
    categoryLabel: "Arazi Tapusu",
    title: "Konya / Karatay - Ada 102 / Parsel 8 Tapu Senedi",
    documentNo: "TKGM-TAPU-102-08",
    subDetail: "Müstakil Tapu · 25.0 Dönüm · Yonca Arazisi",
    issueDate: "2022-09-01",
    expiryDate: null,
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },
  {
    id: "doc-8",
    category: "tapu",
    categoryLabel: "Arazi Tapusu",
    title: "Konya / Çumra - Ada 205 / Parsel 14 Tapu Senedi",
    documentNo: "TKGM-TAPU-205-14",
    subDetail: "Müstakil Tapu · 65.0 Dönüm · Şeker Pancarı Arazisi",
    issueDate: "2023-01-15",
    expiryDate: null,
    fileSize: "4.1 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },

  // 3. ARAÇ RUHSATLARI
  {
    id: "doc-9",
    category: "ruhsat",
    categoryLabel: "Araç Ruhsatı",
    title: "38 BC 192 - New Holland TD5.110 Traktör Ruhsatı",
    documentNo: "EGM-RHS-2024-88",
    subDetail: "Model: 2023 · Şasi No: NHTD5110TR992 · Muayene: 2026-11-14",
    issueDate: "2023-05-20",
    expiryDate: "2026-11-14",
    fileSize: "1.8 MB",
    fileFormat: "JPG",
    status: "Aktif / Geçerli",
    imageUrl: "/assets/field_south.png",
  },
  {
    id: "doc-10",
    category: "ruhsat",
    categoryLabel: "Araç Ruhsatı",
    title: "38 FA 410 - CLAAS Lexion 670 Biçerdöver Tescil Belgesi",
    documentNo: "EGM-RHS-2022-104",
    subDetail: "Model: 2022 · Şasi No: CLAAS670LEX9102 · Muayene: 2026-08-30",
    issueDate: "2022-04-10",
    expiryDate: "2026-08-30",
    fileSize: "2.2 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },
  {
    id: "doc-11",
    category: "ruhsat",
    categoryLabel: "Araç Ruhsatı",
    title: "38 AB 505 - Ford Transit Çiftlik Hizmet Aracı Ruhsatı",
    documentNo: "EGM-RHS-2023-412",
    subDetail: "Model: 2021 · Plaka: 38 AB 505 · Muayene: 2026-06-15",
    issueDate: "2021-08-14",
    expiryDate: "2026-06-15",
    fileSize: "1.3 MB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },
  {
    id: "doc-12",
    category: "ruhsat",
    categoryLabel: "Araç Ruhsatı",
    title: "38 R 881 - Palazoğlu 12 Ton Çift Dingil Römork Ruhsatı",
    documentNo: "EGM-RHS-2024-901",
    subDetail: "Model: 2024 · Tip: Tarım Römorku · Muayene: 2027-04-10",
    issueDate: "2024-04-10",
    expiryDate: "2027-04-10",
    fileSize: "950 KB",
    fileFormat: "PDF",
    status: "Aktif / Geçerli",
  },
];

export function ReportsView() {
  const dispatch = useAppDispatch();
  const [documents, setDocuments] = useState<FarmDocument[]>(INITIAL_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<FarmDocument | null>(null);

  // File Upload State for Modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string>("");

  // New Document Modal Form State
  const [newDocForm, setNewDocForm] = useState({
    category: "pasaport" as "pasaport" | "tapu" | "ruhsat",
    title: "",
    documentNo: "",
    subDetail: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    fileFormat: "JPG" as "PDF" | "PNG" | "JPG",
  });

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = selectedCategory === "all" || doc.category === selectedCategory;
      const s = search.toLocaleLowerCase("tr-TR").trim();
      const matchSearch =
        !s ||
        doc.title.toLocaleLowerCase("tr-TR").includes(s) ||
        doc.documentNo.toLocaleLowerCase("tr-TR").includes(s) ||
        doc.subDetail.toLocaleLowerCase("tr-TR").includes(s);

      return matchCat && matchSearch;
    });
  }, [documents, selectedCategory, search]);

  // Counts
  const pasaportCount = documents.filter((d) => d.category === "pasaport").length;
  const tapuCount = documents.filter((d) => d.category === "tapu").length;
  const ruhsatCount = documents.filter((d) => d.category === "ruhsat").length;

  // Handle Download Action
  const handleDownload = (doc: FarmDocument) => {
    dispatch(showToast(`📥 "${doc.title}" belgesi indirildi.`));
  };

  // Handle Preview Action
  const handlePreview = (doc: FarmDocument) => {
    setPreviewDoc(doc);
  };

  // Handle File Input Change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedFile(file);

      // Check format
      let fmt: "PDF" | "PNG" | "JPG" = "JPG";
      if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
        fmt = "PDF";
      } else if (file.type.includes("png") || file.name.endsWith(".png")) {
        fmt = "PNG";
      }
      setNewDocForm((prev) => ({ ...prev, fileFormat: fmt }));

      // Create preview object URL for images
      if (file.type.startsWith("image/")) {
        setPreviewFileUrl(URL.createObjectURL(file));
      } else {
        setPreviewFileUrl("");
      }
    }
  };

  // Handle Add New Document Submit
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) {
      dispatch(showToast("Lütfen belge başlığını giriniz."));
      return;
    }

    if (!selectedFile) {
      dispatch(showToast("⚠️ Lütfen belge fotoğrafını veya PDF dosyasını yükleyiniz (Zorunlu)."));
      return;
    }

    const catLabel =
      newDocForm.category === "pasaport"
        ? "Hayvan Pasaportu"
        : newDocForm.category === "tapu"
        ? "Arazi Tapusu"
        : "Araç Ruhsatı";

    const fileSizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);

    const createdDoc: FarmDocument = {
      id: `doc-${Date.now()}`,
      category: newDocForm.category,
      categoryLabel: catLabel,
      title: newDocForm.title.trim(),
      documentNo: newDocForm.documentNo.trim() || `EVR-${Date.now().toString().slice(-4)}`,
      subDetail: newDocForm.subDetail.trim() || "Çiftlik Resmi Evrak Kaydı",
      issueDate: newDocForm.issueDate,
      expiryDate: newDocForm.expiryDate || null,
      fileSize: `${fileSizeMb} MB`,
      fileFormat: newDocForm.fileFormat,
      status: "Aktif / Geçerli",
      imageUrl: previewFileUrl || "/assets/farm_map.png",
    };

    setDocuments((prev) => [createdDoc, ...prev]);
    setShowAddModal(false);
    setSelectedFile(null);
    setPreviewFileUrl("");
    dispatch(showToast(`✅ "${createdDoc.title}" belgesi ve fotoğrafı sisteme eklendi.`));
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Evraklar"
        description="Çiftliğinize ait Hayvan Pasaportları, Arazi Tapuları ve Araç Ruhsatlarını tek merkezden güvenle yönetin ve fotoğraflarını yükleyin."
        icon={<FileText />}
        primaryLabel="Yeni Evrak / Belge Yükle"
        onPrimaryClick={() => {
          setNewDocForm({
            category: "pasaport",
            title: "",
            documentNo: "",
            subDetail: "",
            issueDate: new Date().toISOString().split("T")[0],
            expiryDate: "",
            fileFormat: "JPG",
          });
          setSelectedFile(null);
          setPreviewFileUrl("");
          setShowAddModal(true);
        }}
      />

      {/* STAT CARDS OVERVIEW */}
      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<FileCheck />}
          label="Toplam Kayıtlı Evrak"
          value={`${documents.length} Belge`}
          meta="Tüm resmi belgeler"
          tone="green"
        />
        <StatCard
          icon={<Beef />}
          label="Hayvan Pasaportları"
          value={`${pasaportCount} Küpe Kaydı`}
          meta="Kayıtlı pasaport"
          tone="blue"
        />
        <StatCard
          icon={<MapPin />}
          label="Arazi Tapuları"
          value={`${tapuCount} Parsel Tapusu`}
          meta="Müstakil ve hisseli tapular"
          tone="purple"
        />
        <StatCard
          icon={<Truck />}
          label="Araç Ruhsatları"
          value={`${ruhsatCount} Tescil Belgesi`}
          meta="Traktör, biçerdöver & römork"
          tone="orange"
        />
      </div>

      {/* CORE 3 CATEGORIES SELECTION GRID */}
      <Panel title="📁 Resmi Evrak Kategorileri">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* CATEGORY 1: HAYVAN PASAPORTLARI */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === "pasaport" ? "all" : "pasaport")}
            style={{
              background:
                selectedCategory === "pasaport"
                  ? "rgba(52, 211, 153, 0.12)"
                  : "var(--surface-2)",
              border:
                selectedCategory === "pasaport"
                  ? "2px solid var(--green-600)"
                  : "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(52, 211, 153, 0.18)",
                  color: "var(--green-600)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Beef size={26} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Hayvan Pasaportları
                </h4>
                <small style={{ color: "var(--muted)", fontSize: "12.5px" }}>
                  {pasaportCount} Kayıtlı Pasaport / Pedigree
                </small>
              </div>
            </div>
            <span
              style={{
                fontSize: "20px",
                color: selectedCategory === "pasaport" ? "var(--green-600)" : "var(--muted)",
              }}
            >
              ›
            </span>
          </div>

          {/* CATEGORY 2: ARAZİ TAPULARI */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === "tapu" ? "all" : "tapu")}
            style={{
              background:
                selectedCategory === "tapu"
                  ? "rgba(59, 130, 246, 0.12)"
                  : "var(--surface-2)",
              border:
                selectedCategory === "tapu"
                  ? "2px solid #3b82f6"
                  : "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(59, 130, 246, 0.18)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={26} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Arazi Tapuları
                </h4>
                <small style={{ color: "var(--muted)", fontSize: "12.5px" }}>
                  {tapuCount} Kayıtlı Tapu Senedi
                </small>
              </div>
            </div>
            <span
              style={{
                fontSize: "20px",
                color: selectedCategory === "tapu" ? "#3b82f6" : "var(--muted)",
              }}
            >
              ›
            </span>
          </div>

          {/* CATEGORY 3: ARAÇ RUHSATLARI */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === "ruhsat" ? "all" : "ruhsat")}
            style={{
              background:
                selectedCategory === "ruhsat"
                  ? "rgba(245, 158, 11, 0.12)"
                  : "var(--surface-2)",
              border:
                selectedCategory === "ruhsat"
                  ? "2px solid #f59e0b"
                  : "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.18)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Truck size={26} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Araç Ruhsatları
                </h4>
                <small style={{ color: "var(--muted)", fontSize: "12.5px" }}>
                  {ruhsatCount} Kayıtlı Tescil Ruhsatı
                </small>
              </div>
            </div>
            <span
              style={{
                fontSize: "20px",
                color: selectedCategory === "ruhsat" ? "#f59e0b" : "var(--muted)",
              }}
            >
              ›
            </span>
          </div>
        </div>
      </Panel>

      {/* DOCUMENT LIST PANEL WITH SEARCH & ACTION BUTTONS */}
      <Panel
        title={
          selectedCategory === "pasaport"
            ? "🐮 Hayvan Pasaportları Listesi"
            : selectedCategory === "tapu"
            ? "📜 Arazi Tapuları Listesi"
            : selectedCategory === "ruhsat"
            ? "🚜 Araç & Ekipman Ruhsatları Listesi"
            : "📑 Tüm Resmi Evraklar"
        }
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                }}
              />
              <input
                type="text"
                placeholder="Küpe No, Plaka, Ada-Parsel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface-2)",
                  fontSize: "12.5px",
                  color: "inherit",
                }}
              />
            </div>
            {selectedCategory !== "all" && (
              <button
                className="button button-secondary"
                onClick={() => setSelectedCategory("all")}
                style={{ padding: "5px 10px", fontSize: "12px" }}
              >
                Filtreyi Temizle
              </button>
            )}
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredDocuments.map((doc) => {
            const IconComponent =
              doc.category === "pasaport"
                ? Beef
                : doc.category === "tapu"
                ? MapPin
                : Truck;

            const categoryBadgeColor =
              doc.category === "pasaport"
                ? { bg: "rgba(52, 211, 153, 0.14)", text: "var(--green-600)" }
                : doc.category === "tapu"
                ? { bg: "rgba(59, 130, 246, 0.14)", text: "#3b82f6" }
                : { bg: "rgba(245, 158, 11, 0.14)", text: "#f59e0b" };

            return (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "280px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: categoryBadgeColor.bg,
                      color: categoryBadgeColor.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "14.5px", color: "var(--text)" }}>
                        {doc.title}
                      </strong>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: categoryBadgeColor.bg,
                          color: categoryBadgeColor.text,
                        }}
                      >
                        {doc.categoryLabel}
                      </span>
                    </div>
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      {doc.subDetail} · <span style={{ fontFamily: "monospace" }}>{doc.documentNo}</span>
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "var(--muted)" }}>
                    <div>
                      Düzenleme: <b>{formatDate(doc.issueDate)}</b>
                    </div>
                    {doc.expiryDate && (
                      <div style={{ color: "#f59e0b", fontWeight: 600 }}>
                        Muayene Bitiş: {formatDate(doc.expiryDate)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => handlePreview(doc)}
                      style={{ padding: "6px 12px", fontSize: "12.5px", gap: "5px" }}
                    >
                      <Eye size={14} /> Fotoğraf & Detay
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleDownload(doc)}
                      style={{ padding: "6px 12px", fontSize: "12.5px", gap: "5px" }}
                    >
                      <Download size={14} /> İndir ({doc.fileFormat})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDocuments.length === 0 && (
            <div
              style={{
                padding: "36px",
                textAlign: "center",
                color: "var(--muted)",
                background: "var(--surface-2)",
                borderRadius: "12px",
              }}
            >
              <FileCheck size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Aradığınız kriterlere uygun evrak bulunamadı.</p>
            </div>
          )}
        </div>
      </Panel>

      {/* PREVIEW MODAL WITH PHOTO / IMAGE VIEWING */}
      {previewDoc && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewDoc(null)}
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
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "24px",
              borderRadius: "16px",
              maxWidth: "560px",
              width: "92%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(52, 211, 153, 0.15)",
                    color: "var(--green-600)",
                  }}
                >
                  <FileCheck size={20} />
                </div>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-600)" }}>
                    RESMİ BELGE VE FOTOĞRAF İNCELEME
                  </span>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                    {previewDoc.title}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* BELGE FOTOĞRAFI GÖRÜNTÜLEME ALANI */}
            {previewDoc.imageUrl && (
              <div
                style={{
                  marginBottom: "16px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  background: "#000",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  maxHeight: "240px",
                }}
              >
                <Image
                  src={previewDoc.imageUrl}
                  alt={previewDoc.title}
                  width={500}
                  height={240}
                  style={{ objectFit: "cover", width: "100%", height: "auto", maxHeight: "240px" }}
                  unoptimized
                />
              </div>
            )}

            <div
              style={{
                background: "var(--surface-2)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                fontSize: "13px",
                marginBottom: "18px",
              }}
            >
              <div>
                <span style={{ color: "var(--muted)" }}>Kategori:</span>{" "}
                <b>{previewDoc.categoryLabel}</b>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Belge / Sicil No:</span>{" "}
                <b style={{ fontFamily: "monospace" }}>{previewDoc.documentNo}</b>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Detaylar:</span>{" "}
                <b>{previewDoc.subDetail}</b>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Düzenlenme Tarihi:</span>{" "}
                <b>{formatDate(previewDoc.issueDate)}</b>
              </div>
              {previewDoc.expiryDate && (
                <div>
                  <span style={{ color: "var(--muted)" }}>Bitiş / Muayene Tarihi:</span>{" "}
                  <b style={{ color: "#f59e0b" }}>{formatDate(previewDoc.expiryDate)}</b>
                </div>
              )}
              <div>
                <span style={{ color: "var(--muted)" }}>Dosya Formatı & Büyüklük:</span>{" "}
                <b>{previewDoc.fileFormat} ({previewDoc.fileSize})</b>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--green-600)", fontWeight: 700, marginTop: "4px" }}>
                <CheckCircle2 size={16} /> Yüklenmiş Evrak Görseli
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPreviewDoc(null)}
              >
                Kapat
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                style={{ gap: "6px" }}
              >
                <Download size={15} /> Belgeyi / Fotoğrafı İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ EVRAK / PASAPORT YÜKLE (FOTOĞRAF YÜKLEME ZORUNLU) */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddModal(false)}
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
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "24px",
              borderRadius: "16px",
              maxWidth: "540px",
              width: "92%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-600)" }}>
                  RESMİ EVRAK VE FOTOĞRAF EKLEME
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  Yeni Belge / Pasaport Kaydı
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Belge Kategorisi *
                </label>
                <select
                  value={newDocForm.category}
                  onChange={(e) =>
                    setNewDocForm({
                      ...newDocForm,
                      category: e.target.value as "pasaport" | "tapu" | "ruhsat",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                    fontWeight: 600,
                  }}
                >
                  <option value="pasaport">🐮 Hayvan Pasaportu (Kulak Küpe / Pedigree)</option>
                  <option value="tapu">📜 Arazi Tapusu (Müstakil / Hisseli Sened)</option>
                  <option value="ruhsat">🚜 Araç Ruhsatı (Traktör, Biçerdöver, Römork)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Belge Adı / Başlığı *
                </label>
                <input
                  required
                  type="text"
                  placeholder={
                    newDocForm.category === "pasaport"
                      ? "Örn: TR38009912 - Simmental Düve Pasaportu"
                      : newDocForm.category === "tapu"
                      ? "Örn: Konya Karatay Ada 105 / Parsel 4 Tapusu"
                      : "Örn: 38 AB 101 - New Holland Traktör Ruhsatı"
                  }
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                  }}
                />
              </div>

              {/* FOTOĞRAF / BELGE GÖRSELİ YÜKLEME ALANI (ZORUNLU) */}
              <div
                style={{
                  border: selectedFile ? "2px solid var(--green-600)" : "2px dashed var(--line)",
                  borderRadius: "12px",
                  padding: "16px",
                  background: selectedFile ? "rgba(52, 211, 153, 0.08)" : "var(--surface-2)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />

                {previewFileUrl ? (
                  <div style={{ position: "relative", width: "100%", maxHeight: "140px", borderRadius: "8px", overflow: "hidden" }}>
                    <Image
                      src={previewFileUrl}
                      alt="Yüklenen Belge Fotoğrafı"
                      width={400}
                      height={140}
                      style={{ objectFit: "cover", width: "100%", height: "140px" }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(52, 211, 153, 0.15)",
                      color: "var(--green-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                )}

                <div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", display: "block" }}>
                    {selectedFile
                      ? `✅ Yüklenen Dosya: ${selectedFile.name}`
                      : "📸 Belge Fotoğrafı veya PDF Yükle * (Zorunlu)"}
                  </span>
                  <small style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Değiştirmek için tıklayın`
                      : "Telefon veya bilgisayardan evrak fotoğrafı seçiniz (JPG, PNG, PDF)"}
                  </small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Belge / Tescil No
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: TR-PAS-2026-901"
                    value={newDocForm.documentNo}
                    onChange={(e) => setNewDocForm({ ...newDocForm, documentNo: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontWeight: 600,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Dosya Formatı
                  </label>
                  <select
                    value={newDocForm.fileFormat}
                    onChange={(e) =>
                      setNewDocForm({
                        ...newDocForm,
                        fileFormat: e.target.value as "PDF" | "PNG" | "JPG",
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                    }}
                  >
                    <option value="JPG">JPG Taraması / Fotoğraf</option>
                    <option value="PNG">PNG Görseli</option>
                    <option value="PDF">PDF Dokümanı</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama / Detay Bilgisi
                </label>
                <input
                  type="text"
                  placeholder="Örn: Küpe No, Irk, Şasi No veya Dönüm m² bilgisi..."
                  value={newDocForm.subDetail}
                  onChange={(e) => setNewDocForm({ ...newDocForm, subDetail: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    color: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Düzenlenme Tarihi
                  </label>
                  <input
                    type="date"
                    value={newDocForm.issueDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, issueDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Bitiş / Muayene Tarihi
                  </label>
                  <input
                    type="date"
                    value={newDocForm.expiryDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Belgeyi Kaydet ve Yükle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
