import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

// One family for headlines, text and interface, as on jovempan.com.br. Variable: weights 200–800.
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: 'Itajubá News • A cidade acontece aqui', template: '%s | Itajubá News' },
  description: 'Notícias de Itajubá e do Sul de Minas. Informação que conecta você.',
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
