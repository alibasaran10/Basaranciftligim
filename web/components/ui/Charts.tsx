"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#168346", "#2f9b55", "#f2ab18", "#ec5a4f", "#5f83d8", "#8764cc"];

/**
 * Grafik ekseni icin kisa sayi bicimi.
 * Gercek veriler (TL tutarlari, litre toplamlari) alti haneye kadar cikabildigi
 * icin eksende tam sayi gostermek etiketleri kirpiyor; burada 12.500 -> "12,5 B",
 * 1.400.000 -> "1,4 Mn" seklinde kisaltilir.
 */
const compactNumber = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

function axisTick(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${compactNumber.format(value / 1_000_000)} Mn`;
  if (abs >= 10_000) return `${compactNumber.format(Math.round(value / 1000))} B`;
  return compactNumber.format(value);
}

/** Tooltip'te tam deger gosterilir (eksen kisaltilmis olsa da). */
const tooltipFormatter = (value: unknown) =>
  typeof value === "number" ? compactNumber.format(value) : String(value ?? "");


export function TrendChart({
  data,
  color = "#168346",
  secondary = false,
}: {
  data: Array<Record<string, string | number>>;
  color?: string;
  secondary?: boolean;
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-line)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={46}
            tickFormatter={axisTick}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: "var(--line)" }}
            formatter={tooltipFormatter}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#area-${color.replace("#", "")})`}
          />
          {secondary && (
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="#6d7784"
              strokeWidth={1.8}
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  finance = false,
}: {
  data: Array<Record<string, string | number>>;
  finance?: boolean;
}) {
  const Chart = finance ? ComposedChart : BarChart;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data}>
          <CartesianGrid stroke="var(--chart-line)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={48}
            tickFormatter={axisTick}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: "var(--line)" }}
            formatter={tooltipFormatter}
          />
          {finance && <Legend />}
          <Bar dataKey="value" name={finance ? "Gelir" : "Değer"} fill="#168346" radius={[5, 5, 0, 0]} />
          {finance && (
            <>
              <Bar dataKey="secondary" name="Gider" fill="#ef6358" radius={[5, 5, 0, 0]} />
              <Line type="monotone" dataKey="profit" name="Kâr" stroke="#2f7edb" strokeWidth={2.2} />
            </>
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  total,
  label = "Toplam",
}: {
  data: { name: string; value: number }[];
  total: string;
  label?: string;
}) {
  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={1}
              stroke="none"
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <span>
          <small>{label}</small>
          <strong>{total}</strong>
        </span>
      </div>
      <div className="chart-legend">
        {data.map((item, index) => (
          <span key={item.name}>
            <i style={{ background: colors[index % colors.length] }} />
            <b>{item.name}</b>
            <small>{compactNumber.format(item.value)}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function RingProgress({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="ring-progress" style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}>
      <span>
        <strong>{value}%</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}
