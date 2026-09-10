export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <section className="simple-hero">
        <div className="container">
          <span className="eyebrow">Basaranciftligim yasal bilgiler</span>
          <h1>{title}</h1>
          <p>Son güncelleme: 24 Temmuz 2026</p>
        </div>
      </section>
      <article className="container legal-content">{children}</article>
    </main>
  );
}
