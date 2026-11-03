import Link from 'next/link';
import { Campaign } from '@/lib/api';
import { button, cx, eyebrow } from '@/lib/styles';
import AdLink from './AdLink';

/** Active campaign of the slot, or an invitation to advertise there. */
export default function AdSlot({ campaigns, slot }: { campaigns: Campaign[]; slot: 'leaderboard' | 'sidebar' }) {
  const ad = campaigns[0];
  if (ad) {
    return (
      <div className={slot === 'leaderboard' ? 'mt-0.5 mb-7' : undefined}>
        <span className={cx(eyebrow(), 'mb-2 block')}>Publicidade · {ad.sponsor?.name}</span>
        <AdLink ad={ad} slot={slot}>
          <img className={cx('block w-full rounded-md object-contain', slot === 'leaderboard' ? 'max-h-40' : 'max-h-[420px]')} src={ad.imageUrl} alt={'Publicidade: ' + (ad.sponsor?.name || ad.name)} loading="lazy" decoding="async"/>
        </AdLink>
      </div>
    );
  }
  if (slot === 'leaderboard') {
    return (
      <div className="mt-0.5 mb-7 flex items-center justify-between gap-6 rounded-md border border-dashed border-line-strong bg-paper px-7 py-[22px] max-sm:flex-col max-sm:items-start max-sm:gap-3.5 max-sm:p-5">
        <div>
          <div className={eyebrow()}>Publicidade · espaço disponível</div>
          <h3 className="mt-1.5 mb-1 text-[clamp(1.25rem,1.05rem+0.8vw,1.625rem)]">Sua marca no centro da notícia.</h3>
          <p className="text-15 text-muted max-sm:hidden">Conecte seu negócio a quem vive em Itajubá.</p>
        </div>
        <Link href="/anuncie?interesse=Banner%20premium" className={button('light')}>Reserve este espaço ↗</Link>
      </div>
    );
  }
  return (
    // A dark box with a ring cut by the top-right corner.
    <div className="relative isolate overflow-hidden rounded-md bg-ink p-7 text-white after:absolute after:-top-[70px] after:-right-[110px] after:-z-1 after:size-[210px] after:rounded-full after:border-[38px] after:border-[#26262b] after:content-['']">
      <div className={eyebrow('text-[#a5a5ad]')}>Publicidade</div>
      <h3 className="mt-5 mb-3 text-30 leading-[1.15]">Quem é visto,<br/>é lembrado.</h3>
      <p className="text-15 leading-[1.6] text-[#bdbdc4]">Seu negócio em destaque no Itajubá News.</p>
      <Link className={cx(button(), 'mt-[22px]')} href="/anuncie?interesse=Banner%20lateral">Quero aparecer aqui ↗</Link>
    </div>
  );
}
