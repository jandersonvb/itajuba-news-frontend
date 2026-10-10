import Link from 'next/link';
import { PublicSponsor } from '@/lib/api';

/** "Quem apoia" strip: the active sponsors, or a placeholder for the space while there are none. */
export default function Partners({ sponsors }: { sponsors: PublicSponsor[] }) {
  return (
    <div className="partners">
      <div className="partners-title">QUEM APOIA<br/><b>O JORNALISMO LOCAL</b></div>
      {sponsors.length ? (
        <div className="partner-list">
          {sponsors.map((s) => (
            <a key={s.id} className="partner" href={s.websiteUrl} target="_blank" rel="sponsored noopener noreferrer">
              {s.logoUrl ? <img className="partner-logo" src={s.logoUrl} alt={s.name}/> : s.name}
            </a>
          ))}
        </div>
      ) : (
        <div className="partner">SUA MARCA<small>ESPAÇO PARA PATROCINADOR</small></div>
      )}
      <Link href="/anuncie" className="text-link">Seja um parceiro ↗</Link>
    </div>
  );
}
