"use client";

import { CalendarDays, ChevronDown, FileDown, Filter, Plus } from "lucide-react";

import { formatLongDate } from "@/lib/format";
import { useAppDispatch } from "@/store/hooks";
import { openModal, showToast } from "@/store/slices/uiSlice";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  primaryLabel = "Yeni İşlem",
  compact = false,
  onPrimaryClick,
  onFilterClick,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryLabel?: string;
  compact?: boolean;
  onPrimaryClick?: () => void;
  onFilterClick?: () => void;
}) {
  const dispatch = useAppDispatch();

  return (
    <div className={`page-header ${compact ? "is-compact" : ""}`}>
      <div>
        {eyebrow && <span className="breadcrumb">{eyebrow}</span>}
        <h1>
          {title} {icon}
        </h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-actions">
        <button className="button button-secondary">
          <CalendarDays /> {formatLongDate()} <ChevronDown />
        </button>
        <button
          className="button button-secondary page-filter-button"
          onClick={() => {
            if (onFilterClick) onFilterClick();
            else dispatch(showToast("Filtreler güncellendi."));
          }}
        >
          <Filter /> Filtrele
        </button>
        {title.toLocaleLowerCase("tr-TR").includes("finans") && (
          <button
            className="button button-secondary"
            onClick={() => dispatch(showToast("Rapor indirilmeye hazır."))}
          >
            <FileDown /> Rapor Al
          </button>
        )}
        <button
          className="button button-primary"
          onClick={() => {
            if (onPrimaryClick) onPrimaryClick();
            else dispatch(openModal("add"));
          }}
        >
          <Plus /> {primaryLabel}
        </button>
      </div>
    </div>
  );
}
