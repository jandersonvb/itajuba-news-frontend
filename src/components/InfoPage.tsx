/** Institutional page (expediente, contato, privacidade, termos), in the article's text column. */
export default function InfoPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="article-page">
      <header className="article-header">
        <span className="category">Institucional</span>
        <h1>{title}</h1>
        <p className="article-excerpt">{intro}</p>
      </header>
      <div className="article-content info-content">{children}</div>
    </main>
  );
}
