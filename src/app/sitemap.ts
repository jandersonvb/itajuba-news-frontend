import type { MetadataRoute } from 'next';
import { api, Category, SitemapEntry, siteUrl } from '@/lib/api';

// Rebuilt at most once a minute; publishing in the admin expires it right away (cache tag `portal`).
export const revalidate = 60;

/** Pages that do not come from the API. */
const PAGES = ['/', '/anuncie', '/expediente', '/contato', '/privacidade', '/termos'];

/** Home, fixed pages, editorias and every published article. Without the API, only the fixed pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, articles] = await Promise.all([
    api<Category[]>('/categories').catch((): Category[] => []),
    api<SitemapEntry[]>('/sitemap').catch((): SitemapEntry[] => []),
  ]);
  return [
    ...PAGES.map((path) => ({ url: base + path })),
    ...categories.map((c) => ({ url: base + '/editoria/' + c.slug })),
    ...articles.map((a) => ({ url: base + '/noticias/' + a.slug, lastModified: a.updatedAt })),
  ];
}
