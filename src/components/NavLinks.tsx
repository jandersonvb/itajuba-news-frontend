'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export type NavItem = { name: string; slug: string };

/** `active`: '' for "Início", a category slug, or null/undefined for none. */
export function NavList({ items, active }: { items: NavItem[]; active?: string | null }) {
  const current = (slug: string) => (active === slug ? 'page' : undefined);
  return (
    <div className="wrap nav-inner">
      <Link href="/" aria-current={current('')}>Início</Link>
      {items.map((c) => (
        <Link key={c.slug} href={'/?editoria=' + c.slug} aria-current={current(c.slug)}>{c.name}</Link>
      ))}
    </div>
  );
}

/** Highlights the section being read. Needs a Suspense boundary (useSearchParams). */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  return <NavList items={items} active={pathname === '/' ? params.get('editoria') || '' : null}/>;
}
