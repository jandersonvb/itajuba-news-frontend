import Link from 'next/link';
import { api, Campaign, Category, PublicSponsor } from '@/lib/api';
import { button, eyebrow, notice, sectionHeading, subtitle, textLink, tickerLabel } from '@/lib/styles';
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
        <div className="flex min-w-0 items-center gap-3.5 py-[18px] text-15 text-ink-soft max-sm:py-3.5 max-sm:text-14">
          <b className={tickerLabel()}>NO RADAR</b>
          <span className="truncate">Notícias, serviços e histórias de quem vive em Itajubá.</span>
        </div>
        <AdSlot campaigns={leader} slot="leaderboard"/>
        <SearchForm categories={categories} q={search.q} editoria={search.editoria}/>
        {top}
        <Partners sponsors={sponsors}/>
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-12 max-xl:grid-cols-[minmax(0,1fr)_280px] max-xl:gap-8 max-lg:grid-cols-[minmax(0,1fr)]">
          <section>{children}</section>
          <aside className="grid gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <AdSlot campaigns={side} slot="sidebar"/>
            <div className="rounded-md bg-paper p-[26px]">
              <h3 className="mb-2.5 text-22">O seu negócio tem uma história.</h3>
              <p className={subtitle + ' mb-3.5'}>Conecte sua marca ao público local com uma campanha no portal.</p>
              <Link href="/anuncie" className={textLink}>Conheça os espaços ↗</Link>
            </div>
          </aside>
        </div>
      </div>
      <section className="mt-[72px] border-t border-line bg-paper pt-14 pb-16 max-sm:mt-12 max-sm:pt-10 max-sm:pb-12">
        <div className="wrap">
          <div className={sectionHeading}><h2>Sua empresa faz parte desta história.</h2><span className={eyebrow()}>Publicidade local</span></div>
          <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
            {plans.map(([title, desc], i) => (
              <div className="flex flex-col rounded-md border border-line bg-white p-[26px] transition-[border-color,box-shadow,transform] duration-200 ease-soft hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card" key={title}>
                <span className="text-13 leading-none font-bold tracking-[0.1em] text-red-text" aria-hidden="true">0{i + 1}</span>
                <h3 className="mt-3.5 mb-2 text-24">{title}</h3>
                <p className="mb-[22px] flex-1 leading-[1.55] text-muted">{desc}</p>
                <Link className={button('light') + ' w-full'} href={'/anuncie?interesse=' + encodeURIComponent(title)}>Solicitar proposta ↗</Link>
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
  return <div className={notice}>Não foi possível carregar as notícias. Verifique se a API está disponível e o banco foi configurado.</div>;
}
