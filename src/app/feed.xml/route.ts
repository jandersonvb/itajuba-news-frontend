import { absoluteUrl, api, Article, ArticlePage, siteUrl } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';
import { xmlEscape, xmlResponse } from '@/lib/xml';

// Rebuilt at most once a minute; publishing in the admin expires it right away (cache tag `portal`).
export const revalidate = 60;

function item(a: Article) {
  const url = xmlEscape(siteUrl() + '/noticias/' + a.slug);
  return [
    '<item>',
    `<title>${xmlEscape(a.title)}</title>`,
    `<link>${url}</link>`,
    `<guid isPermaLink="true">${url}</guid>`,
    `<pubDate>${new Date(a.publishedAt ?? a.updatedAt).toUTCString()}</pubDate>`,
    `<description>${xmlEscape(a.excerpt)}</description>`,
    a.category ? `<category>${xmlEscape(a.category.name)}</category>` : '',
    a.imageUrl ? `<media:content url="${xmlEscape(absoluteUrl(a.imageUrl))}" medium="image"/>` : '',
    '</item>',
  ].filter(Boolean).join('\n');
}

/** RSS 2.0 with the 12 latest articles (the first page of the API), demo ones left out. */
export async function GET() {
  const base = siteUrl();
  const page = await api<ArticlePage>('/articles?page=1').catch((): ArticlePage | null => null);
  const articles = (page?.items ?? []).filter((a) => !a.demo);
  return xmlResponse(
    [
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
      '<channel>',
      `<title>${xmlEscape(SITE_NAME)}</title>`,
      `<link>${xmlEscape(base)}</link>`,
      `<description>${xmlEscape(SITE_DESCRIPTION)}</description>`,
      '<language>pt-BR</language>',
      `<atom:link href="${xmlEscape(base + '/feed.xml')}" rel="self" type="application/rss+xml"/>`,
      ...articles.map(item),
      '</channel>',
      '</rss>',
      '',
    ].join('\n'),
    'application/rss+xml',
  );
}
