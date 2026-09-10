import { Beef } from "lucide-react";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Basaranciftligim ana sayfa">
      <span className="brand-mark" aria-hidden="true">
        <Beef size={compact ? 24 : 29} strokeWidth={1.8} />
      </span>
      <span className="brand-copy">
        <strong>Basaranciftligim</strong>
        {!compact && <small>Yenilikçi Çiftlik Yönetim Sistemi</small>}
      </span>
    </Link>
  );
}
