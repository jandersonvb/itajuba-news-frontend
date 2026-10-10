import { redirect } from 'next/navigation';
import { getSession, SESSION_EXPIRED_PATH } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Gate of the panel (not of the login page): needs a session that `GET /auth/me` still accepts. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session.status === 'anonymous') redirect('/admin/login');
  if (session.status === 'expired') redirect(SESSION_EXPIRED_PATH);
  if (session.status === 'unavailable')
    return <main className="wrap article-page"><h1>API indisponível.</h1><p>Confira o backend e tente novamente.</p></main>;
  return children;
}
