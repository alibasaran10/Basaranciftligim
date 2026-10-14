import {
  BadgeCheck,
  Clover,
  Landmark,
  Wheat,
  type LucideIcon,
} from "lucide-react";

const logos: Array<[LucideIcon, string]> = [
  [Wheat, "Başaran Çiftliği"],
  [Clover, "Çırpıcı Çiftliği"],
  [Landmark, "Has Çetin Çiftliği"],
  [BadgeCheck, "Yalova Gül"],
];

export function LogoRail() {
  return (
    <div className="logo-rail" aria-label="Bizi tercih eden kurumlar">
      <div className="logo-track">
        {[...logos, ...logos, ...logos].map(([Icon, label], index) => (
          <div className="partner-logo" key={`${label}-${index}`}>
            <Icon />
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}