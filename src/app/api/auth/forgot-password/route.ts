import { NextRequest, NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/proxy';
import { apiHeaders, apiUrl } from '@/lib/api';

/**
 * Asks the API to e-mail a reset link. The API answers 204 whether or not the e-mail has an
 * account, so the reply never tells the visitor if it does.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  try {
    const text = await req.text();
    if (Buffer.byteLength(text) > 4096) return NextResponse.json({ message: 'Requisição inválida' }, { status: 413 });
    const r = await fetch(apiUrl() + '/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders(clientIp(req)) },
      body: text,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return NextResponse.json({ ok: true });
    const message =
      r.status === 429 ? 'Muitas tentativas. Aguarde um minuto.'
      : r.status === 400 ? 'Informe um e-mail válido.'
      : 'Não foi possível enviar agora. Tente de novo em instantes.';
    return NextResponse.json({ message }, { status: r.status });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
