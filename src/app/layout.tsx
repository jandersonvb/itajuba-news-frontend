import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { siteUrl } from '@/lib/api';
import { FEED_TYPES, OPEN_GRAPH, SITE_DESCRIPTION } from '@/lib/seo';
import './globals.css';

// One family for headlines, text and interface, as on jovempan.com.br. Variable: weights 200–800.
// Exposed as --font-manrope; globals.css builds Tailwind's --font-sans on it.
const sans = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

// Share image: opengraph-image.tsx in this folder. X (twitter:image) reuses og:image.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Itajubá News • A cidade acontece aqui', template: '%s | Itajubá News' },
  description: SITE_DESCRIPTION,
  openGraph: { ...OPEN_GRAPH, type: 'website' },
  twitter: { card: 'summary_large_image' },
  alternates: { types: FEED_TYPES },
  ...(googleVerification && { verification: { google: googleVerification } }),
};

export const viewport: Viewport = { themeColor: '#141416' };

/** Only the document: the portal chrome lives in (portal)/layout.tsx, the newsroom has its own. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
