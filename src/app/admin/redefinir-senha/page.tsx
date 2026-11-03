import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoginBrand from '@/components/LoginBrand';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { loginBack, loginTitle } from '@/lib/styles';

// The token is in the URL: keep it out of the Referer header sent to other sites.
export const metadata: Metadata = { referrer: 'no-referrer' };

/** Target of the link in the reset e-mail: `/admin/redefinir-senha?token=<token>`. */
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return (
    <main className="grid min-h-dvh grid-cols-2 max-lg:grid-cols-1">
      <LoginBrand/>
      <section className="flex items-center justify-center px-(--gutter) py-[clamp(32px,5vw,64px)] max-lg:items-start">
        <div className="w-full max-w-[400px]">
          <h2 className={loginTitle}>Nova senha</h2>
          {typeof token === 'string' && token ? (
            <ResetPasswordForm token={token}/>
          ) : (
            <Alert tone="warning" title="Link incompleto">O endereço do e-mail chegou cortado. Copie o link inteiro ou <Link href="/admin/esqueci-senha">peça um novo</Link>.</Alert>
          )}
          <Link href="/admin/login" className={loginBack}>← Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
