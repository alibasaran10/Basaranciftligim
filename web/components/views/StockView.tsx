"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Eye,
  Info,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DonutChart, TrendChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatDate, formatDecimal, formatNumber, withUnit } from "@/lib/format";
import type { StockMovementRow, StockRow, StockSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";



type WarehouseItem = {
  id: string;
  name: string;
  capacity: number;
  currentAmount: number;
  unit: string;
  value: number; // doluluk %
};

const ALL_DEFAULT_CATEGORIES = [
  { value: "kaba_yem", label: "Kaba Yem" },
  { value: "silaj", label: "Silaj" },
  { value: "tahil", label: "Tahıl" },
  { value: "gubre", label: "Gübre & İlaç" },
  { value: "yakit", label: "Yakıt & Enerji" },
  { value: "diger", label: "Diğer" },
];

function getCategoryLabel(catKey: string): string {
  switch (catKey) {
    case "kaba_yem":
      return "Kaba Yem";
    case "silaj":
      return "Silaj";
    case "tahil":
      return "Tahıl";
    case "gubre":
      return "Gübre & İlaç";
    case "yakit":
      return "Yakıt & Enerji";
    case "diger":
      return "Diğer";
    default:
      return "Genel";
  }
}

const INITIAL_STOCK_ITEMS: StockRow[] = [
  {
    id: "stk-1",
    name: "Silajlık Mısır",
    category: "silaj",
    categoryLabel: "Silaj",
    warehouse: "Silo 1 (Ana Silo)",
    quantity: 420,
    minLevel: 100,
    unit: "Ton",
    lastIn: "15.08.2026",
    lastInAt: "2026-08-15",
    lastOut: "18.08.2026",
    lastOutAt: "2026-08-18",
    level: "normal",
    levelLabel: "Yeterli Seviye",
  },
  {
    id: "stk-2",
    name: "Yonca Balyası (2. Biçim)",
    category: "kaba_yem",
    categoryLabel: "Kaba Yem",
    warehouse: "Hangar B Samanlık",
    quantity: 85,
    minLevel: 30,
    unit: "Ton",
    lastIn: "10.08.2026",
    lastInAt: "2026-08-10",
    lastOut: "17.08.2026",
    lastOutAt: "2026-08-17",
    level: "normal",
    levelLabel: "Yeterli Seviye",
  },
  {
    id: "stk-3",
    name: "Fabrika Süt Yemi (%18 Protein)",
    category: "kaba_yem",
    categoryLabel: "Kaba Yem",
    warehouse: "Yem Deposu 1",
    quantity: 12,
    minLevel: 25,
    unit: "Ton",
    lastIn: "05.08.2026",
    lastInAt: "2026-08-05",
    lastOut: "19.08.2026",
    lastOutAt: "2026-08-19",
    level: "kritik",
    levelLabel: "Kritik Seviye",
  },
  {
    id: "stk-4",
    name: "Danelik Arpa",
    category: "tahil",
    categoryLabel: "Tahıl",
    warehouse: "Silo 2 (Tahıl Silosu)",
    quantity: 160,
    minLevel: 50,
    unit: "Ton",
    lastIn: "12.08.2026",
    lastInAt: "2026-08-12",
    lastOut: "16.08.2026",
    lastOutAt: "2026-08-16",
    level: "normal",
    levelLabel: "Yeterli Seviye",
  },
  {
    id: "stk-5",
    name: "Dizel Motorin (Traktör)",
    category: "yakit",
    categoryLabel: "Yakıt & Enerji",
    warehouse: "Kimyasal Depo 1",
    quantity: 4500,
    minLevel: 1000,
    unit: "Litre",
    lastIn: "01.08.2026",
    lastInAt: "2026-08-01",
    lastOut: "14.08.2026",
    lastOutAt: "2026-08-14",
    level: "normal",
    levelLabel: "Yeterli Seviye",
  },
];

const INITIAL_WAREHOUSES: WarehouseItem[] = [
  { id: "wh-1", name: "Silo 1 (Ana Silo)", capacity: 600, currentAmount: 420, unit: "Ton", value: 70 },
  { id: "wh-2", name: "Silo 2 (Tahıl Silosu)", capacity: 300, currentAmount: 160, unit: "Ton", value: 53 },
  { id: "wh-3", name: "Yem Deposu 1", capacity: 50, currentAmount: 12, unit: "Ton", value: 24 },
  { id: "wh-4", name: "Hangar B Samanlık", capacity: 150, currentAmount: 85, unit: "Ton", value: 57 },
  { id: "wh-5", name: "Kimyasal Depo 1", capacity: 10000, currentAmount: 4500, unit: "Litre", value: 45 },
];

export function StockView() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  // API Calls
  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<StockSummary>("/stock/summary");

  const { data: apiItems, meta, loading } = useApi<StockRow[]>(
    withQuery("/stock", {
      q: search || undefined,
      category: filters.category,
      warehouse: filters.warehouse,
      page,
      limit: 10,
    }),
  );

  const { data: movementsData } = useApi<StockMovementRow[]>("/stock/movements?limit=5");

  // Local States (Dynamic Additions / Edits)
  const [stockItems, setStockItems] = useState<StockRow[]>(INITIAL_STOCK_ITEMS);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(INITIAL_WAREHOUSES);
  const [movementsList, setMovementsList] = useState<StockMovementRow[]>([]);

  // Update local state when API responds (Merge with existing items so categories/items aren't lost on filter)
  useEffect(() => {
    if (apiItems && apiItems.length > 0) {
      setStockItems((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        apiItems.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });
    }
  }, [apiItems]);

  useEffect(() => {
    if (movementsData && movementsData.length > 0) {
      setMovementsList(movementsData);
    }
  }, [movementsData]);

  // Modal States
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedViewStockItem, setSelectedViewStockItem] = useState<StockRow | null>(null);
  const [selectedEditStockItem, setSelectedEditStockItem] = useState<StockRow | null>(null);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [selectedEditWarehouse, setSelectedEditWarehouse] = useState<WarehouseItem | null>(null);

  // Smooth Scroll Refs
  const addMovementModalRef = useRef<HTMLDivElement>(null);
  const addStockModalRef = useRef<HTMLDivElement>(null);
  const viewStockModalRef = useRef<HTMLDivElement>(null);
  const editStockModalRef = useRef<HTMLDivElement>(null);
  const addWarehouseModalRef = useRef<HTMLDivElement>(null);
  const editWarehouseModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddMovementModal && addMovementModalRef.current) {
      addMovementModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddMovementModal]);

  useEffect(() => {
    if (showAddStockModal && addStockModalRef.current) {
      addStockModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddStockModal]);

  useEffect(() => {
    if (selectedViewStockItem && viewStockModalRef.current) {
      viewStockModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedViewStockItem]);

  useEffect(() => {
    if (selectedEditStockItem && editStockModalRef.current) {
      editStockModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEditStockItem]);

  useEffect(() => {
    if (showAddWarehouseModal && addWarehouseModalRef.current) {
      addWarehouseModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddWarehouseModal]);

  useEffect(() => {
    if (selectedEditWarehouse && editWarehouseModalRef.current) {
      editWarehouseModalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEditWarehouse]);

  // Forms State
  const [movementForm, setMovementForm] = useState({
    direction: "giris" as "giris" | "cikis",
    itemName: "",
    warehouse: "Silo 1 (Ana Silo)",
    amount: "",
    unit: "Ton",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [stockItemForm, setStockItemForm] = useState({
    id: "",
    name: "",
    category: "silaj",
    categoryLabel: "Silaj & Yem",
    warehouse: "Silo 1 (Ana Silo)",
    quantity: "",
    minLevel: "20",
    unit: "Ton",
  });

  const [warehouseForm, setWarehouseForm] = useState({
    id: "",
    name: "",
    capacity: "",
    currentAmount: "",
    unit: "Ton",
  });

  // Selected warehouse capacity info for Stok Girişi validation
  const selectedWhForMovement = useMemo(() => {
    return warehouses.find(
      (w) => w.name.toLocaleLowerCase("tr-TR") === movementForm.warehouse.toLocaleLowerCase("tr-TR")
    );
  }, [warehouses, movementForm.warehouse]);

  const remainingWhCapacity = useMemo(() => {
    if (!selectedWhForMovement) return 999999;
    return Math.max(0, selectedWhForMovement.capacity - selectedWhForMovement.currentAmount);
  }, [selectedWhForMovement]);

  // Selected stock item match for auto unit & warehouse locking
  const matchedStockItemForMovement = useMemo(() => {
    if (!movementForm.itemName) return null;
    return stockItems.find(
      (item) => item.name.toLocaleLowerCase("tr-TR") === movementForm.itemName.toLocaleLowerCase("tr-TR")
    );
  }, [stockItems, movementForm.itemName]);

  // Sync unit and warehouse automatically when matched item changes in movement form
  useEffect(() => {
    if (matchedStockItemForMovement) {
      setMovementForm((prev) => ({
        ...prev,
        unit: matchedStockItemForMovement.unit,
        warehouse: matchedStockItemForMovement.warehouse,
      }));
    }
  }, [matchedStockItemForMovement]);

  // Selected warehouse match for auto unit locking in Add Stock modal
  const selectedWhInAddStock = useMemo(() => {
    return warehouses.find((w) => w.name === stockItemForm.warehouse);
  }, [warehouses, stockItemForm.warehouse]);

  // Dynamic Stat & Chart Calculations
  const dynamicTotalQuantity = useMemo(() => {
    return stockItems.reduce((acc, i) => acc + i.quantity, 0);
  }, [stockItems]);

  const totalInAmount = useMemo(() => {
    return movementsList.filter((m) => m.direction === "giris").reduce((acc, m) => acc + m.amount, 0);
  }, [movementsList]);

  const totalOutAmount = useMemo(() => {
    return movementsList.filter((m) => m.direction === "cikis").reduce((acc, m) => acc + m.amount, 0);
  }, [movementsList]);

  const turnoverRate = useMemo(() => {
    if (dynamicTotalQuantity === 0) return 0;
    return Math.min(10, Math.max(0.5, (totalOutAmount / dynamicTotalQuantity) * 5));
  }, [totalOutAmount, dynamicTotalQuantity]);

  // Dynamic Donut Chart Data (Stok Dağılımı)
  const dynamicDistribution = useMemo(() => {
    const itemsWithQty = stockItems.filter((i) => i.quantity > 0);
    const targetItems = itemsWithQty.length > 0 ? itemsWithQty : stockItems;

    return targetItems.map((item) => ({
      name: `${item.name} (${item.warehouse})`,
      value: item.quantity,
    }));
  }, [stockItems]);

  // Dynamic Trend Chart Data (Aylık Stok Hareket Trendi)
  const dynamicMonthlyTrend = useMemo(() => {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];
    const baseIn = [40, 55, 35, 70, 85, 60, 95, 110];
    const baseOut = [20, 35, 18, 45, 50, 40, 60, 75];

    return months.map((mName, idx) => {
      if (idx === 7) {
        return {
          name: mName,
          value: totalInAmount > 0 ? totalInAmount : baseIn[idx],
          secondary: totalOutAmount > 0 ? totalOutAmount : baseOut[idx],
        };
      }
      return {
        name: mName,
        value: baseIn[idx],
        secondary: baseOut[idx],
      };
    });
  }, [totalInAmount, totalOutAmount]);

  // Handlers for Stock Movement (Yeni Stok Girişi / Çıkışı)
  const handleOpenAddMovementModal = () => {
    const firstItem = stockItems[0];
    setMovementForm({
      direction: "giris",
      itemName: firstItem?.name || "",
      warehouse: firstItem?.warehouse || warehouses[0]?.name || "Silo 1 (Ana Silo)",
      amount: "",
      unit: firstItem?.unit || "Ton",
      date: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setShowAddMovementModal(true);
  };

  const handleAddMovementSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movementForm.itemName.trim() || !movementForm.amount) {
      dispatch(showToast("Lütfen ürün adını ve miktarını eksiksiz girin."));
      return;
    }

    const numAmount = parseFloat(movementForm.amount) || 0;
    const isGiris = movementForm.direction === "giris";

    // KONTROL 1: Stok Çıkışında Yetersiz Stok Kontrolü
    if (!isGiris && matchedStockItemForMovement) {
      if (matchedStockItemForMovement.quantity === 0) {
        dispatch(
          showToast(
            `⚠️ Yetersiz Stok! Depoda "${matchedStockItemForMovement.name}" ürünü hiç yok (Mevcut: 0 ${matchedStockItemForMovement.unit}). Stok çıkışı yapılamaz.`
          )
        );
        return;
      }
      if (numAmount > matchedStockItemForMovement.quantity) {
        dispatch(
          showToast(
            `⚠️ Yetersiz Stok! Depodaki mevcut miktar: ${matchedStockItemForMovement.quantity} ${matchedStockItemForMovement.unit}. En fazla bu miktar kadar stok çıkışı yapılabilir.`
          )
        );
        return;
      }
    }

    // KONTROL 2: Silo / Depo Kapasite Aşım Kontrolü (Stok Girişinde)
    if (isGiris && selectedWhForMovement) {
      const remainingCap = Math.max(0, selectedWhForMovement.capacity - selectedWhForMovement.currentAmount);
      if (numAmount > remainingCap) {
        dispatch(
          showToast(
            `⚠️ Depo/Silo Kapasitesi Aşıldı! Maksimum koyulabilecek mahsul: ${remainingCap} ${selectedWhForMovement.unit} (Kalan Kapasite)`
          )
        );
        return;
      }
    }

    // Update stock item quantity
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.name.toLocaleLowerCase("tr-TR") === movementForm.itemName.toLocaleLowerCase("tr-TR")) {
          const newQty = isGiris ? item.quantity + numAmount : Math.max(0, item.quantity - numAmount);
          return {
            ...item,
            quantity: newQty,
            lastIn: isGiris ? formatDate(movementForm.date) : item.lastIn,
            lastOut: !isGiris ? formatDate(movementForm.date) : item.lastOut,
            level: newQty <= item.minLevel ? "kritik" : "normal",
            levelLabel: newQty <= item.minLevel ? "Kritik Seviye" : "Yeterli Seviye",
          };
        }
        return item;
      })
    );

    // Update warehouse current amount
    if (selectedWhForMovement) {
      setWarehouses((prev) =>
        prev.map((wh) => {
          if (wh.id === selectedWhForMovement.id) {
            const newCur = isGiris ? wh.currentAmount + numAmount : Math.max(0, wh.currentAmount - numAmount);
            const newPct = Math.min(100, Math.round((newCur / wh.capacity) * 100));
            return {
              ...wh,
              currentAmount: newCur,
              value: newPct,
            };
          }
          return wh;
        })
      );
    }

    // Add to movement activity list
    const logAmountText = `${isGiris ? "+" : "-"}${numAmount} ${movementForm.unit}`;

    const newMovement: StockMovementRow = {
      id: `mov-${Date.now()}`,
      direction: movementForm.direction,
      directionLabel: isGiris ? "Stok Girişi" : "Stok Çıkışı",
      itemName: movementForm.itemName.trim(),
      warehouse: movementForm.warehouse,
      amount: numAmount,
      unit: movementForm.unit,
      signedAmount: logAmountText,
      date: movementForm.date,
      reason: movementForm.reason || "Operasyonel Stok Hareketi",
    };

    setMovementsList((prev) => [newMovement, ...prev]);
    setShowAddMovementModal(false);
    dispatch(
      showToast(
        `"${movementForm.itemName}" ürününe ${logAmountText} ${
          isGiris ? "stok girişi" : "stok çıkışı"
        } kaydedildi.`
      )
    );
  };

  // Handlers for Stock Item (Mahsul / Ürün Ekle & Düzenle & Sil)
  const handleOpenAddStockModal = () => {
    setStockItemForm({
      id: "",
      name: "",
      category: "kaba_yem",
      categoryLabel: "Kaba Yem",
      warehouse: warehouses[0]?.name || "Silo 1 (Ana Silo)",
      quantity: "",
      minLevel: "20",
      unit: "Ton",
    });
    setShowAddStockModal(true);
  };

  const handleOpenEditStockModal = (item: StockRow) => {
    setSelectedEditStockItem(item);
    setStockItemForm({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryLabel: item.categoryLabel,
      warehouse: item.warehouse,
      quantity: item.quantity.toString(),
      minLevel: item.minLevel.toString(),
      unit: item.unit,
    });
  };

  const handleAddStockSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stockItemForm.name.trim()) {
      dispatch(showToast("Lütfen ürün / mahsul adını doldurun."));
      return;
    }

    const minLvl = parseFloat(stockItemForm.minLevel) || 10;
    const catLabel = getCategoryLabel(stockItemForm.category);

    const newItem: StockRow = {
      id: `stk-${Date.now()}`,
      name: stockItemForm.name.trim(),
      category: stockItemForm.category,
      categoryLabel: catLabel,
      warehouse: "Atanmadı",
      quantity: 0, // İlk tanımda miktar 0'dır, stok girişi Yeni Stok Girişi'nden yapılır
      minLevel: minLvl,
      unit: "Ton",
      lastIn: "—",
      lastInAt: null,
      lastOut: "—",
      lastOutAt: null,
      level: "kritik",
      levelLabel: "Kritik Seviye (0)",
    };

    setStockItems((prev) => [newItem, ...prev]);
    setShowAddStockModal(false);
    dispatch(
      showToast(`"${newItem.name}" ürünü tanımlandı. Stok girişini 'Yeni Stok Girişi' butonundan yapabilirsiniz.`)
    );
  };

  const handleEditStockSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditStockItem || !stockItemForm.name.trim()) return;

    const qty = parseFloat(stockItemForm.quantity) || 0;
    const minLvl = parseFloat(stockItemForm.minLevel) || 10;
    const catLabel = getCategoryLabel(stockItemForm.category);

    setStockItems((prev) =>
      prev.map((item) =>
        item.id === selectedEditStockItem.id
          ? {
              ...item,
              name: stockItemForm.name.trim(),
              category: stockItemForm.category,
              categoryLabel: catLabel,
              warehouse: stockItemForm.warehouse,
              quantity: qty,
              minLevel: minLvl,
              unit: stockItemForm.unit,
              level: qty <= minLvl ? "kritik" : "normal",
              levelLabel: qty <= minLvl ? "Kritik Seviye" : "Yeterli Seviye",
            }
          : item
      )
    );
    setSelectedEditStockItem(null);
    dispatch(showToast(`"${stockItemForm.name}" güncellendi.`));
  };

  const handleDeleteStockItem = (id: string) => {
    const itemToDelete = stockItems.find((i) => i.id === id);
    setStockItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedEditStockItem(null);
    dispatch(showToast(`"${itemToDelete?.name || "Ürün"}" stoktan silindi.`));
  };

  // Handlers for Warehouse / Silo (Depo Ekle & Düzenle & Sil)
  const handleOpenAddWarehouseModal = () => {
    setWarehouseForm({
      id: "",
      name: "",
      capacity: "500",
      currentAmount: "0",
      unit: "Ton",
    });
    setShowAddWarehouseModal(true);
  };

  const handleOpenEditWarehouseModal = (wh: WarehouseItem) => {
    setSelectedEditWarehouse(wh);
    setWarehouseForm({
      id: wh.id,
      name: wh.name,
      capacity: wh.capacity.toString(),
      currentAmount: wh.currentAmount.toString(),
      unit: wh.unit,
    });
  };

  const handleAddWarehouseSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.capacity) {
      dispatch(showToast("Lütfen depo adını ve kapasitesini girin."));
      return;
    }

    const cap = parseFloat(warehouseForm.capacity) || 100;

    const newWh: WarehouseItem = {
      id: `wh-${Date.now()}`,
      name: warehouseForm.name.trim(),
      capacity: cap,
      currentAmount: 0, // Başlangıç doluluğu 0'dır, stok girişleri Yeni Stok Girişi'nden yapılır
      unit: warehouseForm.unit,
      value: 0,
    };

    setWarehouses((prev) => [...prev, newWh]);
    setShowAddWarehouseModal(false);
    dispatch(showToast(`"${newWh.name}" depolama alanı tanımlandı (${cap} ${warehouseForm.unit} Kapasite).`));
  };

  const handleEditWarehouseSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditWarehouse || !warehouseForm.name.trim()) return;

    const cap = parseFloat(warehouseForm.capacity) || 100;
    const cur = parseFloat(warehouseForm.currentAmount) || 0;
    const pct = Math.min(100, Math.round((cur / cap) * 100));

    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === selectedEditWarehouse.id
          ? {
              ...wh,
              name: warehouseForm.name.trim(),
              capacity: cap,
              currentAmount: cur,
              unit: warehouseForm.unit,
              value: pct,
            }
          : wh
      )
    );
    setSelectedEditWarehouse(null);
    dispatch(showToast(`"${warehouseForm.name}" bilgileri güncellendi.`));
  };

  const handleDeleteWarehouse = (id: string) => {
    const whToDelete = warehouses.find((w) => w.id === id);
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    setSelectedEditWarehouse(null);
    dispatch(showToast(`"${whToDelete?.name || "Depo"}" sistemden silindi.`));
  };

  // Filtered Stock Items
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")) ||
        item.warehouse.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"));

      const matchCat = !filters.category || item.category === filters.category;
      const matchWh = !filters.warehouse || item.warehouse === filters.warehouse;
      return matchSearch && matchCat && matchWh;
    });
  }, [stockItems, search, filters]);

  // Filter Options for Select Inputs (Tüm kategoriler her zaman listelenir)
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    ALL_DEFAULT_CATEGORIES.forEach((c) => map.set(c.value, c.label));
    stockItems.forEach((i) => {
      if (i.category && i.categoryLabel) {
        map.set(i.category, i.categoryLabel);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [stockItems]);

  const warehouseOptions = useMemo(() => {
    return Array.from(new Set(warehouses.map((i) => i.name))).map((value) => ({
      value,
      label: value,
    }));
  }, [warehouses]);

  // Rows for DataTable (Headers: ["Ürün / Mahsul", "Kategori", "Depo / Silo", "Mevcut Miktar", "Min. Seviye", "Son Giriş", "Son Çıkış", "Doluluk %"])
  const tableRows = filteredStockItems.map((item) => {
    const whObj = warehouses.find((w) => w.name === item.warehouse);
    const fillPct = whObj ? whObj.value : Math.min(100, Math.round((item.quantity / (item.minLevel * 5)) * 100));

    return [
      item.name,
      item.categoryLabel,
      item.warehouse,
      withUnit(item.quantity, item.unit),
      withUnit(item.minLevel, item.unit),
      item.lastIn,
      item.lastOut,
      // Doluluk % Sütunu (Mini Progress Bar + Yüzde)
      <div key={`fill-${item.id}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "48px",
            height: "6px",
            background: "var(--surface-3)",
            borderRadius: "4px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: `${fillPct}%`,
              height: "100%",
              background: fillPct > 85 ? "var(--red)" : fillPct < 25 ? "var(--orange)" : "var(--green-600)",
              borderRadius: "4px",
            }}
          />
        </div>
        <span style={{ fontSize: "12.5px", fontWeight: 700, minWidth: "32px" }}>%{fillPct}</span>
      </div>,
    ];
  });

  const totals = summary?.totals;

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Stok ve Depo Yönetimi"
        description="Silo, yem, saman, yonca, mahsul ve diğer çiftlik stoklarınızı tek panelden yönetin."
        icon={<PackageOpen />}
        primaryLabel="Yeni Stok Girişi"
        showFilter={false}
        showDateChevron={false}
        onPrimaryClick={handleOpenAddMovementModal}
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* STATS GRID */}
      <div className="stats-grid stats-grid-6">
        <StatCard
          icon={<Boxes />}
          label="Toplam Stok Miktarı"
          value={formatDecimal(dynamicTotalQuantity)}
          unit="Birim"
          meta={`${stockItems.length} çeşit mahsul & yem`}
          tone="orange"
        />
        <StatCard
          icon={<Warehouse />}
          label="Aktif Silo / Depo"
          value={formatNumber(warehouses.length)}
          meta={`${formatDecimal(warehouses.reduce((a, w) => a + w.currentAmount, 0))} / ${formatDecimal(warehouses.reduce((a, w) => a + w.capacity, 0))} Kapasite`}
          tone="blue"
        />
        <StatCard
          icon={<AlertTriangle />}
          label="Kritik Stok Uyarısı"
          value={formatNumber(stockItems.filter((i) => i.quantity <= i.minLevel).length)}
          meta="Acil tedarik gerekli"
          tone="red"
        />
        <StatCard
          icon={<ArrowDownToLine />}
          label="Toplam Stok Girişi"
          value={`+${formatDecimal(totalInAmount)}`}
          unit="Birim"
          meta={`${movementsList.filter((m) => m.direction === "giris").length} giriş hareketi`}
          trend="up"
        />
        <StatCard
          icon={<ArrowUpFromLine />}
          label="Toplam Stok Çıkışı"
          value={`-${formatDecimal(totalOutAmount)}`}
          unit="Birim"
          meta={`${movementsList.filter((m) => m.direction === "cikis").length} çıkış hareketi`}
          trend="down"
          tone="red"
        />
        <StatCard
          icon={<RefreshCcw />}
          label="Stok Devir Oranı"
          value={formatDecimal(turnoverRate)}
          meta="Canlı devir hızı"
          tone="orange"
        />
      </div>

      {/* 1. TAM GENİŞLİK STOK LİSTESİ */}
      <div className="calendar-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Panel
          className="table-panel"
          title="🌾 Mahsul & Stok Kalemleri Listesi"
          action={
            <button
              className="button button-primary"
              onClick={handleOpenAddStockModal}
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
              <Plus size={15} /> Yeni Mahsul / Ürün Ekle
            </button>
          }
        >
          <Filters
            placeholder="Mahsul veya depo ara..."
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSelectChange={(name, value) => {
              setFilters((current) => ({ ...current, [name]: value }));
              setPage(1);
            }}
            selects={[
              {
                name: "category",
                placeholder: "Tüm Kategoriler",
                value: filters.category,
                options: categoryOptions,
              },
              {
                name: "warehouse",
                placeholder: "Tüm Depolar",
                value: filters.warehouse,
                options: warehouseOptions,
              },
            ]}
          />
          <DataTable
            loading={loading}
            headers={[
              "Ürün / Mahsul",
              "Kategori",
              "Depo / Silo",
              "Mevcut Miktar",
              "Min. Seviye",
              "Son Giriş",
              "Son Çıkış",
              "Doluluk %",
            ]}
            rows={tableRows}
            onView={(index) => setSelectedViewStockItem(filteredStockItems[index])}
            onEdit={(index) => handleOpenEditStockModal(filteredStockItems[index])}
            pagination={
              meta?.pagination
                ? {
                    page: meta.pagination.page,
                    totalPages: meta.pagination.totalPages,
                    total: meta.pagination.total,
                  }
                : undefined
            }
            onPageChange={setPage}
          />
        </Panel>
      </div>

      {/* 2. ALTINDAKİ 3'LÜ GRAFİK VE DEPO / SİLO YÖNETİM GRİDİ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <Panel title="Stok Dağılımı (Ürün Bazında)">
          <DonutChart
            total={`${formatDecimal(dynamicTotalQuantity)} Birim`}
            data={dynamicDistribution}
          />
        </Panel>

        <Panel title="Aylık Stok Hareket Trendi">
          <TrendChart data={dynamicMonthlyTrend} secondary={true} />
        </Panel>

        <Panel
          title="🏗 Depo / Silo Doluluk Durumu"
          action={
            <button
              className="button button-primary"
              onClick={handleOpenAddWarehouseModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: 600,
              }}
            >
              <Plus size={14} /> Yeni Depo/Silo Ekle
            </button>
          }
        >
          <div className="progress-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {warehouses.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <Warehouse style={{ color: "var(--green-600)", flexShrink: 0 }} size={20} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "13.5px" }}>{item.name}</strong>
                      <small style={{ color: "var(--muted)", fontWeight: 600 }}>
                        {item.currentAmount} / {item.capacity} {item.unit} ({item.value}%)
                      </small>
                    </div>
                    <div
                      style={{
                        height: "7px",
                        width: "100%",
                        background: "var(--surface-3)",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${item.value}%`,
                          background: item.value > 85 ? "var(--red)" : item.value < 25 ? "var(--orange)" : "var(--green-600)",
                          borderRadius: "10px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="icon-button"
                  title="Depoyu Düzenle"
                  onClick={() => handleOpenEditWarehouseModal(item)}
                  style={{
                    background: "none",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "6px",
                    cursor: "pointer",
                    color: "var(--text)",
                  }}
                >
                  <Pencil size={13} />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* 3. EN ALT 2'Lİ HAREKETLER VE UYARILAR GRİDİ */}
      <div className="module-bottom-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Panel title="Son Stok Hareketleri">
          <div className="activity-list">
            {movementsList.map((movement) => (
              <span key={movement.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <i className={`dot ${movement.direction === "cikis" ? "dot-red" : ""}`} />{" "}
                  <strong>{movement.directionLabel}</strong> · {movement.itemName} ({movement.warehouse})
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <b style={{ color: movement.direction === "cikis" ? "var(--red)" : "var(--green-600)" }}>
                    {movement.signedAmount}
                  </b>
                  <time>{formatDate(movement.date)}</time>
                </div>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Kritik Stok Uyarıları">
          <div className="compact-list">
            {stockItems
              .filter((i) => i.quantity <= i.minLevel)
              .map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertTriangle style={{ color: "var(--red)" }} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.warehouse}</small>
                    </span>
                  </div>
                  <b>
                    {withUnit(item.quantity, item.unit)} · <span style={{ color: "var(--red)" }}>Kritik Seviye</span>
                  </b>
                </div>
              ))}
            {stockItems.filter((i) => i.quantity <= i.minLevel).length === 0 && (
              <div>
                <PackageOpen />
                <span>
                  <strong>Kritik stok yok</strong>
                  <small>Tüm mahsul ve yem kalemleri güvenli seviyede.</small>
                </span>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* ========================================================================= */}
      {/* MODALLAR */}
      {/* ========================================================================= */}

      {/* MODAL 1: Yeni Stok Girişi / Çıkışı Hareketi Modalı (Silo Kapasite Uyarılı) */}
      {showAddMovementModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddMovementModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={addMovementModalRef}
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
                <PackageOpen style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Yeni Stok Hareketi Kaydı</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddMovementModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMovementSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Hareket Yönü *
                </label>
                <select
                  value={movementForm.direction}
                  onChange={(e) => setMovementForm({ ...movementForm, direction: e.target.value as any })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                >
                  <option value="giris">📥 Stok Girişi (Depoya Ekleme)</option>
                  <option value="cikis">📤 Stok Çıkışı (Tüketim / Satış)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Mahsul / Ürün Seçin *
                </label>
                <select
                  required
                  value={movementForm.itemName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const matched = stockItems.find((i) => i.name === selectedName);
                    setMovementForm({
                      ...movementForm,
                      itemName: selectedName,
                      unit: matched ? matched.unit : movementForm.unit,
                      warehouse: matched ? matched.warehouse : movementForm.warehouse,
                    });
                  }}
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
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.warehouse} · Mevcut: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Depo / Silo {matchedStockItemForMovement && "🔒"}
                  </label>
                  <select
                    disabled={!!matchedStockItemForMovement}
                    value={movementForm.warehouse}
                    onChange={(e) => setMovementForm({ ...movementForm, warehouse: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: matchedStockItemForMovement ? "var(--surface-3)" : "var(--surface-2)",
                      color: matchedStockItemForMovement ? "var(--muted)" : "inherit",
                      fontWeight: 600,
                      cursor: matchedStockItemForMovement ? "not-allowed" : "pointer",
                    }}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {matchedStockItemForMovement && (
                    <small style={{ color: "var(--green-600)", fontSize: "11px", fontWeight: 600, marginTop: "3px", display: "block" }}>
                      🔒 Ürünün kayıtlı olduğu depo ({matchedStockItemForMovement.warehouse})
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tarih *
                  </label>
                  <input
                    required
                    type="date"
                    value={movementForm.date}
                    onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* STOK GİRİŞİ KAPASİTE DURUMU & UYARI KUTUSU */}
              {movementForm.direction === "giris" && selectedWhForMovement && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    background:
                      (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                        ? "rgba(239, 63, 63, 0.12)"
                        : "var(--surface-2)",
                    border:
                      (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                        ? "1px solid var(--red)"
                        : "1px solid var(--line)",
                    color:
                      (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                        ? "var(--red)"
                        : "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {(parseFloat(movementForm.amount) || 0) > remainingWhCapacity ? (
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  ) : (
                    <Info size={18} style={{ flexShrink: 0, color: "var(--blue)" }} />
                  )}
                  <div>
                    {(parseFloat(movementForm.amount) || 0) > remainingWhCapacity ? (
                      <strong>
                        🚨 UYARI: Silo kapasitesi aşıldı! Maksimum koyulabilecek mahsul: {remainingWhCapacity}{" "}
                        {selectedWhForMovement.unit} (Kalan Kapasite)
                      </strong>
                    ) : (
                      <span>
                        <b>{selectedWhForMovement.name}</b> Kapasitesi: {selectedWhForMovement.capacity}{" "}
                        {selectedWhForMovement.unit} · Doluluk: {selectedWhForMovement.currentAmount} (<b>%{selectedWhForMovement.value}</b>) ·{" "}
                        <span style={{ color: "var(--green-600)", fontWeight: 700 }}>
                          Kalan Boş Alan: {remainingWhCapacity} {selectedWhForMovement.unit}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* STOK ÇIKIŞI YETERSIZ STOK UYARISI */}
              {movementForm.direction === "cikis" && matchedStockItemForMovement && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    background:
                      (parseFloat(movementForm.amount) || 0) > matchedStockItemForMovement.quantity
                        ? "rgba(239, 63, 63, 0.12)"
                        : "var(--surface-2)",
                    border:
                      (parseFloat(movementForm.amount) || 0) > matchedStockItemForMovement.quantity
                        ? "1px solid var(--red)"
                        : "1px solid var(--line)",
                    color:
                      (parseFloat(movementForm.amount) || 0) > matchedStockItemForMovement.quantity
                        ? "var(--red)"
                        : "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {(parseFloat(movementForm.amount) || 0) > matchedStockItemForMovement.quantity ? (
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  ) : (
                    <Info size={18} style={{ flexShrink: 0, color: "var(--blue)" }} />
                  )}
                  <div>
                    {(parseFloat(movementForm.amount) || 0) > matchedStockItemForMovement.quantity ? (
                      <strong>
                        🚨 YETERSIZ STOK: Depoda bu üründen {matchedStockItemForMovement.quantity}{" "}
                        {matchedStockItemForMovement.unit} bulunuyor. Girilen miktar ({movementForm.amount || 0}{" "}
                        {matchedStockItemForMovement.unit}) mevcut stoktan fazla!
                      </strong>
                    ) : (
                      <span>
                        <b>{matchedStockItemForMovement.name}</b> Depo Miktarı:{" "}
                        <span style={{ color: "var(--green-600)", fontWeight: 700 }}>
                          {matchedStockItemForMovement.quantity} {matchedStockItemForMovement.unit}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Miktar *
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Örn: 25"
                    value={movementForm.amount}
                    onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border:
                        movementForm.direction === "giris" && (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                          ? "1.5px solid var(--red)"
                          : "1px solid var(--line)",
                      background: "var(--surface-2)",
                      color: "inherit",
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Birim {matchedStockItemForMovement && "🔒"}
                  </label>
                  <select
                    disabled={!!matchedStockItemForMovement}
                    value={movementForm.unit}
                    onChange={(e) => setMovementForm({ ...movementForm, unit: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: matchedStockItemForMovement ? "var(--surface-3)" : "var(--surface-2)",
                      color: matchedStockItemForMovement ? "var(--muted)" : "inherit",
                      fontWeight: 600,
                      cursor: matchedStockItemForMovement ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="Ton">Ton</option>
                    <option value="Kg">Kg</option>
                    <option value="Gram">Gram</option>
                    <option value="Balya">Balya</option>
                    <option value="Çuval">Çuval</option>
                    <option value="Litre">Litre</option>
                    <option value="Adet">Adet</option>
                    <option value="M3">m³</option>
                  </select>
                  {matchedStockItemForMovement && (
                    <small style={{ color: "var(--green-600)", fontSize: "11px", fontWeight: 600, marginTop: "3px", display: "block" }}>
                      🔒 Mevcut ürün birimiyle kilitli ({matchedStockItemForMovement.unit})
                    </small>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Açıklama & Sebeb (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kuzey tarlası mısır hasadı teslimi"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddMovementModal(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={movementForm.direction === "giris" && (parseFloat(movementForm.amount) || 0) > remainingWhCapacity}
                  style={{
                    opacity:
                      movementForm.direction === "giris" && (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                        ? 0.5
                        : 1,
                    cursor:
                      movementForm.direction === "giris" && (parseFloat(movementForm.amount) || 0) > remainingWhCapacity
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Mahsul / Ürün Detayları Görüntüleme Modalı (Eye Icon Click) */}
      {selectedViewStockItem && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedViewStockItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={viewStockModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  STOK DETAY KARTI
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  {selectedViewStockItem.name}
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedViewStockItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Kategori</small>
                <strong style={{ display: "block", fontSize: "14px", marginTop: "2px" }}>
                  {selectedViewStockItem.categoryLabel}
                </strong>
              </div>

              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Bulunduğu Depo / Silo</small>
                <strong style={{ display: "block", fontSize: "14px", marginTop: "2px" }}>
                  {selectedViewStockItem.warehouse}
                </strong>
              </div>

              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Mevcut Stok Miktarı</small>
                <strong style={{ display: "block", fontSize: "15px", marginTop: "2px", color: "var(--green-600)" }}>
                  {withUnit(selectedViewStockItem.quantity, selectedViewStockItem.unit)}
                </strong>
              </div>

              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Minimum Alarm Seviyesi</small>
                <strong style={{ display: "block", fontSize: "14px", marginTop: "2px" }}>
                  {withUnit(selectedViewStockItem.minLevel, selectedViewStockItem.unit)}
                </strong>
              </div>

              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Son Giriş Tarihi</small>
                <strong style={{ display: "block", fontSize: "13.5px", marginTop: "2px" }}>
                  {selectedViewStockItem.lastIn}
                </strong>
              </div>

              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>Son Çıkış Tarihi</small>
                <strong style={{ display: "block", fontSize: "13.5px", marginTop: "2px" }}>
                  {selectedViewStockItem.lastOut}
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedViewStockItem(null)}
              >
                Kapat
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  const item = selectedViewStockItem;
                  setSelectedViewStockItem(null);
                  handleOpenEditStockModal(item);
                }}
              >
                Düzenle →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Yeni Mahsul / Ürün Ekle Modalı */}
      {showAddStockModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddStockModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={addStockModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Boxes style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Yeni Mahsul / Ürün Tanımla</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddStockModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Ürün / Mahsul Adı *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Örn: Silajlık Mısır 2026 Hasadı"
                  value={stockItemForm.name}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori *
                  </label>
                  <select
                    value={stockItemForm.category}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  >
                    <option value="kaba_yem">Kaba Yem</option>
                    <option value="silaj">Silaj</option>
                    <option value="tahil">Tahıl</option>
                    <option value="gubre">Gübre & İlaç</option>
                    <option value="yakit">Yakıt & Enerji</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Min. Seviye (Kritik Alarm) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="20"
                    value={stockItemForm.minLevel}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, minLevel: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddStockModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Mahsulü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Mahsul / Ürün Düzenleme & Silme Modalı */}
      {selectedEditStockItem && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEditStockItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={editStockModalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              padding: "26px",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  MAHSUL DÜZENLEME
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  {selectedEditStockItem.name}
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedEditStockItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditStockSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Ürün Adı *
                </label>
                <input
                  required
                  type="text"
                  value={stockItemForm.name}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={stockItemForm.category}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  >
                    <option value="kaba_yem">Kaba Yem</option>
                    <option value="silaj">Silaj</option>
                    <option value="tahil">Tahıl</option>
                    <option value="gubre">Gübre & İlaç</option>
                    <option value="yakit">Yakıt & Enerji</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Depo / Silo
                  </label>
                  <select
                    value={stockItemForm.warehouse}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, warehouse: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Mevcut Miktar *
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={stockItemForm.quantity}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, quantity: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Min. Seviye
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={stockItemForm.minLevel}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, minLevel: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Birim
                  </label>
                  <select
                    value={stockItemForm.unit}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="Ton">Ton</option>
                    <option value="Balya">Balya</option>
                    <option value="Çuval">Çuval</option>
                    <option value="Litre">Litre</option>
                    <option value="Kg">Kg</option>
                    <option value="Adet">Adet</option>
                    <option value="M3">m³</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  style={{
                    color: "var(--red)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => handleDeleteStockItem(selectedEditStockItem.id)}
                >
                  <Trash2 size={16} /> Ürünü Sil
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditStockItem(null)}
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

      {/* MODAL 5: Yeni Depo / Silo Ekle Modalı */}
      {showAddWarehouseModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddWarehouseModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={addWarehouseModalRef}
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
                <Warehouse style={{ color: "var(--green-600)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Yeni Depo / Silo Ekle</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAddWarehouseModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Depo / Silo Adı *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Örn: Silo 3 (Kuzey Tarlası)"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Toplam Kapasite *
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Örn: 500"
                    value={warehouseForm.capacity}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kapasite Birimi *
                  </label>
                  <select
                    value={warehouseForm.unit}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="Ton">Ton</option>
                    <option value="Balya">Balya</option>
                    <option value="Çuval">Çuval</option>
                    <option value="Litre">Litre</option>
                    <option value="Kg">Kg</option>
                    <option value="Adet">Adet</option>
                    <option value="M3">m³</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddWarehouseModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="button button-primary">
                  Depoyu Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Depo / Silo Düzenleme & Silme Modalı */}
      {selectedEditWarehouse && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEditWarehouse(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            ref={editWarehouseModalRef}
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
              <div>
                <span className="breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  DEPO / SİLO DÜZENLEME
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700 }}>
                  {selectedEditWarehouse.name}
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedEditWarehouse(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditWarehouseSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Depo / Silo Adı *
                </label>
                <input
                  required
                  type="text"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Toplam Kapasite *
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={warehouseForm.capacity}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                    Kapasite Birimi *
                  </label>
                  <select
                    value={warehouseForm.unit}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-2)", color: "inherit" }}
                  >
                    <option value="Ton">Ton</option>
                    <option value="Balya">Balya</option>
                    <option value="Çuval">Çuval</option>
                    <option value="Litre">Litre</option>
                    <option value="Kg">Kg</option>
                    <option value="Adet">Adet</option>
                    <option value="M3">m³</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  style={{
                    color: "var(--red)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => handleDeleteWarehouse(selectedEditWarehouse.id)}
                >
                  <Trash2 size={16} /> Depoyu Sil
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedEditWarehouse(null)}
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
    </div>
  );
}

export default StockView;
