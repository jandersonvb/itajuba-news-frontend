import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/proxy';

/** Admin sets a new password for a user (`PATCH /admin/users/:id/password`), ending their sessions. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (resource !== 'users' || !/^[-a-f0-9]{36}$/.test(id)) return NextResponse.json({ message: 'Recurso inválido' }, { status: 404 });
  return proxy(req, '/admin/users/' + id + '/password');
}
