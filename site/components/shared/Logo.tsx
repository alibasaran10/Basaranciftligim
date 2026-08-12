import { Beef } from "lucide-react";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="SÜRÜM ana sayfa">
      <span className="brand-mark" aria-hidden="true">
        <Beef size={compact ? 24 : 29} strokeWidth={1.8} />
      </span>
      <span className="brand-copy">
        <strong>SÜRÜM</strong>
        {!compact && <small>Akıllı Çiftlik Yönetimi</small>}
      </span>
    </Link>
  );
}
