import LeadForm from '@/components/LeadForm';
import { eyebrow, excerpt } from '@/lib/styles';

export const metadata = { title: 'Anuncie sua empresa' };

const spaces = [
  ['Banner premium', 'Sua marca na página inicial do portal.'],
  ['Banner lateral', 'Presença junto aos conteúdos da cidade.'],
  ['Patrocínio de editoria', 'Converse com a equipe sobre uma proposta personalizada.'],
];

export default async function Advertise({ searchParams }: { searchParams: Promise<{ interesse?: string }> }) {
  const { interesse } = await searchParams;
  const interest = spaces.some(([name]) => name === interesse) ? interesse! : 'Banner premium';
  return (
    <main className="wrap grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-[clamp(32px,5vw,72px)] py-[clamp(36px,5vw,72px)] max-lg:grid-cols-[minmax(0,1fr)]">
      <div>
        <span className={eyebrow()}>Conexões que movimentam a cidade</span>
        <h1 className="mt-3.5 mb-[18px] text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] leading-[1.12] tracking-[-0.025em]">Sua marca merece ser vista em Itajubá.</h1>
        <p className={excerpt}>Converse com nossa equipe sobre banners e parcerias. Valores e disponibilidade são definidos em proposta.</p>
        <ol className="mt-8 border-t border-line">
          {spaces.map(([name, desc], i) => (
            <li key={name} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-0.5 border-b border-line py-[18px]">
              <span className="row-span-2 pt-1 text-13 leading-none font-bold tracking-[0.1em] text-red-text" aria-hidden="true">0{i + 1}</span>
              <strong className="text-18 leading-[1.3] font-bold">{name}</strong>
              <span className="text-muted">{desc}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-[10px] border border-line bg-white p-[clamp(22px,3vw,36px)] shadow-card">
        <h2 className="text-28">Solicite uma proposta</h2>
        <LeadForm interest={interest}/>
      </div>
    </main>
  );
}
