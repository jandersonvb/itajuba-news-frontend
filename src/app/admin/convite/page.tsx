import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/Alert';
import InviteForm, { type Invite } from '@/components/InviteForm';
import LoginBrand from '@/components/LoginBrand';
import { apiHeaders, apiUrl } from '@/lib/api';

// The token is in the URL: keep it out of the Referer header sent to other sites.
export const metadata: Metadata = { referrer: 'no-referrer' };

/** Who the invitation is for; 'invalid' for a used, replaced or expired link; null when the API is down. */
async function readInvite(token: string): Promise<Invite | 'invalid' | null> {
  try {
    const r = await fetch(apiUrl() + '/auth/invite?token=' + encodeURIComponent(token), { headers: apiHeaders(), cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (r.status === 400) return 'invalid';
    return r.ok ? ((await r.json()) as Invite) : null;
  } catch {
    return null;
  }
}

/** Target of the invitation e-mail: `/admin/convite?token=<token>`. The person chooses a password and is signed in. */
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const invite = typeof token === 'string' && token ? await readInvite(token) : 'invalid';
  return (
    <main className="login">
      <LoginBrand/>
      <section className="login-panel">
        <div className="login-card">
          <span className="login-step">Convite</span>
          {invite === null ? (
            <>
              <h2>Crie sua senha</h2>
              <Alert tone="error" title="API indisponível">Não foi possível abrir o convite agora. Tente de novo em instantes.</Alert>
            </>
          ) : invite === 'invalid' ? (
            <>
              <h2>Convite indisponível</h2>
              <Alert tone="error" title="Convite inválido ou expirado">Os convites valem por 7 dias e só podem ser usados uma vez. Peça a um administrador para reenviar o seu.</Alert>
            </>
          ) : (
            <>
              <h2>Crie sua senha</h2>
              <InviteForm token={token as string} invite={invite}/>
            </>
          )}
          <Link href="/admin/login" className="login-back">← Ir para o login</Link>
        </div>
      </section>
    </main>
  );
}
