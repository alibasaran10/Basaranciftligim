"use client";

import { Filter, Search } from "lucide-react";

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
  onFilterToggle,
  isFilterActive = false,
}: {
  placeholder?: string;
  selects?: FilterSelect[];
  search?: string;
  onSearchChange?: (value: string) => void;
  onSelectChange?: (name: string, value: string) => void;
  onFilterToggle?: () => void;
  isFilterActive?: boolean;
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
      <button
        className={`icon-button ${isFilterActive ? "is-active" : ""}`}
        aria-label="Fiyat Filtrele"
        title="Fiyat Aralığı Filtrele"
        onClick={onFilterToggle}
        style={isFilterActive ? { background: "var(--primary)", color: "#fff" } : undefined}
      >
        <Filter size={18} />
      </button>
    </div>
  );
}
