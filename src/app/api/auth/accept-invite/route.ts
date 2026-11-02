import { NextRequest, NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/proxy';
import { apiHeaders, apiUrl } from '@/lib/api';
import { setSessionCookie } from '@/lib/session';

/** Prefix of the API's message for a used, replaced or expired invitation. */
const INVALID_INVITE = 'Convite inválido ou expirado';

/** Chooses the password of an invitation and opens the session, like the login. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  try {
    const text = await req.text();
    if (Buffer.byteLength(text) > 4096) return NextResponse.json({ message: 'Requisição inválida' }, { status: 413 });
    const r = await fetch(apiUrl() + '/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders(clientIp(req)) },
      body: text,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const data = await r.json();
      const response = NextResponse.json({ ok: true });
      setSessionCookie(response, data.accessToken, Number(data.expiresIn) || 3600);
      return response;
    }
    if (r.status === 429) return NextResponse.json({ message: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
    if (r.status === 400) {
      const body = await r.json().catch(() => null);
      // An array for validation errors, a plain string when the link is unknown, used or expired.
      const messages: unknown[] = [body?.message].flat();
      if (messages.some((m) => typeof m === 'string' && m.includes(INVALID_INVITE)))
        return NextResponse.json({ message: 'Este convite é inválido ou expirou.', invalidLink: true }, { status: 400 });
      return NextResponse.json({ message: 'Confira o nome (2 a 100 caracteres) e a senha (12 a 200 caracteres).' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Não foi possível criar a senha.' }, { status: r.status });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
