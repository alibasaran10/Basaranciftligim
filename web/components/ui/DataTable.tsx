"use client";

import { ChevronLeft, ChevronRight, Eye, Filter, Pencil, Trash2 } from "lucide-react";

import { formatNumber } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

import { Badge } from "./Badge";
import { Skeleton } from "./AsyncState";

const toneFor = (value: string) => {
  const text = value.toLocaleLowerCase("tr-TR");
  if (text.includes("kritik") || text.includes("aktif")) return "red" as const;
  if (text.includes("bekle") || text.includes("orta") || text.includes("yüksek"))
    return "orange" as const;
  if (text.includes("kısmi") || text.includes("planlandı")) return "blue" as const;
  if (
    text.includes("tamam") ||
    text.includes("ödendi") ||
    text.includes("yeterli") ||
    text.includes("tahsil")
  )
    return "green" as const;
  return "gray" as const;
};

/** Sunucudan gelen sayfalandirma bilgisi (offset stratejisi). */
export type Pagination = {
  page: number;
  totalPages: number;
  total: number;
};

export function DataTable({
  headers,
  rows,
  compact = false,
  loading = false,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onHeaderFilterClick,
  emptyMessage = "Kayıt bulunamadı.",
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  compact?: boolean;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onView?: (index: number) => void;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  onHeaderFilterClick?: (headerName: string) => void;
  emptyMessage?: string;
}) {
  const dispatch = useAppDispatch();

  const page = pagination?.page ?? 1;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? rows.length;

  // Aktif sayfanin etrafinda en fazla 4 sayfa numarasi gosterilir.
  const start = Math.max(1, Math.min(page - 1, totalPages - 3));
  const pageNumbers = Array.from({ length: Math.min(4, totalPages) }, (_, i) => start + i).filter(
    (n) => n <= totalPages,
  );

  const goTo = (next: number) => {
    if (!onPageChange) return;
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className={`data-table-wrap ${compact ? "is-compact" : ""}`}>
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => {
              const isFilterableHeader = ["Tarih", "Tutar"].includes(header);
              return (
                <th key={header}>
                  {isFilterableHeader && onHeaderFilterClick ? (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => onHeaderFilterClick(header)}
                      title={`${header} filtresini ve sıralamasını aç`}
                    >
                      <span>{header}</span>
                      <Filter size={12} style={{ color: "var(--green-600)", strokeWidth: 2.3 }} />
                    </div>
                  ) : (
                    header
                  )}
                </th>
              );
            })}
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 &&
            Array.from({ length: 6 }, (_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {headers.map((header) => (
                  <td key={header}>
                    <Skeleton height={14} width="80%" />
                  </td>
                ))}
                <td>
                  <Skeleton height={14} width="56px" />
                </td>
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={headers.length + 1} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}

          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => {
                const content =
                  typeof cell === "string" &&
                  (cellIndex === row.length - 1 ||
                    ["Kritik", "Yüksek", "Orta", "Aktif", "Planlandı"].includes(cell)) ? (
                    <Badge tone={toneFor(cell)}>{cell}</Badge>
                  ) : (
                    cell
                  );
                return <td key={cellIndex}>{content}</td>;
              })}
              <td>
                <div className="table-actions">
                  <button
                    aria-label="Görüntüle"
                    onClick={() => {
                      if (onView) onView(rowIndex);
                      else dispatch(showToast("Kayıt görüntüleniyor."));
                    }}
                  >
                    <Eye />
                  </button>
                  <button
                    aria-label="Düzenle"
                    onClick={() => {
                      if (onEdit) onEdit(rowIndex);
                      else dispatch(showToast("Düzenleme modu açıldı."));
                    }}
                  >
                    <Pencil />
                  </button>
                  {onDelete && (
                    <button
                      aria-label="Sil"
                      style={{ color: "var(--red)" }}
                      onClick={() => onDelete(rowIndex)}
                    >
                      <Trash2 />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer">
        <span>Toplam {formatNumber(total)} kayıt bulundu</span>
        {totalPages > 1 && (
          <div className="pagination">
            <button aria-label="Önceki sayfa" onClick={() => goTo(page - 1)} disabled={page <= 1}>
              <ChevronLeft />
            </button>
            {pageNumbers.map((item) => (
              <button
                className={page === item ? "is-active" : ""}
                onClick={() => goTo(item)}
                key={item}
              >
                {item}
              </button>
            ))}
            <button
              aria-label="Sonraki sayfa"
              onClick={() => goTo(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
