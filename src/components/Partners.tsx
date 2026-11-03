import Link from 'next/link';
import { PublicSponsor } from '@/lib/api';
import { textLink } from '@/lib/styles';

const name = 'text-center text-18 leading-[1.1] font-extrabold tracking-[-0.01em] text-[#55555c] max-lg:text-left';

/** "Quem apoia" strip: the active sponsors, or a placeholder for the space while there are none. */
export default function Partners({ sponsors }: { sponsors: PublicSponsor[] }) {
  return (
    <div className="my-11 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-7 border-y border-line py-[22px] max-lg:grid-cols-[minmax(0,1fr)_auto] max-sm:my-8 max-sm:grid-cols-[minmax(0,1fr)] max-sm:gap-3.5">
      <div className="text-12 leading-[1.5] font-semibold tracking-[0.1em] text-muted uppercase max-lg:col-span-full">
        QUEM APOIA<br className="max-lg:hidden"/><b className="font-bold text-ink max-lg:ml-[0.3em]">O JORNALISMO LOCAL</b>
      </div>
      {sponsors.length ? (
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 max-lg:justify-start max-sm:flex-nowrap max-sm:gap-7 max-sm:overflow-x-auto max-sm:[scrollbar-width:none]">
          {sponsors.map((s) => (
            <a key={s.id} className={name + ' opacity-75 grayscale transition-[filter,opacity] duration-200 hover:opacity-100 hover:grayscale-0'} href={s.websiteUrl} target="_blank" rel="sponsored noopener noreferrer">
              {s.logoUrl ? <img className="block h-9 w-auto max-w-40 object-contain" src={s.logoUrl} alt={s.name} loading="lazy" decoding="async"/> : s.name}
            </a>
          ))}
        </div>
      ) : (
        <div className={name}>SUA MARCA<small className="mt-[5px] block text-11 leading-[1.2] font-medium tracking-[0.12em] text-muted">ESPAÇO PARA PATROCINADOR</small></div>
      )}
      <Link href="/anuncie" className={textLink}>Seja um parceiro ↗</Link>
    </div>
  );
}
