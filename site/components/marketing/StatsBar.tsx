import {
  BadgeCheck,
  Database,
  Map,
  UsersRound,
} from "lucide-react";

import { AnimatedCounter } from "../shared/AnimatedCounter";

const stats = [
  { icon: Map, value: 12450, suffix: "+ da", label: "Yönetilen Tarla" },
  { icon: UsersRound, value: 1250, suffix: "+", label: "Takip Edilen Hayvan" },
  { icon: Database, value: 500, suffix: "M+", label: "İşlenen Veri" },
  { icon: BadgeCheck, value: 99.9, suffix: "%", label: "Sistem Sürekliliği" },
];

export function StatsBar() {
  return (
    <div className="container stats-bar">
      {stats.map(({ icon: Icon, value, suffix, label }) => (
        <div className="stat-item" key={label}>
          <span className="stat-icon">
            <Icon />
          </span>
          <span>
            <strong>
              <AnimatedCounter value={value} suffix={suffix} />
            </strong>
            <small>{label}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
