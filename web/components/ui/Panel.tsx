export function Panel({
  title,
  action,
  className = "",
  id,
  style,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={style} className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          {title && <h2>{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
