import Link from 'next/link';
import { api, Category } from '@/lib/api';
import { button } from '@/lib/styles';
import NavLinks from './NavLinks';

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
      <a className="absolute -top-15 left-3 z-100 rounded-md bg-ink px-3.5 py-2.5 font-semibold text-white focus:top-3" href="#conteudo">Pular para o conteúdo</a>
      <div className="bg-ink text-13 text-[#c8c8ce] max-sm:text-12">
        <div className="wrap flex min-h-[38px] items-center gap-[22px]">
          <span><b className="font-semibold text-white">Itajubá, MG</b> · Sul de Minas</span>
          <span className="text-[#95959d] first-letter:uppercase max-lg:hidden">{today()}</span>
          <Link href="/admin" className="ml-auto inline-flex items-center gap-[7px] py-2 font-semibold text-white transition-colors duration-150 hover:text-[#ffb4b7]">
            <svg className="size-3.5" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            Área da redação
          </Link>
        </div>
      </div>
      <header className="wrap flex items-center justify-between gap-6 py-4 max-sm:py-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-[22px]">
          {/* The logo file has wide white margins; cover crops them. */}
          <img src="/logo.png" alt="Itajubá News" className="block h-[86px] w-[150px] object-cover max-sm:h-[66px] max-sm:w-[116px]" width={225} height={225}/>
          <span className="border-l border-line pl-[22px] text-15 leading-[1.45] font-medium text-muted max-sm:hidden">A cidade acontece aqui.<br/>Informação que conecta você.</span>
        </Link>
        <Link className={button('red', 'header')} href="/anuncie">Anuncie aqui <span aria-hidden="true">↗</span></Link>
      </header>
      <nav className="sticky top-0 z-30 border-y border-line bg-white/94 backdrop-blur-[10px] backdrop-saturate-[1.4]" aria-label="Editorias">
        <NavLinks items={items}/>
      </nav>
    </>
  );
}
