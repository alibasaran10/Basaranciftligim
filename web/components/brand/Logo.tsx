import { Beef } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-logo ${compact ? "is-compact" : ""}`}>
      <span className="brand-mark">
        <Beef />
      </span>
      {!compact && (
        <span>
          <strong>Basaranciftligim</strong>
          <small>YENİLİKÇİ ÇİFTLİK YÖNETİM SİSTEMİ</small>
        </span>
      )}
    </div>
  );
}

