export function Badge({
  children,
  tone = "green",
  className = "",
  style,
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "purple" | "gray";
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span style={style} className={`badge badge-${tone} ${className}`}>{children}</span>;
}
