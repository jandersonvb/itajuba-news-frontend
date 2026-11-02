import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/api';

/**
 * Only the production site (SITE_URL with https) is open to crawlers. Local and test builds block
 * everything, so they never compete with it in search results. Read when `next build` runs.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  if (!base.startsWith('https://')) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: [base + '/sitemap.xml', base + '/news-sitemap.xml'],
  };
}
