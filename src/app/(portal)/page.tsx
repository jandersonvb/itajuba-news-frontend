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
import { categoryTag, cx, eyebrow, meta, sectionHeading } from '@/lib/styles';

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

/** Story on a photo, with a dark gradient under the text. */
const story = "group relative isolate block overflow-hidden rounded-md bg-coal text-white after:absolute after:inset-0 after:bg-[linear-gradient(180deg,rgb(0_0_0/0)_25%,rgb(0_0_0/0.5)_55%,rgb(0_0_0/0.88))] after:content-['']";
const storyImage = 'absolute inset-0 size-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.04]';
const storyCopy = 'absolute inset-x-0 bottom-0 z-1 p-[clamp(18px,2.4vw,32px)]';
const storyTitle = 'underline decoration-transparent decoration-2 underline-offset-[5px] transition-[text-decoration-color] duration-200 group-hover:decoration-white/70';

/** Main story with up to two more beside it (beside on desktop, below on tablets and phones). */
function Featured({ hero, sides }: { hero: Article; sides: Article[] }) {
  return (
    <>
      <div className={sectionHeading}><h2>Itajubá em destaque</h2><span className={eyebrow()}>O que move a nossa cidade</span></div>
      <section className={cx('grid h-[clamp(440px,38vw,600px)] gap-4 max-lg:h-auto', sides.length ? 'grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] max-lg:grid-cols-[minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]')}>
        <Link className={cx(story, 'animate-rise max-lg:aspect-[16/10] max-sm:aspect-[4/5]')} href={'/noticias/' + hero.slug}>
          {hero.imageUrl && <img className={storyImage} src={hero.imageUrl} alt="" fetchPriority="high"/>}
          <div className={storyCopy}>
            <span className={categoryTag()}>{categoryLabel(hero)}</span>
            <h1 className={cx(storyTitle, 'mt-3.5 mb-3 max-w-[22ch] text-[clamp(1.625rem,1.05rem+2vw,2.75rem)] leading-[1.15] tracking-[-0.025em]')}>{hero.title}</h1>
            <p className="mb-3 max-w-[62ch] text-16 leading-[1.5] text-[#e7e7ea] max-sm:line-clamp-3">{hero.excerpt}</p>
            <div className={meta('text-[#d2d2d7]')}>{hero.author} · {dateLabel(hero.publishedAt)}</div>
          </div>
        </Link>
        {sides.length > 0 && (
          <div className="grid auto-rows-[minmax(0,1fr)] gap-4 max-lg:auto-cols-[minmax(0,1fr)] max-lg:grid-flow-col max-lg:auto-rows-auto max-sm:grid-flow-row">
            {sides.map((a, i) => (
              <Link className={cx(story, 'animate-rise max-lg:aspect-[4/3] max-sm:aspect-[16/10]', i ? '[animation-delay:160ms]' : '[animation-delay:80ms]')} href={'/noticias/' + a.slug} key={a.id}>
                {a.imageUrl && <img className={storyImage} src={a.imageUrl} alt="" loading="lazy" decoding="async"/>}
                <div className={storyCopy}>
                  <span className={categoryTag()}>{categoryLabel(a)}</span>
                  <h3 className={cx(storyTitle, 'mt-2.5 mb-2 text-[clamp(1.1rem,0.95rem+0.55vw,1.375rem)] leading-[1.25]')}>{a.title}</h3>
                  <div className={meta('text-[#d2d2d7]')}>{dateLabel(a.publishedAt)}</div>
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
            <div className={sectionHeading}><Heading>Últimas notícias</Heading><span className={eyebrow()}>{news.total} matéria(s)</span></div>
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
