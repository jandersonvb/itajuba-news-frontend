'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/lib/styles';

export type NavItem = { name: string; slug: string };

/** Red underline that grows from the left: a third on hover, whole on the current page. */
const link = (current: boolean) =>
  cx(
    'relative flex min-h-[54px] items-center text-15 leading-none font-semibold transition-colors duration-150',
    "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:bg-red after:transition-transform after:duration-[250ms] after:ease-soft after:content-['']",
    current ? 'text-ink after:scale-x-100' : 'text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-[0.35]',
  );

/** Menu of editorias. Highlights "Início" on the home and the editoria at /editoria/{slug}. */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = pathname === '/' ? '' : pathname.startsWith('/editoria/') ? decodeURIComponent(pathname.slice('/editoria/'.length)) : null;
  const current = (slug: string) => (active === slug ? 'page' : undefined);
  return (
    // Phones: the menu scrolls sideways and fades out on the right, hinting at more items.
    <div className="wrap flex gap-[30px] overflow-x-auto whitespace-nowrap [scrollbar-width:none] max-lg:gap-6 max-lg:pr-14 max-lg:[mask-image:linear-gradient(90deg,#000_calc(100%-56px),transparent)] [&::-webkit-scrollbar]:hidden">
      <Link href="/" aria-current={current('')} className={link(active === '')}>Início</Link>
      {items.map((c) => (
        <Link key={c.slug} href={'/editoria/' + c.slug} aria-current={current(c.slug)} className={link(active === c.slug)}>{c.name}</Link>
      ))}
    </div>
  );
}
