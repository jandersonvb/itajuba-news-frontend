import { api, SitemapEntry, siteUrl } from '@/lib/api';
import { SITE_NAME } from '@/lib/seo';
import { xmlEscape, xmlResponse } from '@/lib/xml';

// Rebuilt at most once a minute; publishing in the admin expires it right away (cache tag `portal`).
export const revalidate = 60;

/** Google Notícias reads only articles from the last two days, up to 1,000 per sitemap. */
const WINDOW_MS = 48 * 60 * 60 * 1000;
const LIMIT = 1000;

/** Sitemap for Google Notícias. Without recent articles (or without the API) the empty urlset is still valid. */
export async function GET() {
  const entries = await api<SitemapEntry[]>('/sitemap').catch((): SitemapEntry[] => []);
  const since = Date.now() - WINDOW_MS;
  const urls = entries
    .filter((a) => new Date(a.publishedAt).getTime() >= since)
    .slice(0, LIMIT)
    .map((a) =>
      '<url>' +
      `<loc>${xmlEscape(siteUrl() + '/noticias/' + a.slug)}</loc>` +
      '<news:news>' +
      `<news:publication><news:name>${xmlEscape(SITE_NAME)}</news:name><news:language>pt</news:language></news:publication>` +
      `<news:publication_date>${xmlEscape(a.publishedAt)}</news:publication_date>` +
      `<news:title>${xmlEscape(a.title)}</news:title>` +
      '</news:news>' +
      '</url>',
    );
  return xmlResponse(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
      urls.join('\n') +
      '\n</urlset>\n',
    'application/xml',
  );
}
