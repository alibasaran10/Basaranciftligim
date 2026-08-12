import {
  BadgeCheck,
  Clover,
  Landmark,
  ShieldCheck,
  Wheat,
  type LucideIcon,
} from "lucide-react";

const logos: Array<[LucideIcon, string]> = [
  [Wheat, "Anadolu Süt"],
  [Clover, "Bereket Çiftliği"],
  [Landmark, "Tarım Kredi"],
  [BadgeCheck, "AgroNova Tarım"],
  [ShieldCheck, "TARSİM"],
  [Wheat, "Yeşilova Besicilik"],
];

export function LogoRail() {
  return (
    <div className="logo-rail" aria-label="Bizi tercih eden kurumlar">
      <div className="logo-track">
        {[...logos, ...logos].map(([Icon, label], index) => (
          <div className="partner-logo" key={`${label}-${index}`}>
            <Icon />
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
