import { redirect } from 'next/navigation';
import { getSession, SESSION_EXPIRED_PATH } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Gate of the panel (not of the login page): needs a session that `GET /auth/me` still accepts. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session.status === 'anonymous') redirect('/admin/login');
  if (session.status === 'expired') redirect(SESSION_EXPIRED_PATH);
  if (session.status === 'unavailable')
    return (
      <main className="wrap py-16">
        <h1 className="text-[clamp(1.875rem,1.2rem+2.8vw,3.25rem)]">API indisponível.</h1>
        <p className="mt-3">Confira o backend e tente novamente.</p>
      </main>
    );
  return children;
}
