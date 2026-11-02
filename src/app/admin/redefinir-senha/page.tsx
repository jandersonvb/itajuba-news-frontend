import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoginBrand from '@/components/LoginBrand';
import ResetPasswordForm from '@/components/ResetPasswordForm';

// The token is in the URL: keep it out of the Referer header sent to other sites.
export const metadata: Metadata = { referrer: 'no-referrer' };

/** Target of the link in the reset e-mail: `/admin/redefinir-senha?token=<token>`. */
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return (
    <main className="login">
      <LoginBrand/>
      <section className="login-panel">
        <div className="login-card">
          <h2>Nova senha</h2>
          {typeof token === 'string' && token ? (
            <ResetPasswordForm token={token}/>
          ) : (
            <Alert tone="warning" title="Link incompleto">O endereço do e-mail chegou cortado. Copie o link inteiro ou <Link href="/admin/esqueci-senha">peça um novo</Link>.</Alert>
          )}
          <Link href="/admin/login" className="login-back">← Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
