import Link from 'next/link';
import type { Metadata } from 'next';
import { alternates } from '@/lib/seo';
import { SITE } from '@/lib/site';
import InfoPage from '@/components/InfoPage';
import MailLink from '@/components/MailLink';

export const metadata: Metadata = {
  title: 'Expediente',
  description: `Quem publica o ${SITE.name}, jornalista responsável, contatos da redação e do comercial e política de correções.`,
  alternates: alternates('/expediente'),
};

export default function Masthead() {
  const { responsibleJournalist: journalist } = SITE;
  return (
    <InfoPage title="Expediente" intro={`Quem publica o ${SITE.name} e como falar com a redação.`}>
      <h2>Veículo</h2>
      <ul>
        <li><strong>Nome:</strong> {SITE.name}</li>
        <li><strong>Razão social:</strong> {SITE.legalName}</li>
        <li><strong>CNPJ:</strong> {SITE.cnpj}</li>
        <li><strong>Endereço:</strong> {SITE.address}</li>
      </ul>

      <h2>Jornalista responsável</h2>
      <p>{journalist.name}, {journalist.registration}</p>

      <h2>Contatos</h2>
      <ul>
        <li><strong>Redação</strong> (pautas e correções): <MailLink address={SITE.emails.newsroom}/></li>
        <li><strong>Comercial</strong> (anúncios e patrocínios): <MailLink address={SITE.emails.commercial}/></li>
      </ul>
      <p>Todos os canais, incluindo o de privacidade, estão na página <Link href="/contato">Contato</Link>.</p>

      <h2 id="correcoes">Política de correções</h2>
      <p>
        Corrigimos os erros assim que os confirmamos. Para pedir uma correção, escreva para a redação em{' '}
        <MailLink address={SITE.emails.newsroom}/> com o link da matéria, o trecho errado e, se possível, a informação
        correta ou a fonte que a comprova.
      </p>
      <p>
        Quando a correção muda uma informação, a matéria é corrigida e ganha, no fim do texto, uma nota que diz o que foi
        alterado, e a data da mudança aparece abaixo do título como “Atualizado em”. Erros de digitação que não mudam o
        sentido são corrigidos sem nota.
      </p>
      <p>
        <strong>Direito de resposta:</strong> quem se sentir ofendido por uma matéria pode pedir resposta ou retificação
        pelo mesmo e-mail, em até 60 dias da publicação (Lei 13.188/2015). O pedido é analisado e, quando cabível, a
        resposta é publicada em até 7 dias do recebimento, com o mesmo destaque da matéria que a motivou.
      </p>

      <h2>Jornalismo e publicidade</h2>
      <p>
        O conteúdo editorial é decidido pela redação, com independência: anunciantes e patrocinadores não interferem nas
        pautas nem nas matérias, e todo espaço pago aparece identificado como “Publicidade”.
      </p>
    </InfoPage>
  );
}
