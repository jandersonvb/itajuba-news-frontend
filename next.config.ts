import type { NextConfig } from 'next';
import { missingSiteInfo } from './src/lib/site';

// Read when `next build` runs: the rewrites below are written into the build output, so the build
// must see the production API_URL (see README).
const apiUrl = process.env.API_URL || 'http://localhost:4000/api';

// The publication details still appear as "[PREENCHER: ...]" on the institutional pages. A reminder, not an error.
// The build workers load this file again and inherit the environment, hence the flag: one warning per build.
if (process.env.NODE_ENV === 'production' && !process.env.SITE_INFO_CHECKED) {
  process.env.SITE_INFO_CHECKED = '1';
  const missing = missingSiteInfo();
  if (missing.length) console.warn(`⚠ src/lib/site.ts: preencha antes do lançamento: ${missing.join(', ')}`);
}

const config: NextConfig = {
  poweredByHeader: false,
  experimental: {
    agentUpgrade: 'security',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
  // Images uploaded in the admin are stored by the API and referenced as `/media/<file>`. Proxying
  // them keeps <img src> on the portal's own origin without exposing the API to browsers.
  async rewrites() {
    return [
      { source: '/media/:path*', destination: apiUrl + '/media/:path*' },
      // Browsers and crawlers ask for /favicon.ico directly; without this it is the 404 page, which queries the API.
      { source: '/favicon.ico', destination: '/logo.png' },
    ];
  },
};

export default config;
