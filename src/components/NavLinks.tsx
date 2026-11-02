'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { name: string; slug: string };

/** Menu of editorias. Highlights "Início" on the home and the editoria at /editoria/{slug}. */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = pathname === '/' ? '' : pathname.startsWith('/editoria/') ? decodeURIComponent(pathname.slice('/editoria/'.length)) : null;
  const current = (slug: string) => (active === slug ? 'page' : undefined);
  return (
    <div className="wrap nav-inner">
      <Link href="/" aria-current={current('')}>Início</Link>
      {items.map((c) => (
        <Link key={c.slug} href={'/editoria/' + c.slug} aria-current={current(c.slug)}>{c.name}</Link>
      ))}
    </div>
  );
}
