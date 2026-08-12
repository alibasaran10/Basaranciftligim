import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  icon,
  label,
  value,
  unit,
  meta,
  trend,
  tone = "green",
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  meta?: string;
  trend?: "up" | "down" | "neutral";
  tone?: "green" | "blue" | "orange" | "red" | "purple";
  /** Veri gelene kadar deger yerine iskelet gosterilir (yerlesim kaymaz). */
  loading?: boolean;
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-copy">
        <small>{label}</small>
        <strong>
          {loading ? <i className="value-loading" /> : value} {unit && !loading && <em>{unit}</em>}
        </strong>
        {meta && !loading && (
          <span
            className={`stat-meta ${
              trend === "down" ? "is-down" : trend === "neutral" ? "" : "is-up"
            }`}
          >
            {trend === "up" && <ArrowUpRight />}
            {trend === "down" && <ArrowDownRight />}
            {meta}
          </span>
        )}
      </span>
    </article>
  );
}
