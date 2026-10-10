import { NextRequest, NextResponse } from 'next/server';
import { proxy, resources } from '@/lib/proxy';

/** Leads are only created by the public form; media uploads go through ../media/route.ts. */
const noCreate = ['leads', 'media'];

async function handler(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!resources.includes(resource) || (req.method === 'POST' && noCreate.includes(resource)))
    return NextResponse.json({ message: 'Recurso inválido' }, { status: 404 });
  return proxy(req, '/admin/' + resource);
}

export { handler as GET, handler as POST };
