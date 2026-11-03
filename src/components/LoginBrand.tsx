import Link from 'next/link';
import { eyebrow, tickerLabel } from '@/lib/styles';

/** Steps of a story in the newsroom, shown in the crawl along the bottom of the panel. */
const NEWSROOM = ['Pauta', 'Apuração', 'Entrevista', 'Checagem', 'Fotografia', 'Redação', 'Edição', 'Publicação'];

/** Dark brand panel on the left of the login, forgot-password and new-password screens. */
export default function LoginBrand() {
  return (
    <section
      className="relative isolate flex flex-col justify-between gap-10 overflow-hidden bg-ink p-(--brand-pad) text-white [--brand-pad:clamp(28px,5vw,64px)] before:absolute before:inset-0 before:-z-1 before:halftone before:content-[''] max-lg:gap-6"
      aria-label="Itajubá News"
    >
      <Link href="/" className="block w-fit"><img className="block h-auto w-[clamp(150px,12vw,200px)]" src="/logo-dark.png" alt="Itajubá News" width={400} height={220}/></Link>
      {/* Copy centered between the logo and the crawl. */}
      <div className="my-auto">
        <span className={eyebrow('text-[#a5a5ad]')}>Área da redação</span>
        <h1 className="mt-4 mb-[18px] max-w-[14ch] text-[clamp(2rem,1.2rem+2.8vw,3.5rem)] leading-[1.1] tracking-[-0.025em] max-lg:text-[clamp(1.9rem,1.3rem+2.6vw,2.6rem)]">A cidade acontece aqui. A notícia começa por você.</h1>
        <p className="max-w-[42ch] text-17 leading-[1.6] text-[#b9b9c0] max-lg:hidden">Publique matérias, organize as editorias e cuide dos patrocinadores do portal.</p>
      </div>
      {/* Newsroom crawl along the bottom edge, like a TV news ticker. Decorative; the list is repeated so it loops without a gap. */}
      <div className="-mx-(--brand-pad) -mb-(--brand-pad) flex border-t border-white/10 bg-black/35" aria-hidden="true">
        <b className={tickerLabel('flex-none border-r border-white/10 pr-5 pl-(--brand-pad) text-white')}>Plantão</b>
        <div className="flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_32px,#000_calc(100%-64px),transparent)]">
          <ul className="flex w-max animate-crawl">
            {[...NEWSROOM, ...NEWSROOM].map((step, i) => (
              <li key={i} className="flex items-center gap-5 py-[17px] pl-5 text-12 leading-none font-semibold tracking-[0.14em] whitespace-nowrap text-[#a5a5ad] uppercase before:size-[5px] before:bg-red before:content-['']">{step}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
