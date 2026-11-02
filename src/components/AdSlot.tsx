import Link from 'next/link';
import { Campaign } from '@/lib/api';

/** Active campaign of the slot, or an invitation to advertise there. */
export default function AdSlot({ campaigns, slot }: { campaigns: Campaign[]; slot: 'leaderboard' | 'sidebar' }) {
  const ad = campaigns[0];
  if (ad) {
    return (
      <div className={'campaign ' + slot}>
        <span className="eyebrow">Publicidade · {ad.sponsor?.name}</span>
        <a href={ad.targetUrl} target="_blank" rel="sponsored noopener noreferrer">
          <img src={ad.imageUrl} alt={'Publicidade: ' + (ad.sponsor?.name || ad.name)} loading="lazy" decoding="async"/>
        </a>
      </div>
    );
  }
  if (slot === 'leaderboard') {
    return (
      <div className="ad-leader">
        <div>
          <div className="eyebrow">Publicidade · espaço disponível</div>
          <h3>Sua marca no centro da notícia.</h3>
          <p>Conecte seu negócio a quem vive em Itajubá.</p>
        </div>
        <Link href="/anuncie?interesse=Banner%20premium" className="btn light">Reserve este espaço ↗</Link>
      </div>
    );
  }
  return (
    <div className="side-ad">
      <div className="eyebrow">Publicidade</div>
      <h3>Quem é visto,<br/>é lembrado.</h3>
      <p>Seu negócio em destaque no Itajubá News.</p>
      <Link className="btn" href="/anuncie?interesse=Banner%20lateral">Quero aparecer aqui ↗</Link>
    </div>
  );
}
