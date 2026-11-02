import { NextRequest, NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/proxy';
import { apiHeaders, apiUrl } from '@/lib/api';

/** Sends the first admin's invitation again (to ADMIN_EMAIL only). */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  try {
    const r = await fetch(apiUrl() + '/auth/setup/resend', {
      method: 'POST',
      headers: apiHeaders(clientIp(req)),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return NextResponse.json({ ok: true });
    const message = r.status === 429 ? 'Muitas tentativas. Aguarde um minuto.' : 'Não foi possível reenviar o convite agora.';
    return NextResponse.json({ message }, { status: r.status });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
