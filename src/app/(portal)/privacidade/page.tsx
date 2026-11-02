import Link from 'next/link';
import type { Metadata } from 'next';
import { alternates } from '@/lib/seo';
import { dayLabel, SITE } from '@/lib/site';
import InfoPage from '@/components/InfoPage';
import MailLink from '@/components/MailLink';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: `Quais dados pessoais o ${SITE.name} trata, para quê, por quanto tempo, com quem compartilha e como exercer seus direitos (LGPD).`,
  alternates: alternates('/privacidade'),
};

export default function Privacy() {
  return (
    <InfoPage
      title="Política de Privacidade"
      intro={`Esta política explica quais dados pessoais o ${SITE.name} trata, por que, por quanto tempo e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).`}
    >
      <h2>Quem controla os dados</h2>
      <p>
        O controlador dos dados pessoais tratados neste portal é {SITE.legalName}, inscrita no CNPJ {SITE.cnpj}, com
        endereço em {SITE.address}.
      </p>
      <p>
        Dúvidas sobre esta política e pedidos sobre os seus dados vão para o encarregado pelo tratamento de dados
        pessoais, pelo e-mail <MailLink address={SITE.emails.privacy}/>.
      </p>

      <h2>Formulário comercial</h2>
      <p>Quando você pede uma proposta pela página <Link href="/anuncie">Anuncie</Link>, coletamos:</p>
      <ul>
        <li>nome ou empresa;</li>
        <li>e-mail;</li>
        <li>espaço de interesse;</li>
        <li>a mensagem que você escrever.</li>
      </ul>
      <p>
        <strong>Finalidade:</strong> responder ao seu pedido comercial. O pedido fica guardado no painel do portal e é
        enviado por e-mail aos administradores do portal, que respondem a você.
      </p>
      <p>
        <strong>Base legal:</strong> consentimento (LGPD, art. 7º, I), dado ao marcar a autorização antes de enviar o
        formulário. Você pode revogá-lo a qualquer momento pelo e-mail de privacidade; a revogação não afeta o que foi
        feito antes dela.
      </p>
      <p>
        <strong>Guarda:</strong> até o atendimento do pedido e por até 12 meses, ou até você pedir a exclusão, se isso
        acontecer antes.
      </p>

      <h2>Equipe da redação</h2>
      <p>
        Para quem trabalha no portal, o painel da redação guarda nome, e-mail, perfil de acesso e senha. A senha é
        guardada só como hash, uma transformação irreversível: nem a equipe consegue lê-la.
      </p>
      <p>
        <strong>Finalidade:</strong> dar e controlar o acesso ao painel. <strong>Base legal:</strong> execução de
        contrato (LGPD, art. 7º, V) e legítimo interesse (art. 7º, IX).
      </p>

      <h2>Segurança e navegação</h2>
      <p>
        O endereço IP de quem acessa é usado no momento da requisição para limitar tentativas repetidas, como logins
        errados ou envios seguidos do formulário. <strong>Base legal:</strong> legítimo interesse (LGPD, art. 7º, IX), na
        proteção do portal contra abusos.
      </p>
      <p>
        Os provedores de hospedagem, listados em “Compartilhamento”, mantêm registros de acesso (como endereço IP, data,
        hora e página acessada) para operar e proteger a infraestrutura.
      </p>

      {/* Lists every cookie the site sets. Update this section if analytics, pixels or third-party ads are ever added. */}
      <h2>Cookies</h2>
      <p>
        O portal público não usa cookies de rastreamento nem de publicidade de terceiros. Só o painel da redação usa
        cookies:
      </p>
      <ul>
        <li>
          <strong>sessão do painel:</strong> mantém a pessoa da equipe conectada. É estritamente necessário e expira
          junto com o login;
        </li>
        <li><strong>tema do painel:</strong> lembra se o painel está no modo claro ou escuro.</li>
      </ul>

      <h2>Compartilhamento</h2>
      <p>
        Não vendemos dados pessoais. Eles são compartilhados apenas com os provedores que operam o portal, que os tratam
        em nosso nome:
      </p>
      <ul>
        {SITE.processors.map((processor) => <li key={processor}>{processor}</li>)}
      </ul>
      <p>
        Como esses provedores ficam fora do Brasil, no país indicado ao lado de cada um, há transferência internacional
        de dados (LGPD, art. 33), limitada ao necessário para que prestem esses serviços. Dados também podem ser
        fornecidos a autoridades quando a lei ou uma ordem judicial exigir.
      </p>

      <h2>Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
      <ul>
        <li>confirmação de que tratamos dados seus;</li>
        <li>acesso a esses dados;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos, e eliminação dos dados tratados com o seu consentimento;</li>
        <li>portabilidade dos dados a outro fornecedor;</li>
        <li>informação sobre com quem compartilhamos os seus dados;</li>
        <li>revogação do consentimento.</li>
      </ul>
      <p>
        Para exercer esses direitos, escreva para <MailLink address={SITE.emails.privacy}/> dizendo o que deseja, de
        preferência a partir do e-mail que você usou no formulário. Podemos pedir alguma informação para confirmar que o
        pedido é seu. Respondemos em até 15 dias do pedido (LGPD, art. 19).
      </p>
      <p>Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <h2>Segurança</h2>
      <p>
        Protegemos os dados com conexão criptografada (HTTPS), acesso ao painel restrito à equipe e separado por perfis,
        senhas guardadas só como hash e limite de tentativas repetidas. Se ocorrer um incidente de segurança que possa
        causar risco ou dano relevante, avisaremos os titulares afetados e a ANPD (LGPD, art. 48).
      </p>

      <h2>Alterações desta política</h2>
      <p>
        Esta política pode mudar para acompanhar novos recursos do portal ou mudanças na lei. A versão em vigor fica
        sempre nesta página.
      </p>
      <p className="updated">Última atualização: <time dateTime={SITE.privacyUpdatedAt}>{dayLabel(SITE.privacyUpdatedAt)}</time>.</p>
    </InfoPage>
  );
}
