import Link from 'next/link';
import Alert from '@/components/Alert';
import LoginBrand from '@/components/LoginBrand';
import LoginForm from '@/components/LoginForm';
import ResendSetupInvite from '@/components/ResendSetupInvite';
import { setupStatus } from '@/lib/setup';
import { cx, loginBack, loginStep, loginTitle, subtitle } from '@/lib/styles';

/**
 * Login of the panel. During the first setup nobody can sign in yet, so the page explains the
 * next step instead: accept the invitation sent to ADMIN_EMAIL, or configure ADMIN_EMAIL.
 * ?sessao=expirada and ?senha=redefinida add a message to the login.
 */
export default async function Login({ searchParams }: { searchParams: Promise<{ sessao?: string; senha?: string }> }) {
  const [{ sessao, senha }, setup] = await Promise.all([searchParams, setupStatus()]);
  return (
    <main className="grid min-h-dvh grid-cols-2 max-lg:grid-cols-1">
      <LoginBrand/>
      <section className="flex items-center justify-center px-(--gutter) py-[clamp(32px,5vw,64px)] max-lg:items-start">
        <div className="w-full max-w-[400px]">
          {setup?.state === 'invited' ? (
            <>
              <span className={loginStep}>Configuração inicial</span>
              <h2 className={loginTitle}>Convite enviado</h2>
              <p className={subtitle}>Enviamos um convite de administrador para <b>{setup.email}</b>. Abra o e-mail e use o botão “Criar minha senha” para entrar no painel. O link vale por 7 dias.</p>
              <p className={cx(subtitle, 'mt-2.5')}>Não chegou? Confira a caixa de spam ou peça um novo.</p>
              <ResendSetupInvite/>
            </>
          ) : setup?.state === 'unconfigured' ? (
            <>
              <span className={loginStep}>Configuração inicial</span>
              <h2 className={loginTitle}>Defina o administrador</h2>
              <p className={subtitle}>Este painel ainda não tem administrador. Quem cuida do servidor define o e-mail dele na variável <code>ADMIN_EMAIL</code> da API e a reinicia.</p>
              <Alert tone="info" title="O que acontece depois">A API cria a conta e envia um convite para esse e-mail. A pessoa cria a própria senha pelo link e já entra no painel.</Alert>
            </>
          ) : (
            <>
              <h2 className={loginTitle}>Entrar no painel</h2>
              <p className={subtitle}>Use o e-mail e a senha da sua conta da redação.</p>
              {sessao === 'expirada' && <Alert tone="info" title="Sessão encerrada">Entre novamente para continuar de onde parou.</Alert>}
              {senha === 'redefinida' && <Alert tone="success" title="Senha alterada">Entre com a nova senha.</Alert>}
              <LoginForm/>
            </>
          )}
          <Link href="/" className={loginBack}>← Voltar ao portal</Link>
        </div>
      </section>
    </main>
  );
}
