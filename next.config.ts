import type { NextConfig } from 'next';

// Read when `next build` runs: the rewrites below are written into the build output, so the build
// must see the production API_URL (see README).
const apiUrl = process.env.API_URL || 'http://localhost:4000/api';

const config: NextConfig = {
  poweredByHeader: false,
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
    return [{ source: '/media/:path*', destination: apiUrl + '/media/:path*' }];
  },
};

export default config;
