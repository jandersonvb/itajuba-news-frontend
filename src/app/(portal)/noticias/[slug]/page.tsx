import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { absoluteUrl, Article, dateTimeLabel, fetchPublic, siteUrl, wasUpdated } from '@/lib/api';
import { alternates, DEFAULT_OG_IMAGE, OPEN_GRAPH, publisherLd } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

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
    <main className="article-page">
      <JsonLd data={structuredData(a)}/>
      <header className="article-header">
        {a.demo && <div className="notice">Matéria demonstrativa. Não relata um acontecimento real. Fotografia ilustrativa.</div>}
        {a.category
          ? <Link className="category" href={'/editoria/' + a.category.slug}>{a.category.name}</Link>
          : <span className="category">Itajubá News</span>}
        <h1>{a.title}</h1>
        <p className="article-excerpt">{a.excerpt}</p>
        <div className="byline">
          <span>Por <b>{a.author}</b></span>
          {a.publishedAt && <time dateTime={a.publishedAt}>{dateTimeLabel(a.publishedAt)}</time>}
          {wasUpdated(a) && <span>Atualizado em <time dateTime={a.updatedAt}>{dateTimeLabel(a.updatedAt)}</time></span>}
        </div>
      </header>
      {a.imageUrl && (
        <figure className="article-figure">
          <img className="article-image" src={a.imageUrl} alt={a.title} fetchPriority="high"/>
        </figure>
      )}
      <div className="article-content">{a.content.split('\n').filter(Boolean).map((text, i) => <p key={i}>{text}</p>)}</div>
      <div className="article-more">
        {a.category
          ? <Link href={'/editoria/' + a.category.slug}>Mais notícias de {a.category.name} <span aria-hidden="true">→</span></Link>
          : <Link href="/">Voltar para a capa <span aria-hidden="true">→</span></Link>}
      </div>
    </main>
  );
}
