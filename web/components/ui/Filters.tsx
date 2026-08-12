"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";

export type FilterSelect = {
  /** Sorgu parametresi adi (orn: "status") */
  name: string;
  /** Hicbir secim yokken gorunen etiket (orn: "Tüm Durumlar") */
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
};

export function Filters({
  placeholder = "Ara...",
  selects = [],
  search = "",
  onSearchChange,
  onSelectChange,
  showExtraActionButtons = false,
}: {
  placeholder?: string;
  selects?: FilterSelect[];
  search?: string;
  onSearchChange?: (value: string) => void;
  onSelectChange?: (name: string, value: string) => void;
  showExtraActionButtons?: boolean;
}) {
  return (
    <div className="filters">
      <label>
        <Search />
        <input
          placeholder={placeholder}
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </label>
      {selects.map((item) => (
        <select
          key={item.name}
          aria-label={item.placeholder}
          value={item.value ?? ""}
          onChange={(event) => onSelectChange?.(item.name, event.target.value)}
        >
          <option value="">{item.placeholder}</option>
          {item.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {showExtraActionButtons && (
        <>
          <button className="icon-button" aria-label="Filtreler">
            <Filter />
          </button>
          <button className="icon-button" aria-label="Görünüm ayarları">
            <SlidersHorizontal />
          </button>
        </>
      )}
    </div>
  );
}
