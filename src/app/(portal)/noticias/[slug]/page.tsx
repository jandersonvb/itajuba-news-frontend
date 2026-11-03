import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { absoluteUrl, Article, dateTimeLabel, fetchPublic, siteUrl, wasUpdated } from '@/lib/api';
import { alternates, DEFAULT_OG_IMAGE, OPEN_GRAPH, publisherLd } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { articleColumn, categoryTag, cx, excerpt, notice } from '@/lib/styles';

type Props = { params: Promise<{ slug: string }> };

async function article(slug: string) {
  const r = await fetchPublic('/articles/' + encodeURIComponent(slug));
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error('Matéria indisponível');
  return r.json() as Promise<Article>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await article((await params).slug);
  const path = '/noticias/' + a.slug;
  return {
    title: a.title,
    description: a.excerpt,
    alternates: alternates(path),
    robots: a.demo ? { index: false, follow: false } : undefined,
    openGraph: {
      ...OPEN_GRAPH,
      type: 'article',
      url: path,
      title: a.title,
      description: a.excerpt,
      publishedTime: a.publishedAt ?? undefined,
      modifiedTime: a.updatedAt,
      section: a.category?.name,
      authors: [a.author],
      // This object replaces the layout's, opengraph-image included: without a photo, repeat the default.
      images: a.imageUrl ? [{ url: a.imageUrl, alt: a.title }] : [DEFAULT_OG_IMAGE],
    },
  };
}

/** NewsArticle and breadcrumb (Início → editoria → matéria) for search engines and Google Notícias. */
function structuredData(a: Article) {
  const url = siteUrl() + '/noticias/' + a.slug;
  const crumbs = [
    { name: 'Início', item: siteUrl() },
    ...(a.category ? [{ name: a.category.name, item: siteUrl() + '/editoria/' + a.category.slug }] : []),
    { name: a.title, item: url },
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: a.title.length > 110 ? a.title.slice(0, 109).trimEnd() + '…' : a.title,
      description: a.excerpt,
      image: a.imageUrl ? absoluteUrl(a.imageUrl) : undefined,
      datePublished: a.publishedAt ?? a.updatedAt,
      dateModified: a.updatedAt,
      author: { '@type': a.author.startsWith('Redação') ? 'Organization' : 'Person', name: a.author },
      publisher: publisherLd(),
      mainEntityOfPage: url,
      articleSection: a.category?.name,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb })),
    },
  ];
}

export default async function News({ params }: Props) {
  const a = await article((await params).slug);
  return (
    <main className="pt-[clamp(28px,5vw,64px)] pb-[72px]">
      <JsonLd data={structuredData(a)}/>
      <header className={articleColumn}>
        {a.demo && <div className={cx(notice, 'mt-0')}>Matéria demonstrativa. Não relata um acontecimento real. Fotografia ilustrativa.</div>}
        {a.category
          ? <Link className={cx(categoryTag(), 'hover:bg-red-dark')} href={'/editoria/' + a.category.slug}>{a.category.name}</Link>
          : <span className={categoryTag()}>Itajubá News</span>}
        <h1 className="my-[18px] text-[clamp(1.875rem,1.2rem+2.8vw,3.25rem)] leading-[1.15] tracking-[-0.025em]">{a.title}</h1>
        <p className={excerpt}>{a.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-[18px] gap-y-1 border-y border-line py-3.5 text-15 text-muted">
          <span>Por <b className="font-semibold text-ink">{a.author}</b></span>
          {a.publishedAt && <time dateTime={a.publishedAt}>{dateTimeLabel(a.publishedAt)}</time>}
          {wasUpdated(a) && <span>Atualizado em <time dateTime={a.updatedAt}>{dateTimeLabel(a.updatedAt)}</time></span>}
        </div>
      </header>
      {a.imageUrl && (
        <figure className="mx-auto my-9 max-w-[calc(1080px+2*var(--gutter))] px-(--gutter) max-sm:my-7 max-sm:px-0">
          {/* Reserves a 3:2 box (the usual news photo) while the image loads; once loaded, its own proportion applies. */}
          <img className="block max-h-[640px] w-full rounded-md object-cover [aspect-ratio:auto_3/2] max-sm:rounded-none" src={a.imageUrl} alt={a.title} fetchPriority="high"/>
        </figure>
      )}
      <div className={cx(articleColumn, 'text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-[1.75] font-medium text-[#27272a] max-sm:text-18 [&_p+p]:mt-[1.1em]', !a.imageUrl && 'mt-9')}>{a.content.split('\n').filter(Boolean).map((text, i) => <p key={i}>{text}</p>)}</div>
      <div className={cx(articleColumn, 'mt-12 [&_a]:flex [&_a]:items-center [&_a]:justify-between [&_a]:gap-4 [&_a]:rounded-md [&_a]:bg-paper [&_a]:px-[22px] [&_a]:py-[18px] [&_a]:font-semibold [&_a]:transition-colors [&_a]:duration-150 [&_a:hover]:bg-[#ece9e2]')}>
        {a.category
          ? <Link href={'/editoria/' + a.category.slug}>Mais notícias de {a.category.name} <span aria-hidden="true">→</span></Link>
          : <Link href="/">Voltar para a capa <span aria-hidden="true">→</span></Link>}
      </div>
    </main>
  );
}
