export function Badge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "purple" | "gray";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
