import LeadForm from '@/components/LeadForm';

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
    <main className="wrap advertise">
      <div className="advertise-intro">
        <span className="eyebrow">Conexões que movimentam a cidade</span>
        <h1>Sua marca merece ser vista em Itajubá.</h1>
        <p className="article-excerpt">Converse com nossa equipe sobre banners e parcerias. Valores e disponibilidade são definidos em proposta.</p>
        <ol className="advertise-list">
          {spaces.map(([name, desc]) => (
            <li key={name}><strong>{name}</strong><span>{desc}</span></li>
          ))}
        </ol>
      </div>
      <div className="form-card">
        <h2>Solicite uma proposta</h2>
        <LeadForm interest={interest}/>
      </div>
    </main>
  );
}
