import Link from 'next/link';
import type { Metadata } from 'next';
import { alternates } from '@/lib/seo';
import { SITE } from '@/lib/site';
import InfoPage from '@/components/InfoPage';
import MailLink from '@/components/MailLink';

export const metadata: Metadata = {
  title: 'Contato',
  description: `E-mails da redação, do comercial e de privacidade do ${SITE.name}.`,
  alternates: alternates('/contato'),
};

export default function Contact() {
  return (
    <InfoPage title="Contato" intro={`Escolha o canal certo para falar com o ${SITE.name}.`}>
      <h2>Redação</h2>
      <p>
        Sugestões de pauta, informações e pedidos de correção: <MailLink address={SITE.emails.newsroom}/>. Para
        correções e direito de resposta, veja a <Link href="/expediente#correcoes">política de correções</Link>.
      </p>

      <h2>Comercial</h2>
      <p>
        Anúncios, banners e patrocínios: <MailLink address={SITE.emails.commercial}/>. Se preferir, peça uma proposta
        pelo formulário da página <Link href="/anuncie">Anuncie</Link>.
      </p>

      <h2>Privacidade</h2>
      <p>
        Dúvidas sobre dados pessoais e pedidos de acesso, correção ou exclusão: <MailLink address={SITE.emails.privacy}/>.
        Saiba mais na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </InfoPage>
  );
}
