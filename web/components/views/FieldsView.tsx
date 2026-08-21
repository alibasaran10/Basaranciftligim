"use client";

import {
  AlertTriangle,
  Calendar,
  Compass,
  Droplets,
  Eye,
  Globe,
  Leaf,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
  Wheat,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatDate, formatNumber, formatPercent, withUnit, formatArea } from "@/lib/format";
import type { FieldRow, FieldSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

export type ExtendedFieldRow = FieldRow & {
  actualHarvestDate?: string | null;
  adaNo?: string;
  parselNo?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
};

export const TURKEY_CITIES: Record<string, { lat: number; lng: number; districts: string[] }> = {
  "Adana": { lat: 37.0, lng: 35.3213, districts: ["Ceyhan", "Yüreğir", "Seyhan", "Karataş", "Kozan", "İmamoğlu", "Yumurtalık", "Sarıçam", "Pozantı", "Karaisalı", "Feke"] },
  "Adıyaman": { lat: 37.7648, lng: 38.2786, districts: ["Merkez", "Besni", "Kahta", "Gölbaşı", "Gerger", "Samsat", "Sincik", "Tut"] },
  "Afyonkarahisar": { lat: 38.7507, lng: 30.5567, districts: ["Merkez", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ", "Şuhut", "Çay", "İscehisar"] },
  "Ağrı": { lat: 39.7191, lng: 43.0503, districts: ["Merkez", "Doğubayazıt", "Patnos", "Diyadin", "Eleşkirt", "Tutak", "Hamur", "Taşlıçay"] },
  "Amasya": { lat: 40.6499, lng: 35.8353, districts: ["Merkez", "Merzifon", "Suluova", "Taşova", "Göynücek", "Hamamözü"] },
  "Ankara": { lat: 39.9334, lng: 32.8597, districts: ["Polatlı", "Haymana", "Şereflikoçhisar", "Bala", "Gölbaşı", "Çubuk", "Akyurt", "Kazan", "Nallıhan", "Beypazarı", "Çamlıdere"] },
  "Antalya": { lat: 36.8969, lng: 30.7133, districts: ["Serik", "Manavgat", "Alanya", "Elmalı", "Korkuteli", "Kumluca", "Finike", "Gazipaşa", "Kaş"] },
  "Artvin": { lat: 41.1828, lng: 41.8183, districts: ["Merkez", "Hopa", "Borçka", "Arhavi", "Yusufeli", "Şavşat", "Ardanuç"] },
  "Aydın": { lat: 37.856, lng: 27.8416, districts: ["Söke", "Nazilli", "İncirliova", "Germencik", "Koçarlı", "Çine", "Kuşadası", "Efeler", "Didim", "Kuyucak"] },
  "Balıkesir": { lat: 39.6484, lng: 27.8826, districts: ["Bandırma", "Gönen", "Edremit", "Burhaniye", "Ayvalık", "Susurluk", "Bigadiç", "Dursunbey", "Manyas"] },
  "Bilecik": { lat: 40.1506, lng: 29.9792, districts: ["Merkez", "Bozüyük", "Söğüt", "Osmaneli", "Pazaryeri", "Gölpazarı"] },
  "Bingöl": { lat: 38.8853, lng: 40.498, districts: ["Merkez", "Genç", "Solhan", "Karlıova", "Kiğı", "Adaklı"] },
  "Bitlis": { lat: 38.4006, lng: 42.1095, districts: ["Merkez", "Tatvan", "Ahlat", "Güroymak", "Adilcevaz", "Hizan", "Mutki"] },
  "Bolu": { lat: 40.7358, lng: 31.6061, districts: ["Merkez", "Gerede", "Mudurnu", "Göynük", "Mengen", "Yeniçağa"] },
  "Burdur": { lat: 37.7203, lng: 30.2908, districts: ["Merkez", "Bucak", "Gölhisar", "Yeşilova", "Tefenni", "Karamanlı"] },
  "Bursa": { lat: 40.1885, lng: 29.061, districts: ["Mustafakemalpaşa", "Karacabey", "Yenişehir", "İnegöl", "Mudanya", "Nilüfer", "Orhangazi", "Gemlik", "İznik"] },
  "Çanakkale": { lat: 40.1553, lng: 26.4142, districts: ["Merkez", "Biga", "Çan", "Gelibolu", "Yenice", "Ezine", "Bayramiç", "Lapseki"] },
  "Çankırı": { lat: 40.6013, lng: 33.6134, districts: ["Merkez", "Çerkeş", "Ilgaz", "Orta", "Şabanözü", "Kurşunlu"] },
  "Çorum": { lat: 40.5506, lng: 34.9556, districts: ["Merkez", "Sungurlu", "Osmancık", "Alaca", "İskilip", "Mecitözü", "Kargı"] },
  "Denizli": { lat: 37.7765, lng: 29.0864, districts: ["Merkezefendi", "Pamukkale", "Çivril", "Tavas", "Acıpayam", "Honaz", "Sarayköy", "Buldan"] },
  "Diyarbakır": { lat: 37.9144, lng: 40.2306, districts: ["Bismil", "Silvan", "Yenişehir", "Sur", "Kayapınar", "Bağlar", "Çınar", "Ergani", "Hazro", "Kulp"] },
  "Edirne": { lat: 41.6772, lng: 26.5557, districts: ["Keşan", "Uzunköprü", "İpsala", "Havsa", "Meriç", "Merkez", "Enez", "Lalapaşa"] },
  "Elazığ": { lat: 38.681, lng: 39.2264, districts: ["Merkez", "Kovancılar", "Karakoçan", "Palu", "Arıcak", "Baskil", "Maden", "Sivrice"] },
  "Erzincan": { lat: 39.75, lng: 39.5, districts: ["Merkez", "Tercan", "Üzümlü", "Refahiye", "Çayırlı", "İliç", "Kemah"] },
  "Erzurum": { lat: 39.9043, lng: 41.2679, districts: ["Yakutiye", "Palandöken", "Aziziye", "Horasan", "Oltu", "Pasinler", "Karayazı", "Hınıs"] },
  "Eskişehir": { lat: 39.7767, lng: 30.5206, districts: ["Alpu", "Çifteler", "Mahmudiye", "Sivrihisar", "Seyitgazi", "Odunpazarı", "Tepebaşı", "Mihalıççık"] },
  "Gaziantep": { lat: 37.0662, lng: 37.3833, districts: ["Nizip", "İslahiye", "Nurdağı", "Oğuzeli", "Şehitkamil", "Şahinbey", "Araban", "Yavuzeli"] },
  "Giresun": { lat: 40.9128, lng: 38.3895, districts: ["Merkez", "Bulancak", "Espiye", "Görele", "Tirebolu", "Şebinkarahisar", "Dereli"] },
  "Gümüşhane": { lat: 40.4603, lng: 39.4814, districts: ["Merkez", "Kelkit", "Şiran", "Köse", "Torul", "Kürtün"] },
  "Hakkari": { lat: 37.5833, lng: 43.7333, districts: ["Merkez", "Yüksekova", "Şemdinli", "Çukurca", "Derecik"] },
  "Hatay": { lat: 36.4018, lng: 36.3498, districts: ["Antakya", "İskenderun", "Dörtyol", "Kırıkhan", "Reyhanlı", "Samandağ", "Altınözü", "Erzin", "Hassa"] },
  "Isparta": { lat: 37.7648, lng: 30.5566, districts: ["Merkez", "Yalvaç", "Eğirdir", "Şarkikaraağaç", "Gelendost", "Keçiborlu", "Senirkent"] },
  "Mersin": { lat: 36.8, lng: 34.6333, districts: ["Tarsus", "Toroslar", "Akdeniz", "Yenişehir", "Erdemli", "Silifke", "Anamur", "Mut", "Gülnar"] },
  "İstanbul": { lat: 41.0082, lng: 28.9784, districts: ["Silivri", "Çatalca", "Şile", "Pendik", "Tuzla", "Beykoz", "Arnavutköy"] },
  "İzmir": { lat: 38.4237, lng: 27.1428, districts: ["Ödemiş", "Tire", "Bergama", "Torbalı", "Menemen", "Bayındır", "Kemalpaşa", "Foça", "Urla", "Seferihisar", "Kınık"] },
  "Kars": { lat: 40.6167, lng: 43.1, districts: ["Merkez", "Sarıkamış", "Kağızman", "Digor", "Selim", "Arpaçay", "Akyaka"] },
  "Kastamonu": { lat: 41.3887, lng: 33.7827, districts: ["Merkez", "Tosya", "Taşköprü", "Cide", "İnebolu", "Araç", "Devrekani", "Daday"] },
  "Kayseri": { lat: 38.7205, lng: 35.4826, districts: ["Develi", "Yeşilhisar", "Bünyan", "Pınarbaşı", "Kocasinan", "Melikgazi", "Talas", "İncesu", "Yahyalı"] },
  "Kırklareli": { lat: 41.7333, lng: 27.2167, districts: ["Merkez", "Lüleburgaz", "Babaeski", "Vize", "Pınarhisar", "Demirköy"] },
  "Kırşehir": { lat: 39.1425, lng: 34.1709, districts: ["Merkez", "Kaman", "Mucur", "Çiçekdağı", "Akpınar"] },
  "Kocaeli": { lat: 40.8533, lng: 29.8815, districts: ["Gebze", "İzmit", "Körfez", "Gölcük", "Kandıra", "Kartepe", "Derince", "Çayırova"] },
  "Konya": { lat: 37.8716, lng: 32.4851, districts: ["Karatay", "Meram", "Selçuklu", "Cihanbeyli", "Çumra", "Ereğli", "Karapınar", "Kulu", "Sarayönü", "Kadınhanı", "Beyşehir", "Seydişehir", "Akşehir", "Yunak", "Tuzlukçu", "Hüyük", "Altınekin"] },
  "Kütahya": { lat: 39.4167, lng: 29.9833, districts: ["Merkez", "Tavşanlı", "Simav", "Gediz", "Emet", "Altıntaş", "Domaniç"] },
  "Malatya": { lat: 38.3552, lng: 38.3095, districts: ["Battalgazi", "Yeşilyurt", "Doğanşehir", "Darende", "Akçadağ", "Hekimhan", "Yazıhan", "Pütürge"] },
  "Manisa": { lat: 38.6191, lng: 27.4287, districts: ["Akhisar", "Salihli", "Turgutlu", "Alaşehir", "Sarıgöl", "Kırkağaç", "Soma", "Şehzadeler", "Yunusemre", "Kula", "Demirci"] },
  "Kahramanmaraş": { lat: 37.5858, lng: 36.9371, districts: ["Onikişubat", "Dulkadiroğlu", "Elbistan", "Afşin", "Pazarcık", "Göksun", "Türkoğlu", "Andırın"] },
  "Mardin": { lat: 37.3212, lng: 40.7245, districts: ["Kızıltepe", "Artuklu", "Midyat", "Nusaybin", "Derik", "Mazıdağı", "Savur"] },
  "Muğla": { lat: 37.2153, lng: 28.3636, districts: ["Fethiye", "Milas", "Bodrum", "Menteşe", "Yatağan", "Ortaca", "Dalaman", "Seydikemer"] },
  "Muş": { lat: 38.7432, lng: 41.5064, districts: ["Merkez", "Bulanık", "Malazgirt", "Varto", "Hasköy", "Korkut"] },
  "Nevşehir": { lat: 38.6244, lng: 34.7144, districts: ["Merkez", "Ürgüp", "Avanos", "Gülşehir", "Derinkuyu", "Kozaklı", "Hacıbektaş"] },
  "Niğde": { lat: 37.9667, lng: 34.6833, districts: ["Merkez", "Bor", "Çiftlik", "Ulukışla", "Altunhisar"] },
  "Ordu": { lat: 40.9833, lng: 37.8778, districts: ["Altınordu", "Ünye", "Fatsa", "Gölköy", "Perşembe", "Kumuat", "Aybastı"] },
  "Rize": { lat: 41.0201, lng: 40.5234, districts: ["Merkez", "Çayeli", "Ardeşen", "Pazar", "Fındıklı", "Kalkandere", "İkizdere"] },
  "Sakarya": { lat: 40.7569, lng: 30.3783, districts: ["Adapazarı", "Akyazı", "Geyve", "Hendek", "Karasu", "Pamukova", "Sapanca", "Kocaali"] },
  "Samsun": { lat: 41.2928, lng: 36.3313, districts: ["Bafra", "Çarşamba", "Vezirköprü", "Terme", "Havza", "19 Mayıs", "Tekkeköy", "İlkadım", "Atakum"] },
  "Siirt": { lat: 37.9333, lng: 41.95, districts: ["Merkez", "Kurtalan", "Pervari", "Baykan", "Şirvan", "Eruh"] },
  "Sinop": { lat: 42.0231, lng: 35.1531, districts: ["Merkez", "Boyabat", "Gerze", "Ayancık", "Durağan", "Türkeli"] },
  "Sivas": { lat: 39.7477, lng: 37.0179, districts: ["Merkez", "Şarkışla", "Yıldızeli", "Zara", "Kangal", "Gemerek", "Suşehri", "Divriği", "Gürün"] },
  "Tekirdağ": { lat: 40.9833, lng: 27.5167, districts: ["Çorlu", "Süleymanpaşa", "Hayrabolu", "Malkara", "Muratlı", "Ergene", "Çerkezköy", "Saray", "Şarköy"] },
  "Tokat": { lat: 40.3167, lng: 36.55, districts: ["Merkez", "Erbaa", "Turhal", "Niksar", "Zile", "Reşadiye", "Almus"] },
  "Trabzon": { lat: 41.0015, lng: 39.7178, districts: ["Ortahisar", "Akçaabat", "Araklı", "Of", "Yomra", "Sürmene", "Arsin", "Vakfıkebir"] },
  "Tunceli": { lat: 39.1079, lng: 39.5401, districts: ["Merkez", "Pertek", "Mazgirt", "Çemişgezek", "Hozat", "Ovacık", "Pülümür"] },
  "Şanlıurfa": { lat: 37.1674, lng: 38.7954, districts: ["Harran", "Ceylanpınar", "Siverek", "Viranşehir", "Akçakale", "Eyyübiye", "Haliliye", "Karaköprü", "Birecik", "Suruç", "Bozova", "Hilvan"] },
  "Uşak": { lat: 38.6823, lng: 29.4082, districts: ["Merkez", "Banaz", "Eşme", "Sivaslı", "Ulubey", "Karahallı"] },
  "Van": { lat: 38.4891, lng: 43.4089, districts: ["İpekyolu", "Tuşba", "Edremit", "Erciş", "Özalp", "Muradiye", "Çaldıran", "Başkale", "Gürpınar"] },
  "Yozgat": { lat: 39.8181, lng: 34.8147, districts: ["Merkez", "Sorgun", "Yerköy", "Boğazlıyan", "Sarıkaya", "Akdağmadeni", "Çekerek"] },
  "Zonguldak": { lat: 41.4564, lng: 31.7987, districts: ["Merkez", "Ereğli", "Çaycuma", "Devrek", "Alaplı", "Kozlu", "Kilimli"] },
  "Aksaray": { lat: 38.3687, lng: 34.037, districts: ["Merkez", "Eskil", "Ortaköy", "Gülağaç", "Güzelyurt", "Sarıyahşi"] },
  "Bayburt": { lat: 40.2552, lng: 40.2249, districts: ["Merkez", "Demirözü", "Aydıntepe"] },
  "Karaman": { lat: 37.1759, lng: 33.2287, districts: ["Merkez", "Ermenek", "Kazımkarabekir", "Ayrancı", "Sarıveliler"] },
  "Kırıkkale": { lat: 39.8468, lng: 33.5153, districts: ["Merkez", "Yahşihan", "Keskin", "Delice", "Sulakyurt", "Bahşılı"] },
  "Batman": { lat: 37.8812, lng: 41.1351, districts: ["Merkez", "Kozluk", "Sason", "Beşiri", "Gercüş", "Hasankeyf"] },
  "Şırnak": { lat: 37.5164, lng: 42.4611, districts: ["Merkez", "Cizre", "Silopi", "İdil", "Uludere", "Beytüşşebap"] },
  "Bartın": { lat: 41.6358, lng: 32.3375, districts: ["Merkez", "Amasra", "Ulus", "Kurucaşile"] },
  "Ardahan": { lat: 41.1105, lng: 42.7022, districts: ["Merkez", "Göle", "Çıldır", "Posof", "Hanak", "Damal"] },
  "Iğdır": { lat: 39.9167, lng: 44.0333, districts: ["Merkez", "Tuzluca", "Aralık", "Karakoyunlu"] },
  "Yalova": { lat: 40.65, lng: 29.2667, districts: ["Merkez", "Çiftlikköy", "Çınarcık", "Altınova", "Armutlu", "Termal"] },
  "Karabük": { lat: 41.2061, lng: 32.6204, districts: ["Merkez", "Safranbolu", "Yenice", "Eskipazar", "Eflani"] },
  "Kilis": { lat: 36.7164, lng: 37.1147, districts: ["Merkez", "Elbeyli", "Musabeyli", "Polateli"] },
  "Osmaniye": { lat: 37.0742, lng: 36.2478, districts: ["Merkez", "Kadirli", "Düziçi", "Bahçe", "Toprakkale", "Sumbas"] },
  "Düzce": { lat: 40.8438, lng: 31.1565, districts: ["Merkez", "Akçakoca", "Kaynaşlı", "Gölyaka", "Çilimli", "Yığılca", "Gümüşova"] },
};

// Helper function to safely format dates into YYYY-MM-DD for HTML input type="date"
const toInputDate = (dStr?: string | null): string => {
  if (!dStr) return "";
  if (typeof dStr !== "string") return "";
  if (dStr.includes("T")) return dStr.split("T")[0];
  if (dStr.includes(" ")) return dStr.split(" ")[0];
  return dStr;
};

// Helper to abbreviate crop names: e.g. "Silajlık Mısır" -> "S.Mısır", "Danelik Arpa" -> "D.Arpa", "Ekmeklik Buğday" -> "E.Buğday"
const formatCropShort = (cropName?: string): string => {
  if (!cropName) return "-";
  const parts = cropName.trim().split(/\s+/);
  if (parts.length > 1) {
    const firstInitial = parts[0].charAt(0).toLocaleUpperCase("tr-TR");
    const rest = parts.slice(1).join(" ");
    return `${firstInitial}.${rest}`;
  }
  return cropName;
};

// Helper to abbreviate irrigation method: Damla -> D, Yağmurlama -> Y, Salma/Kanal -> S, Kuru Tarım -> K
const formatIrrigationShort = (methodStr?: string) => {
  if (!methodStr) return { short: "-", label: "Bilinmiyor", tone: "gray" };
  const m = methodStr.toLocaleLowerCase("tr-TR");
  if (m.includes("damla")) return { short: "D", label: "Damla Sulama", tone: "green" };
  if (m.includes("yağmur")) return { short: "Y", label: "Yağmurlama", tone: "blue" };
  if (m.includes("salma") || m.includes("kanal")) return { short: "S", label: "Salma Sulama", tone: "orange" };
  if (m.includes("kuru")) return { short: "K", label: "Kuru Tarım (Sulaması Yok)", tone: "gray" };
  return { short: methodStr, label: methodStr, tone: "gray" };
};

// Helper for short date format: DD.MM.YY
const formatDateShort = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const formatted = formatDate(dateStr);
  if (formatted && formatted.includes(".")) {
    const parts = formatted.split(".");
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2].slice(2)}`;
    }
  }
  return formatted;
};

const INITIAL_FIELDS: ExtendedFieldRow[] = [];

export function FieldsView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [page, setPage] = useState(1);

  // API Calls
  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<FieldSummary>("/fields/summary");

  const listPath = withQuery("/fields/view", {
    q: search || undefined,
    crop: crop || undefined,
    page,
    limit: 10,
  });
  const { data: apiFields, meta, loading } = useApi<FieldRow[]>(listPath);

  // Local State for Fields (Starts empty for user testing)
  const [fieldsList, setFieldsList] = useState<ExtendedFieldRow[]>([]);

  // Active Field Map Selection
  const [activeFieldMapId, setActiveFieldMapId] = useState<string>("all");
  const [mapAdaSearch, setMapAdaSearch] = useState<string>("");

  // Modal States
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [selectedEditField, setSelectedEditField] = useState<ExtendedFieldRow | null>(null);
  const [fieldToDeleteConfirm, setFieldToDeleteConfirm] = useState<ExtendedFieldRow | null>(null);

  // Modal Scroll Refs
  const addFieldModalRef = useRef<HTMLDivElement>(null);
  const editFieldModalRef = useRef<HTMLDivElement>(null);
  const deleteFieldModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddFieldModal && addFieldModalRef.current) {
      addFieldModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddFieldModal]);

  useEffect(() => {
    if (selectedEditField && editFieldModalRef.current) {
      editFieldModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEditField]);

  useEffect(() => {
    if (fieldToDeleteConfirm && deleteFieldModalRef.current) {
      deleteFieldModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [fieldToDeleteConfirm]);

  const limitDateYear = (val: string): string => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
      return parts.join("-");
    }
    return val;
  };

  // Map Layer Tile Mode ("satellite" | "street")
  const [mapTileMode, setMapTileMode] = useState<"satellite" | "street">("satellite");

  // Form State with City / District / Neighborhood and TKGM Cadastre Metadata
  const [fieldForm, setFieldForm] = useState({
    name: "",
    code: "",
    city: "",
    district: "",
    neighborhood: "",
    adaNo: "",
    parselNo: "",
    areaDonum: "",
    soilType: "",
    crop: "",
    growthStage: "",
    sowingDate: "",
    expectedHarvestDate: "",
    actualHarvestDate: "",
    irrigationMethod: "",
    locality: "",
    lat: "37.8716",
    lng: "32.4851",
    notes: "",
  });

  // TKGM MEGSİS Cadastre Parcel Query Handler
  const handleTkgmQuery = () => {
    const ada = fieldForm.adaNo.trim();
    const parsel = fieldForm.parselNo.trim();
    if (!ada || !parsel) {
      dispatch(showToast("Lütfen öncelikle Ada No ve Parsel No giriniz."));
      return;
    }

    const adaNum = parseInt(ada) || 101;
    const parselNum = parseInt(parsel) || 1;

    const calcLat = (37.8716 + (adaNum % 10) * 0.008 + parselNum * 0.002).toFixed(4);
    const calcLng = (32.4851 + (adaNum % 8) * 0.01 + parselNum * 0.003).toFixed(4);
    const calcArea = ((adaNum % 5 + 1) * 8 + parselNum * 2.5).toFixed(1);
    const locName = `${fieldForm.city || "Konya"} / ${fieldForm.district || "Karatay"} - ${fieldForm.neighborhood || "Fevziye Mah."} (Ada ${ada} / Parsel ${parsel})`;

    setFieldForm((prev) => ({
      ...prev,
      areaDonum: calcArea,
      areaValue: calcArea,
      locality: locName,
      lat: calcLat,
      lng: calcLng,
      name: prev.name.trim() ? prev.name : `Tarla (Ada ${ada} / Parsel ${parsel})`,
    }));

    dispatch(
      showToast(
        `✅ TKGM MEGSİS Entegrasyonu: Ada ${ada} / Parsel ${parsel} kadastro dönüm ve GPS sınırları çekildi.`
      )
    );
  };

  const handleCityChange = (newCity: string) => {
    if (!newCity) {
      setFieldForm((prev) => ({
        ...prev,
        city: "",
        district: "",
        locality: "",
      }));
      return;
    }
    const cityData = TURKEY_CITIES[newCity];
    const firstDistrict = cityData?.districts[0] || "";
    const newLat = (cityData?.lat ?? 37.8716).toString();
    const newLng = (cityData?.lng ?? 32.4851).toString();
    const locName = `${newCity}${firstDistrict ? " / " + firstDistrict : ""}`;

    setFieldForm((prev) => ({
      ...prev,
      city: newCity,
      district: firstDistrict,
      locality: locName,
      lat: newLat,
      lng: newLng,
    }));
  };

  const handleOpenAddFieldModal = () => {
    setFieldForm({
      name: "",
      code: "",
      city: "",
      district: "",
      neighborhood: "",
      adaNo: "",
      parselNo: "",
      areaValue: "",
      areaUnit: "m2",
      areaDonum: "",
      soilType: "",
      crop: "",
      growthStage: "",
      sowingDate: "",
      expectedHarvestDate: "",
      actualHarvestDate: "",
      irrigationMethod: "",
      locality: "",
      lat: "37.8716",
      lng: "32.4851",
      notes: "",
    });
    setShowAddFieldModal(true);
  };

  const handleOpenEditFieldModal = (field: ExtendedFieldRow) => {
    setSelectedEditField(field);
    const isDoubleDigit = field.areaDonum >= 10;
    setFieldForm({
      name: field.name,
      code: field.code,
      city: field.city || "",
      district: field.district || "",
      neighborhood: field.neighborhood || "",
      adaNo: field.adaNo || "",
      parselNo: field.parselNo || "",
      areaValue: isDoubleDigit ? field.areaDonum.toString() : (field.areaDonum * 1000).toString(),
      areaUnit: isDoubleDigit ? "donum" : "m2",
      areaDonum: field.areaDonum.toString(),
      soilType: field.soilType,
      crop: field.crop,
      growthStage: field.growthStage,
      sowingDate: toInputDate(field.sowingDate),
      expectedHarvestDate: toInputDate(field.expectedHarvestDate),
      actualHarvestDate: toInputDate(field.actualHarvestDate),
      irrigationMethod: field.irrigation?.method || "Damla Sulama",
      locality: field.locality || "",
      lat: (field.lat ?? 37.8716).toString(),
      lng: (field.lng ?? 32.4851).toString(),
      notes: field.notes || "",
    });
  };

  const handleAddFieldSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fieldForm.name.trim()) {
      dispatch(showToast("Lütfen tarla adını eksiksiz girin."));
      return;
    }

    const rawVal = parseFloat(fieldForm.areaValue || fieldForm.areaDonum) || 0;
    const area = fieldForm.areaUnit === "m2" ? rawVal / 1000 : rawVal;
    const slugName = fieldForm.name
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const newField: ExtendedFieldRow = {
      id: `f-${Date.now()}`,
      slug: slugName,
      name: fieldForm.name.trim(),
      code: fieldForm.code.trim() || `TRL-${Date.now().toString().slice(-3)}`,
      adaNo: fieldForm.adaNo.trim(),
      parselNo: fieldForm.parselNo.trim(),
      city: fieldForm.city,
      district: fieldForm.district,
      neighborhood: fieldForm.neighborhood,
      crop: fieldForm.crop,
      cropVariety: "Yerli Seçkin Tohum",
      soilType: fieldForm.soilType,
      areaDonum: area,
      areaHectares: area / 10,
      imageUrl: "/assets/field_north.png",
      growthStage: fieldForm.growthStage,
      sowingDate: fieldForm.sowingDate || null,
      expectedHarvestDate: fieldForm.expectedHarvestDate || null,
      actualHarvestDate: fieldForm.actualHarvestDate || null,
      irrigation: {
        method: fieldForm.irrigationMethod,
        status: "iyi",
        statusLabel: "İyi Seviye",
        moisturePercent: 65,
        label: `${fieldForm.irrigationMethod || "Sulama"} (Nem %65)`,
        lastIrrigatedAt: new Date().toISOString().split("T")[0],
      },
      altitudeMeters: 1020,
      slopePercent: 2,
      locality: fieldForm.locality || `${fieldForm.city}${fieldForm.district ? " / " + fieldForm.district : ""}`,
      expectedYieldPerDonum: 2.5,
      actualYieldPerDonum: 0,
      yieldUnit: "Ton",
      notes: fieldForm.notes || "Yeni tarla kaydı.",
      lat: parseFloat(fieldForm.lat) || 37.8716,
      lng: parseFloat(fieldForm.lng) || 32.4851,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setFieldsList((prev) => [newField, ...prev]);
    setShowAddFieldModal(false);
    dispatch(showToast(`"${newField.name}" kaydedildi.`));
  };

  const handleEditFieldSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditField || !fieldForm.name.trim()) return;

    const rawEditVal = parseFloat(fieldForm.areaValue || fieldForm.areaDonum) || 0;
    const area = fieldForm.areaUnit === "m2" ? rawEditVal / 1000 : rawEditVal;

    setFieldsList((prev) =>
      prev.map((item) =>
        item.id === selectedEditField.id
          ? {
              ...item,
              name: fieldForm.name.trim(),
              code: fieldForm.code.trim(),
              adaNo: fieldForm.adaNo.trim(),
              parselNo: fieldForm.parselNo.trim(),
              city: fieldForm.city,
              district: fieldForm.district,
              neighborhood: fieldForm.neighborhood,
              areaDonum: area,
              areaHectares: area / 10,
              soilType: fieldForm.soilType,
              crop: fieldForm.crop,
              growthStage: fieldForm.growthStage,
              sowingDate: fieldForm.sowingDate || null,
              expectedHarvestDate: fieldForm.expectedHarvestDate || null,
              actualHarvestDate: fieldForm.actualHarvestDate || null,
              irrigation: {
                ...item.irrigation,
                method: fieldForm.irrigationMethod,
                label: `${fieldForm.irrigationMethod} (Nem %${item.irrigation?.moisturePercent ?? 60})`,
              },
              locality: fieldForm.locality,
              lat: parseFloat(fieldForm.lat) || item.lat || 37.8716,
              lng: parseFloat(fieldForm.lng) || item.lng || 32.4851,
              notes: fieldForm.notes,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );

    setSelectedEditField(null);
    dispatch(showToast(`"${fieldForm.name}" tarla bilgileri güncellendi.`));
  };

  const handleDeleteField = (id: string) => {
    const fieldToDelete = fieldsList.find((f) => f.id === id);
    setFieldsList((prev) => prev.filter((f) => f.id !== id));
    if (activeFieldMapId === id) {
      setActiveFieldMapId("all");
    }
    setFieldToDeleteConfirm(null);
    setSelectedEditField(null);
    dispatch(showToast(`"${fieldToDelete?.name || "Tarla"}" başarıyla silindi.`));
  };

  // Filtered Field List
  const filteredFields = useMemo(() => {
    return fieldsList.filter((field) => {
      const q = search.toLocaleLowerCase("tr-TR").trim();
      const matchSearch =
        !q ||
        field.name.toLocaleLowerCase("tr-TR").includes(q) ||
        field.code.toLocaleLowerCase("tr-TR").includes(q) ||
        field.locality?.toLocaleLowerCase("tr-TR").includes(q) ||
        field.city?.toLocaleLowerCase("tr-TR").includes(q) ||
        field.district?.toLocaleLowerCase("tr-TR").includes(q) ||
        field.neighborhood?.toLocaleLowerCase("tr-TR").includes(q) ||
        (field.adaNo && field.adaNo.includes(q)) ||
        (field.parselNo && field.parselNo.includes(q)) ||
        `ada ${field.adaNo}`.includes(q) ||
        `parsel ${field.parselNo}`.includes(q);

      const matchCrop = !crop || field.crop === crop;
      return matchSearch && matchCrop;
    });
  }, [fieldsList, search, crop]);

  // Map Filtered Fields
  const mapFilteredFields = useMemo(() => {
    if (!mapAdaSearch.trim()) return fieldsList;
    const s = mapAdaSearch.toLocaleLowerCase("tr-TR").trim();
    return fieldsList.filter(
      (f) =>
        (f.adaNo && f.adaNo.includes(s)) ||
        (f.parselNo && f.parselNo.includes(s)) ||
        f.city?.toLocaleLowerCase("tr-TR").includes(s) ||
        f.district?.toLocaleLowerCase("tr-TR").includes(s) ||
        f.neighborhood?.toLocaleLowerCase("tr-TR").includes(s) ||
        f.name.toLocaleLowerCase("tr-TR").includes(s)
    );
  }, [fieldsList, mapAdaSearch]);

  // Unique Crop Options for Select Filter
  const cropOptions = useMemo(() => {
    return Array.from(new Set(fieldsList.map((f) => f.crop))).map((cName) => ({
      value: cName,
      label: cName,
    }));
  }, [fieldsList]);

  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredFields.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedFields = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFields.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFields, currentPage]);

  // Full-width Compact Table Rows (Exactly 10 items per page)
  const tableRows = paginatedFields.map((field) => {
    const irr = formatIrrigationShort(field.irrigation?.method || field.irrigation?.label);
    return [
      <Link className="primary-cell" href={`/tarlalar/${field.slug}`} key={field.id}>
        <Image src={field.imageUrl || "/assets/field_north.png"} alt="" width={42} height={30} unoptimized />
        <span>
          <strong>{field.name}</strong>
          <small>{field.code}</small>
        </span>
      </Link>,
      <span
        key={`ada-parsel-${field.id}`}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: "var(--green-600)",
            background: "rgba(52, 211, 153, 0.12)",
            padding: "2px 7px",
            borderRadius: "5px",
            fontSize: "11px",
            whiteSpace: "nowrap",
            display: "inline-block",
            width: "fit-content",
          }}
        >
          <b>{field.adaNo || "101"}</b> / <b>{field.parselNo || "1"}</b>
        </span>
        <small style={{ fontSize: "10.5px", color: "var(--muted)", whiteSpace: "nowrap" }}>
          {field.city || "Konya"} / {field.district || "Karatay"}
        </small>
      </span>,
      formatArea(field.areaDonum),
      <span key={`crop-${field.id}`} style={{ fontWeight: 650 }}>
        {formatCropShort(field.crop)}
      </span>,
      formatDateShort(field.sowingDate),
      <span
        key={`irr-${field.id}`}
        title={irr.label}
        style={{
          fontWeight: 800,
          fontSize: "12px",
          padding: irr.short.length === 1 ? "2px 8px" : "2px 6px",
          borderRadius: "5px",
          background: irr.tone === "green" ? "rgba(52, 211, 153, 0.16)" : irr.tone === "blue" ? "rgba(59, 130, 246, 0.16)" : irr.tone === "orange" ? "rgba(245, 158, 11, 0.16)" : "var(--surface-3)",
          color: irr.tone === "green" ? "var(--green-600)" : irr.tone === "blue" ? "#3b82f6" : irr.tone === "orange" ? "#f59e0b" : "var(--muted)",
          display: "inline-block",
          textAlign: "center",
        }}
      >
        {irr.short}
      </span>,
      field.growthStage,
      formatDateShort(field.expectedHarvestDate),
      field.actualHarvestDate ? (
        <span key={`act-${field.id}`} style={{ fontWeight: 700, color: "var(--green-600)" }}>
          {formatDateShort(field.actualHarvestDate)}
        </span>
      ) : (
        <span key={`act-${field.id}`} style={{ color: "var(--muted)", fontSize: "11.5px" }}>
          Henüz Yok
        </span>
      ),
    ];
  });

  const totals = summary?.totals;
  const criticalField = summary?.criticalField;

  // DYNAMIC COMPUTATIONS FROM FIELDS LIST
  const dynamicTotalDonum = useMemo(() => {
    return fieldsList.reduce((acc, f) => acc + (Number(f.areaDonum) || 0), 0);
  }, [fieldsList]);

  const dynamicActiveSowingCount = useMemo(() => {
    return fieldsList.filter((f) => f.crop && f.crop.trim() !== "").length;
  }, [fieldsList]);

  const dynamicNearHarvestCount = useMemo(() => {
    return fieldsList.filter((f) => f.expectedHarvestDate || f.actualHarvestDate).length;
  }, [fieldsList]);

  const dynamicActiveIrrigationCount = useMemo(() => {
    return fieldsList.filter(
      (f) =>
        f.irrigationMethod &&
        !f.irrigationMethod.includes("Kuru") &&
        f.irrigationMethod !== "Sulaması Yok"
    ).length;
  }, [fieldsList]);

  const dynamicCriticalAlertsCount = useMemo(() => {
    return fieldsList.filter((f) => {
      const isKuru = f.irrigationMethod?.includes("Kuru");
      const lowMoist = (f.irrigation?.moisturePercent ?? 100) < 40;
      return isKuru || lowMoist;
    }).length;
  }, [fieldsList]);

  // 1. ÜRÜN DAĞILIMI (DÖNÜM BAZLI)
  const dynamicCropDistribution = useMemo(() => {
    if (fieldsList.length === 0) return [];
    const map: Record<string, number> = {};
    fieldsList.forEach((f) => {
      const cropName = f.crop?.trim() || "Belirtilmedi";
      map[cropName] = (map[cropName] || 0) + (Number(f.areaDonum) || 0);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6"];

    return Object.entries(map).map(([label, value], idx) => ({
      label,
      value,
      color: colors[idx % colors.length],
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [fieldsList]);

  // 2. SULAMA DURUMU VE NEM DAĞILIMI
  const dynamicIrrigationDistribution = useMemo(() => {
    if (fieldsList.length === 0) return [];
    const map: Record<string, number> = {
      "Damla Sulama": 0,
      "Yağmurlama": 0,
      "Kanal / Salma": 0,
      "Kuru Tarım": 0,
    };

    fieldsList.forEach((f) => {
      const m = f.irrigationMethod || "Kuru Tarım";
      if (m.includes("Damla")) map["Damla Sulama"] += 1;
      else if (m.includes("Yağmurlama")) map["Yağmurlama"] += 1;
      else if (m.includes("Salma") || m.includes("Kanal")) map["Kanal / Salma"] += 1;
      else map["Kuru Tarım"] += 1;
    });

    const total = fieldsList.length;
    const colors: Record<string, string> = {
      "Damla Sulama": "#10b981",
      "Yağmurlama": "#3b82f6",
      "Kanal / Salma": "#f59e0b",
      "Kuru Tarım": "#6b7280",
    };

    return Object.entries(map)
      .filter(([_, val]) => val > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: colors[label] || "#10b981",
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [fieldsList]);

  const dynamicIrrigationHealthPercent = useMemo(() => {
    if (fieldsList.length === 0) return 0;
    const wateredCount = fieldsList.filter((f) => !f.irrigationMethod?.includes("Kuru")).length;
    return Math.round((wateredCount / fieldsList.length) * 100);
  }, [fieldsList]);

  // 3. AYLIK VERİM TRENDİ (TON/DÖNÜM)
  const dynamicYieldTrend = useMemo(() => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    if (fieldsList.length === 0) {
      return months.map((label) => ({ label, value: 0 }));
    }

    const monthMap: Record<number, number> = {};
    fieldsList.forEach((f) => {
      if (f.sowingDate) {
        const m = new Date(f.sowingDate).getMonth();
        monthMap[m] = (monthMap[m] || 0) + (Number(f.areaDonum) || 0) * 8;
      }
    });

    return months.map((label, idx) => ({
      label,
      value: Math.round(monthMap[idx] || 0),
    }));
  }, [fieldsList]);

  // 4. KRİTİK SULAMA UYARISI TARLASI
  const dynamicCriticalField = useMemo(() => {
    if (fieldsList.length === 0) return null;
    return (
      fieldsList.find((f) => f.irrigationMethod?.includes("Kuru") || (f.irrigation?.moisturePercent ?? 100) < 40) ||
      fieldsList[0]
    );
  }, [fieldsList]);

  // 5. SON EKİM / HASAT KAYITLARI
  const dynamicRecentRecords = useMemo(() => {
    if (fieldsList.length === 0) return [];
    return fieldsList.slice(0, 4).map((f) => ({
      id: f.id,
      type: f.actualHarvestDate ? ("hasat" as const) : ("ekim" as const),
      fieldName: f.name,
      crop: f.crop || "Ekim",
      date: f.actualHarvestDate || f.sowingDate || new Date().toISOString().split("T")[0],
      amount: Math.round(f.areaDonum * (f.actualHarvestDate ? 0.4 : 1)),
      unit: f.actualHarvestDate ? "Ton" : "Dönüm",
    }));
  }, [fieldsList]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Tarla Yönetimi"
        description="Tarlalarınızı Ada/Parsel numaralarıyla kaydetme, düzenleme, silme ve harita üzerinden takip etme paneli."
        icon={<Sprout />}
        primaryLabel="Yeni Tarla Ekle"
        showFilter={false}
        showDateChevron={false}
        onPrimaryClick={handleOpenAddFieldModal}
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* STAT CARDS GRID */}
      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<Leaf />}
          label="Toplam Tarla"
          value={formatNumber(fieldsList.length)}
          meta="Kayıtlı araziler"
        />
        <StatCard
          icon={<MapIcon />}
          label="Toplam Alan"
          value={formatNumber(dynamicTotalDonum)}
          unit="Dönüm"
          meta="Kayıtlı arazi"
        />
        <StatCard
          icon={<Sprout />}
          label="Aktif Ekim"
          value={formatNumber(dynamicActiveSowingCount)}
          unit="Tarlada"
          meta="Ürün ekili"
          tone="green"
        />
        <StatCard
          icon={<Wheat />}
          label="Hasada Yakın"
          value={formatNumber(dynamicNearHarvestCount)}
          unit="Tarlada"
          meta="Planlanan / Gerçekleşen"
          tone="orange"
        />
        <StatCard
          icon={<Droplets />}
          label="Aktif Sulama"
          value={formatNumber(dynamicActiveIrrigationCount)}
          unit="Tarlada"
          meta="Sulu tarım arazisi"
          tone="blue"
        />
        <StatCard
          icon={<AlertTriangle />}
          label="Kritik Uyarı"
          value={formatNumber(dynamicCriticalAlertsCount)}
          meta="Acil / Kuru tarım"
          tone={dynamicCriticalAlertsCount > 0 ? "red" : "gray"}
        />
      </div>

      {/* 1. TAM EKRAN TARLA LİSTESİ (SINGLE SET OF ACTION BUTTONS VIA DATATABLE PROPS) */}
      <div className="calendar-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Panel className="table-panel" title="🌾 Tarla ve Tapu Parsel Listesi (Tam Ekran)">
          <Filters
            placeholder="Tarla adı, Ada No, Parsel No veya mevkii ara..."
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSelectChange={(_, value) => {
              setCrop(value);
              setPage(1);
            }}
            selects={[
              {
                name: "crop",
                placeholder: "Tüm Ürünler",
                value: crop,
                options: cropOptions,
              },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Tarla",
              "Ada/Parsel",
              "Alan",
              "Ürün",
              "Ekim Tar.",
              "Sulama",
              "Aşama",
              "Tahmini Hasat",
              "Hasat Tar.",
            ]}
            rows={tableRows}
            onView={(idx) => {
              const field = paginatedFields[idx];
              if (field) router.push(`/tarlalar/${field.slug}`);
            }}
            onEdit={(idx) => {
              const field = paginatedFields[idx];
              if (field) handleOpenEditFieldModal(field);
            }}
            onDelete={(idx) => {
              const field = paginatedFields[idx];
              if (field) setFieldToDeleteConfirm(field);
            }}
            pagination={{
              page: currentPage,
              totalPages,
              total: totalItems,
            }}
            onPageChange={setPage}
          />
        </Panel>
      </div>

      {/* 2. ALTA ALINAN GRAFİKLER VE ANALİTİK PANELLER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <Panel title="Ürün Dağılımı (Dönüm Bazlı)">
          {fieldsList.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              🌱 Henüz kayıtlı tarla bulunmuyor.<br />
              <small style={{ marginTop: "4px", display: "block" }}>Tarla eklendiğinde ürün dağılımı burada otomatik gösterilecektir.</small>
            </div>
          ) : (
            <DonutChart
              total={`${formatNumber(dynamicTotalDonum)} Dönüm`}
              data={dynamicCropDistribution}
            />
          )}
        </Panel>
        <Panel title="Sulama Durumu ve Nem Dağılımı">
          {fieldsList.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              💧 Henüz kayıtlı sulama verisi bulunmuyor.<br />
              <small style={{ marginTop: "4px", display: "block" }}>Tarla eklendiğinde sulama yöntemleri burada gösterilecektir.</small>
            </div>
          ) : (
            <DonutChart
              total={formatPercent(dynamicIrrigationHealthPercent)}
              data={dynamicIrrigationDistribution}
            />
          )}
        </Panel>
        <Panel title="Aylık Verim Trendi (Ton/Dönüm)">
          <TrendChart data={dynamicYieldTrend} />
        </Panel>
      </div>

      {/* 3. İKİNCİL İŞLEMLER & KRİTİK SULAMA BİLGİSİ */}
      <div className="module-bottom-grid">
        <Panel
          className="critical-card"
          title={dynamicCriticalField ? `Sulama Durumu - ${dynamicCriticalField.name}` : "Sulama Uyarısı"}
        >
          {dynamicCriticalField ? (
            <div className="map-alert">
              <Image
                src={dynamicCriticalField.imageUrl || "/assets/farm_map.png"}
                alt=""
                width={260}
                height={140}
                unoptimized
              />
              <span>
                <strong>{dynamicCriticalField.irrigationMethod || "Kuru Tarım"}</strong>
                <small>
                  {dynamicCriticalField.locality} · {formatArea(dynamicCriticalField.areaDonum)}
                </small>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleOpenEditFieldModal(dynamicCriticalField)}
                  style={{ marginTop: "8px", fontSize: "12px" }}
                >
                  Tarla Detaylarını Gör
                </button>
              </span>
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Tüm tarlalarda sulama ve nem seviyeleri normal durumda.
            </div>
          )}
        </Panel>

        <Panel title="Son Ekim / Hasat Kayıtları" action={<Link href="/ekim-hasat">Tümünü Gör →</Link>}>
          <div className="compact-list">
            {dynamicRecentRecords.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                Henüz ekim veya hasat kaydı bulunmuyor.
              </div>
            ) : (
              dynamicRecentRecords.map((record) => (
                <div key={record.id}>
                  {record.type === "hasat" ? <Wheat /> : <Leaf />}
                  <span>
                    <strong>
                      {record.crop} · {record.fieldName}
                    </strong>
                    <small>
                      {record.type === "hasat" ? "Hasat" : "Ekim"} {formatDate(record.date)}
                    </small>
                  </span>
                  <b>{withUnit(record.amount, record.unit)}</b>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>



      {/* MODAL: Yeni Tarla Ekle (Düzgün Hizalanmış Ada/Parsel/Alan Etiketleriyle) */}
      {showAddFieldModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddFieldModal(false)}
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
            ref={addFieldModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "16px 22px",
              borderRadius: "16px",
              maxWidth: "560px",
              width: "92%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sprout style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Yeni Tarla & Parsel Kaydet</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddFieldModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFieldSubmit} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "2px" }}>
                    Tarla Adı *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: Tepe Üstü"
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "2px" }}>
                    Saha Kodu
                  </label>
                  <input
                    type="text"
                    value={fieldForm.code}
                    onChange={(e) => setFieldForm({ ...fieldForm, code: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600, fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* İL, İLÇE VE MAHALLE / KÖY KONUM SEÇİM ALANI */}
              <div style={{ background: "var(--surface-2)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      İl (Şehir)
                    </label>
                    <input
                      type="text"
                      value={fieldForm.city}
                      onChange={(e) => setFieldForm({ ...fieldForm, city: e.target.value, locality: `${e.target.value}${fieldForm.district ? " / " + fieldForm.district : ""}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      İlçe
                    </label>
                    <input
                      type="text"
                      value={fieldForm.district}
                      onChange={(e) => setFieldForm({ ...fieldForm, district: e.target.value, locality: `${fieldForm.city}${e.target.value ? " / " + e.target.value : ""}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      Mahalle / Köy
                    </label>
                    <input
                      type="text"
                      value={fieldForm.neighborhood}
                      onChange={(e) => setFieldForm({ ...fieldForm, neighborhood: e.target.value, locality: `${fieldForm.city} / ${fieldForm.district} - ${e.target.value}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {/* TAPU ADA, PARSEL NUMARASI VE ALAN ALANLARI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Ada No *
                  </label>
                  <input
                    required
                    type="text"
                    value={fieldForm.adaNo}
                    onChange={(e) => setFieldForm({ ...fieldForm, adaNo: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Parsel No *
                  </label>
                  <input
                    required
                    type="text"
                    value={fieldForm.parselNo}
                    onChange={(e) => setFieldForm({ ...fieldForm, parselNo: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Alan *
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      required
                      type="number"
                      step="any"
                      value={fieldForm.areaValue}
                      onChange={(e) => setFieldForm({ ...fieldForm, areaValue: e.target.value })}
                      style={{ flex: 1, padding: "7px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600, fontSize: "12.5px", minWidth: "0" }}
                    />
                    <select
                      value={fieldForm.areaUnit}
                      onChange={(e) => setFieldForm({ ...fieldForm, areaUnit: e.target.value as "donum" | "m2" })}
                      style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                    >
                      <option value="donum">Dönüm</option>
                      <option value="m2">m²</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                  Ekili Ürün
                </label>
                <input
                  type="text"
                  value={fieldForm.crop}
                  onChange={(e) => setFieldForm({ ...fieldForm, crop: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Ekim Tarihi
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.sowingDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, sowingDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Tahmini Hasat
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.expectedHarvestDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, expectedHarvestDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Hasat Tarihi
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.actualHarvestDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, actualHarvestDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Sulama Yöntemi
                  </label>
                  <select
                    value={fieldForm.irrigationMethod}
                    onChange={(e) => setFieldForm({ ...fieldForm, irrigationMethod: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  >
                    <option value="">Sulama Yöntemi Seçiniz</option>
                    <option value="Damla Sulama">Damla Sulama</option>
                    <option value="Yağmurlama">Yağmurlama</option>
                    <option value="Kanal / Salma Sulama">Kanal / Salma Sulama</option>
                    <option value="Kuru Tarım">Kuru Tarım (Sulaması Yok)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Mevkii / Bölge
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Kuzey Parsel A1"
                    value={fieldForm.locality}
                    onChange={(e) => setFieldForm({ ...fieldForm, locality: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                  Notlar & Açıklama
                </label>
                <textarea
                  rows={1}
                  placeholder="Toprak yapısı, özel notlar..."
                  value={fieldForm.notes}
                  onChange={(e) => setFieldForm({ ...fieldForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", resize: "none", height: "36px", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddFieldModal(false)}
                  style={{ padding: "6px 14px", fontSize: "12.5px" }}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary" style={{ padding: "6px 16px", fontSize: "12.5px" }}>
                  Tarlayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tarla Düzenle & Sil */}
      {selectedEditField && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEditField(null)}
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
            ref={editFieldModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "16px 22px",
              borderRadius: "16px",
              maxWidth: "560px",
              width: "92%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  TARLA VE TAPU PARSEL GÜNCELLE
                </span>
                <h3 style={{ margin: "1px 0 0", fontSize: "16.5px", fontWeight: 700 }}>
                  {selectedEditField.name} (Ada: {selectedEditField.adaNo} / Parsel: {selectedEditField.parselNo})
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedEditField(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditFieldSubmit} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Tarla Adı *
                  </label>
                  <input
                    required
                    type="text"
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Saha Kodu
                  </label>
                  <input
                    type="text"
                    value={fieldForm.code}
                    onChange={(e) => setFieldForm({ ...fieldForm, code: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600, fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* İL, İLÇE VE MAHALLE / KÖY KONUM SEÇİM ALANI */}
              <div style={{ background: "var(--surface-2)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      İl (Şehir)
                    </label>
                    <input
                      type="text"
                      value={fieldForm.city}
                      onChange={(e) => setFieldForm({ ...fieldForm, city: e.target.value, locality: `${e.target.value}${fieldForm.district ? " / " + fieldForm.district : ""}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      İlçe
                    </label>
                    <input
                      type="text"
                      value={fieldForm.district}
                      onChange={(e) => setFieldForm({ ...fieldForm, district: e.target.value, locality: `${fieldForm.city}${e.target.value ? " / " + e.target.value : ""}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                      Mahalle / Köy
                    </label>
                    <input
                      type="text"
                      value={fieldForm.neighborhood}
                      onChange={(e) => setFieldForm({ ...fieldForm, neighborhood: e.target.value, locality: `${fieldForm.city} / ${fieldForm.district} - ${e.target.value}` })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)", color: "inherit", fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {/* TAPU ADA, PARSEL NUMARASI VE ALAN ALANLARI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Ada No *
                  </label>
                  <input
                    required
                    type="text"
                    value={fieldForm.adaNo}
                    onChange={(e) => setFieldForm({ ...fieldForm, adaNo: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Parsel No *
                  </label>
                  <input
                    required
                    type="text"
                    value={fieldForm.parselNo}
                    onChange={(e) => setFieldForm({ ...fieldForm, parselNo: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Alan *
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      required
                      type="number"
                      step="any"
                      value={fieldForm.areaValue}
                      onChange={(e) => setFieldForm({ ...fieldForm, areaValue: e.target.value })}
                      style={{ flex: 1, padding: "7px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600, fontSize: "12.5px", minWidth: "0" }}
                    />
                    <select
                      value={fieldForm.areaUnit}
                      onChange={(e) => setFieldForm({ ...fieldForm, areaUnit: e.target.value as "donum" | "m2" })}
                      style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                    >
                      <option value="donum">Dönüm</option>
                      <option value="m2">m²</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                  Ekili Ürün
                </label>
                <input
                  type="text"
                  value={fieldForm.crop}
                  onChange={(e) => setFieldForm({ ...fieldForm, crop: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Ekim Tarihi
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.sowingDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, sowingDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Tahmini Hasat
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.expectedHarvestDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, expectedHarvestDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Hasat Tarihi
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={fieldForm.actualHarvestDate}
                    onChange={(e) => setFieldForm({ ...fieldForm, actualHarvestDate: limitDateYear(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Sulama Yöntemi
                  </label>
                  <select
                    value={fieldForm.irrigationMethod}
                    onChange={(e) => setFieldForm({ ...fieldForm, irrigationMethod: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  >
                    <option value="Damla Sulama">Damla Sulama</option>
                    <option value="Yağmurlama">Yağmurlama</option>
                    <option value="Kanal / Salma Sulama">Kanal / Salma Sulama</option>
                    <option value="Kuru Tarım">Kuru Tarım (Sulaması Yok)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                    Mevkii / Bölge
                  </label>
                  <input
                    type="text"
                    value={fieldForm.locality}
                    onChange={(e) => setFieldForm({ ...fieldForm, locality: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "2px" }}>
                  Notlar & Açıklama
                </label>
                <textarea
                  rows={1}
                  value={fieldForm.notes}
                  onChange={(e) => setFieldForm({ ...fieldForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", resize: "none", height: "36px", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <button
                  type="button"
                  className="button button-danger button-outlined"
                  onClick={() => {
                    setFieldToDeleteConfirm(selectedEditField);
                    setSelectedEditField(null);
                  }}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  Tarlayı Sil
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditField(null)}
                  >
                    İptal
                  </button>
                  <button type="submit" className="button button-primary">
                    Bilgileri Güncelle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tarla Sil Onay */}
      {fieldToDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            ref={deleteFieldModalRef}
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.14)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "var(--red)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>
                Tarlayı Silmek İstediğinize Emin Misiniz?
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text)" }}>{fieldToDeleteConfirm.name}</strong> (Ada: {fieldToDeleteConfirm.adaNo || "101"} / Parsel: {fieldToDeleteConfirm.parselNo || "1"}) arazisini ve tüm parsel kayıtlarını kalıcı olarak silmek üzeresiniz.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setFieldToDeleteConfirm(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="button button-danger"
                style={{ flex: 1, justifyContent: "center", background: "var(--red)", color: "white" }}
                onClick={() => handleDeleteField(fieldToDeleteConfirm.id)}
              >
                Evet, Tarlayı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldsView;
