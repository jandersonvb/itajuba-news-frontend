import Link from 'next/link';

/** Steps of a story in the newsroom, shown in the crawl along the bottom of the panel. */
const NEWSROOM = ['Pauta', 'Apuração', 'Entrevista', 'Checagem', 'Fotografia', 'Redação', 'Edição', 'Publicação'];

/** Dark brand panel on the left of the login, forgot-password and new-password screens. */
export default function LoginBrand() {
  return (
    <section className="login-brand" aria-label="Itajubá News">
      <Link href="/" className="logo-dark"><img src="/logo-dark.png" alt="Itajubá News" width={400} height={220}/></Link>
      <div className="login-brand-copy">
        <span className="eyebrow">Área da redação</span>
        <h1>A cidade acontece aqui. A notícia começa por você.</h1>
        <p>Publique matérias, organize as editorias e cuide dos patrocinadores do portal.</p>
      </div>
      {/* Decorative. The list is repeated so the crawl loops without a gap. */}
      <div className="login-crawl" aria-hidden="true">
        <b className="ticker-label">Plantão</b>
        <div className="login-crawl-track">
          <ul>{[...NEWSROOM, ...NEWSROOM].map((step, i) => <li key={i}>{step}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
