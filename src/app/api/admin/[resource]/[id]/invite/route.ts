import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/proxy';

/** "Reenviar convite" (`POST /admin/users/:id/invite`): a new link replaces the previous one. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (resource !== 'users' || !/^[-a-f0-9]{36}$/.test(id)) return NextResponse.json({ message: 'Recurso inválido' }, { status: 404 });
  return proxy(req, '/admin/users/' + id + '/invite');
}
