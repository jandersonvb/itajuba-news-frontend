import { NextRequest, NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/proxy';
import { apiHeaders, apiUrl } from '@/lib/api';

/** Prefix of the API's message for a used, expired, replaced or malformed token. */
const INVALID_LINK = 'Link inválido ou expirado';

/**
 * Sets the new password with the token from the e-mailed link. The API also ends the user's open
 * sessions, but this browser's cookie is left alone: the login page replaces it.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  try {
    const text = await req.text();
    if (Buffer.byteLength(text) > 4096) return NextResponse.json({ message: 'Requisição inválida' }, { status: 413 });
    const r = await fetch(apiUrl() + '/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders(clientIp(req)) },
      body: text,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return NextResponse.json({ ok: true });
    if (r.status === 429) return NextResponse.json({ message: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
    if (r.status === 400) {
      const body = await r.json().catch(() => null);
      // An array for validation errors, a plain string when the token is unknown, used or expired.
      const messages: unknown[] = [body?.message].flat();
      if (messages.some((m) => typeof m === 'string' && m.includes(INVALID_LINK)))
        return NextResponse.json({ message: 'Este link é inválido ou expirou. Peça um novo.', invalidLink: true }, { status: 400 });
      return NextResponse.json({ message: 'A senha precisa ter de 12 a 200 caracteres.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Não foi possível redefinir a senha.' }, { status: r.status });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
