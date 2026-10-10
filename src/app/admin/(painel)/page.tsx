import {redirect} from 'next/navigation';
import {api,Category} from '@/lib/api';
import {canAccess} from '@/lib/permissions';
import {getSession,SESSION_EXPIRED_PATH} from '@/lib/session';
import Dashboard from '@/components/Dashboard';
export const metadata={title:'Painel editorial',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';

export default async function Admin({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  // Same checks as the layout, which renders in parallel with this page.
  const session = await getSession();
  if (session.status !== 'ok') {
    if (session.status === 'anonymous') redirect('/admin/login');
    if (session.status === 'expired') redirect(SESSION_EXPIRED_PATH);
    return null;
  }
  const { aba } = await searchParams;
  // A tab the role cannot open (e.g. ?aba=users for a reporter) falls back to Notícias.
  if (aba && !canAccess(session.me.role, aba)) redirect('/admin');
  const categories = await api<Category[]>('/categories');
  return <Dashboard categories={categories} me={session.me} initialTab={aba && canAccess(session.me.role, aba) ? aba : 'articles'}/>;
}
