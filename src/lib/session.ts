import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiHeaders, apiUrl, Me } from './api';

export { SESSION_EXPIRED_PATH } from './admin-client';

export const SESSION_COOKIE = 'itajuba-session';

export function setSessionCookie(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge, path: '/' });
}

export function clearSessionCookie(response: NextResponse) {
  setSessionCookie(response, '', 0);
}

export type Session = { status: 'ok'; me: Me } | { status: 'anonymous' | 'expired' | 'unavailable' };

/**
 * Logged-in user from `GET /auth/me`, read on every admin load (role changes and deactivation take
 * effect right away). Cached per request, so the layout and the page share one call.
 */
export const getSession = cache(async (): Promise<Session> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { status: 'anonymous' };
  try {
    const r = await fetch(apiUrl() + '/auth/me', { headers: { Authorization: 'Bearer ' + token, ...apiHeaders() }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (r.status === 401) return { status: 'expired' };
    if (!r.ok) return { status: 'unavailable' };
    return { status: 'ok', me: (await r.json()) as Me };
  } catch {
    return { status: 'unavailable' };
  }
});
