import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { api, Article, ArticlePage, dateLabel, siteUrl } from '@/lib/api';
import { alternates, publisherLd, SITE_NAME } from '@/lib/seo';
import { pageParam, param, SearchParams } from '@/lib/search-params';
import JsonLd from '@/components/JsonLd';
import NewsIndex, { Unavailable } from '@/components/NewsIndex';
import NewsList, { categoryLabel } from '@/components/NewsList';
import Pagination from '@/components/Pagination';

/**
 * New address of the old listing URLs, still found in shared links: `/?editoria=x` became
 * `/editoria/x` and `/?busca=y` became `/busca?q=y`. Null for the home itself.
 */
function legacyUrl(p: Awaited<SearchParams>) {
  const q = param(p.busca).trim();
  const editoria = param(p.editoria);
  if (!q && !editoria) return null;
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (q && editoria) query.set('editoria', editoria);
  const page = pageParam(p.pagina);
  if (page > 1) query.set('pagina', String(page));
  const path = q ? '/busca' : '/editoria/' + encodeURIComponent(editoria);
  return query.toString() ? path + '?' + query : path;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = pageParam((await searchParams).pagina);
  return { alternates: alternates(page > 1 ? '/?pagina=' + page : '/') };
}

/** The site and the newsroom, for search engines: name, logo and the search box. */
const structuredData = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl(),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: siteUrl() + '/busca?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  },
  { '@context': 'https://schema.org', ...publisherLd() },
];

/** Main story with up to two more beside it. */
function Featured({ hero, sides }: { hero: Article; sides: Article[] }) {
  return (
    <>
      <div className="section-heading"><h2>Itajubá em destaque</h2><span className="eyebrow">O que move a nossa cidade</span></div>
      <section className={'hero-grid' + (sides.length ? '' : ' solo')}>
        <Link className="story hero-main" href={'/noticias/' + hero.slug}>
          {hero.imageUrl && <img src={hero.imageUrl} alt="" fetchPriority="high"/>}
          <div className="story-copy">
            <span className="category">{categoryLabel(hero)}</span>
            <h1>{hero.title}</h1>
            <p>{hero.excerpt}</p>
            <div className="meta">{hero.author} · {dateLabel(hero.publishedAt)}</div>
          </div>
        </Link>
        {sides.length > 0 && (
          <div className="hero-side">
            {sides.map((a) => (
              <Link className="story" href={'/noticias/' + a.slug} key={a.id}>
                {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" decoding="async"/>}
                <div className="story-copy">
                  <span className="category">{categoryLabel(a)}</span>
                  <h3>{a.title}</h3>
                  <div className="meta">{dateLabel(a.publishedAt)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams;
  const legacy = legacyUrl(p);
  if (legacy) permanentRedirect(legacy);

  const page = pageParam(p.pagina);
  let news: ArticlePage | null = null;
  try {
    news = await api<ArticlePage>('/articles?page=' + page);
  } catch {}
  const articles = news?.items ?? [];
  const hero = page === 1 ? articles.find((a) => a.featured) || articles[0] : undefined;
  const sides = articles.filter((a) => a.id !== hero?.id).slice(0, 2);
  // Below the featured stories the list is a section; without them (page 2 on) it is the page title.
  const Heading = hero ? 'h2' : 'h1';

  return (
    <>
      <JsonLd data={structuredData()}/>
      <NewsIndex top={hero && <Featured hero={hero} sides={sides}/>}>
        {news ? (
          <>
            <div className="section-heading"><Heading>Últimas notícias</Heading><span className="eyebrow">{news.total} matéria(s)</span></div>
            <NewsList articles={news.items} empty="Nenhuma notícia publicada ainda."/>
            <Pagination path="/" page={page} total={news.total}/>
          </>
        ) : (
          <Unavailable/>
        )}
      </NewsIndex>
    </>
  );
}
