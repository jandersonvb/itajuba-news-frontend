import { Suspense } from 'react';
import Link from 'next/link';
import { api, Category } from '@/lib/api';
import NavLinks, { NavList } from './NavLinks';

/** Menu sections, in the order set in the admin. Without the API the menu shows only "Início". */
async function sections() {
  try {
    const categories = await api<Category[]>('/categories');
    return Array.isArray(categories) ? categories.map((c) => ({ name: c.name, slug: c.slug })) : [];
  } catch {
    return [];
  }
}

const today = () => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date());

export default async function Header() {
  const items = await sections();
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="topbar">
        <div className="wrap">
          <span><b>Itajubá, MG</b> · Sul de Minas</span>
          <span className="topbar-date">{today()}</span>
          <Link href="/admin" className="topbar-login">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            Área da redação
          </Link>
        </div>
      </div>
      <header className="wrap masthead">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Itajubá News" className="logo" width={225} height={225}/>
          <span className="tagline">A cidade acontece aqui.<br/>Informação que conecta você.</span>
        </Link>
        <Link className="btn" href="/anuncie">Anuncie aqui <span aria-hidden="true">↗</span></Link>
      </header>
      <nav className="site-nav" aria-label="Editorias">
        <Suspense fallback={<NavList items={items}/>}>
          <NavLinks items={items}/>
        </Suspense>
      </nav>
    </>
  );
}
