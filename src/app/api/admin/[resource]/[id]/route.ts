import { NextRequest, NextResponse } from 'next/server';
import { proxy, resources } from '@/lib/proxy';

/** Leads and uploaded images can only be deleted, not edited. */
const noUpdate = ['leads', 'media'];
/** Users are deactivated, not deleted, so their articles keep their author. */
const noDelete = ['users'];

async function handler(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (
    !resources.includes(resource) ||
    !/^[-a-f0-9]{36}$/.test(id) ||
    (req.method === 'PATCH' && noUpdate.includes(resource)) ||
    (req.method === 'DELETE' && noDelete.includes(resource))
  )
    return NextResponse.json({ message: 'Recurso inválido' }, { status: 404 });
  return proxy(req, '/admin/' + resource + '/' + id);
}

export { handler as PATCH, handler as DELETE };
