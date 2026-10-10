import type { Metadata } from 'next';

// Covers the login page too, which is a client component and cannot export metadata.
export const metadata: Metadata = { title: 'Área da redação', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
