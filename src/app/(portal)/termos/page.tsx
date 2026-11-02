import Link from 'next/link';
import type { Metadata } from 'next';
import { alternates } from '@/lib/seo';
import { dayLabel, SITE } from '@/lib/site';
import InfoPage from '@/components/InfoPage';
import MailLink from '@/components/MailLink';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: `Como usar e reproduzir o conteúdo do ${SITE.name}, como a publicidade é identificada e como pedir correção ou direito de resposta.`,
  alternates: alternates('/termos'),
};

export default function Terms() {
  return (
    <InfoPage
      title="Termos de uso"
      intro={`Ao usar o ${SITE.name}, você concorda com estes termos. Eles explicam como o conteúdo pode ser reproduzido, como a publicidade aparece e como pedir correções.`}
    >
      <h2>Direitos autorais</h2>
      <p>
        Textos, fotografias, vídeos, ilustrações e a identidade visual do {SITE.name} são protegidos pela Lei de Direitos
        Autorais (Lei 9.610/1998) e pertencem ao portal ou aos seus autores.
      </p>
      <ul>
        <li>
          <strong>Reprodução parcial:</strong> permitida, desde que cite o {SITE.name} como fonte e traga um link para a
          matéria original.
        </li>
        <li>
          <strong>Reprodução integral</strong>, inclusive de fotografias: só com autorização prévia, pedida à redação pelo
          e-mail <MailLink address={SITE.emails.newsroom}/>.
        </li>
      </ul>

      <h2>Publicidade</h2>
      <p>
        Anúncios, banners e conteúdos patrocinados aparecem identificados como “Publicidade”. Anunciantes e patrocinadores
        não interferem no conteúdo jornalístico (veja o <Link href="/expediente">Expediente</Link>).
      </p>

      <h2>Links externos</h2>
      <p>
        O portal traz links para sites de terceiros, inclusive de anunciantes e patrocinadores. Não controlamos esses
        sites e não respondemos pelo conteúdo, pelas ofertas ou pelas práticas de privacidade deles.
      </p>

      <h2>Correções e direito de resposta</h2>
      <p>
        Encontrou um erro? Avise a redação. Quem se sentir ofendido por uma publicação tem direito de resposta ou de
        retificação, conforme a Lei 13.188/2015. Como pedir e como as correções aparecem estão na{' '}
        <Link href="/expediente#correcoes">política de correções</Link>, no Expediente.
      </p>

      <h2>Alterações e foro</h2>
      <p>
        Estes termos podem mudar, e a versão em vigor fica sempre nesta página. Eles seguem a lei brasileira, e fica
        eleito o foro da comarca de {SITE.forum} para resolver questões relacionadas a eles, ressalvado o direito do
        consumidor de propor ação no foro do seu domicílio.
      </p>
      <p className="updated">Última atualização: <time dateTime={SITE.termsUpdatedAt}>{dayLabel(SITE.termsUpdatedAt)}</time>.</p>
    </InfoPage>
  );
}
