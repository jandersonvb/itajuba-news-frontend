import Link from 'next/link';
import { api, Campaign, Category, PublicSponsor } from '@/lib/api';
import AdSlot from './AdSlot';
import Partners from './Partners';
import SearchForm from './SearchForm';

const plans = [
  ['Banner premium', 'Sua marca na página inicial do portal.'],
  ['Banner lateral', 'Presença junto aos conteúdos da cidade.'],
  ['Patrocínio de editoria', 'Converse com a equipe sobre uma proposta personalizada.'],
];

type Props = {
  /** Initial values of the search box. */
  search?: { q?: string; editoria?: string };
  /** Above the sponsors: the home's featured stories. */
  top?: React.ReactNode;
  /** The news column. */
  children: React.ReactNode;
};

/**
 * Frame of the listings (home, editorias and search): banners, search box, sponsors, sidebar and
 * the advertising plans. Without campaigns or sponsors the spaces show their placeholders.
 */
export default async function NewsIndex({ search = {}, top, children }: Props) {
  const [categories, leader, side, sponsors] = await Promise.all([
    api<Category[]>('/categories').catch((): Category[] => []),
    api<Campaign[]>('/campaigns?slot=leaderboard').catch((): Campaign[] => []),
    api<Campaign[]>('/campaigns?slot=sidebar').catch((): Campaign[] => []),
    api<PublicSponsor[]>('/sponsors').catch((): PublicSponsor[] => []),
  ]);
  return (
    <main>
      <div className="wrap">
        <div className="ticker"><b className="ticker-label">NO RADAR</b><span>Notícias, serviços e histórias de quem vive em Itajubá.</span></div>
        <AdSlot campaigns={leader} slot="leaderboard"/>
        <SearchForm categories={categories} q={search.q} editoria={search.editoria}/>
        {top}
        <Partners sponsors={sponsors}/>
        <div className="news-layout">
          <section>{children}</section>
          <aside>
            <AdSlot campaigns={side} slot="sidebar"/>
            <div className="side-box">
              <h3>O seu negócio tem uma história.</h3>
              <p className="subtitle">Conecte sua marca ao público local com uma campanha no portal.</p>
              <Link href="/anuncie" className="text-link">Conheça os espaços ↗</Link>
            </div>
          </aside>
        </div>
      </div>
      <section className="commercial">
        <div className="wrap">
          <div className="section-heading"><h2>Sua empresa faz parte desta história.</h2><span className="eyebrow">Publicidade local</span></div>
          <div className="plans">
            {plans.map(([title, desc]) => (
              <div className="plan" key={title}>
                <h3>{title}</h3>
                <p>{desc}</p>
                <Link className="btn light" href={'/anuncie?interesse=' + encodeURIComponent(title)}>Solicitar proposta ↗</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/** Shown in the news column when the API does not answer. */
export function Unavailable() {
  return <div className="notice">Não foi possível carregar as notícias. Verifique se a API está disponível e o banco foi configurado.</div>;
}
