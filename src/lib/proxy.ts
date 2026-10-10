import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { apiHeaders, apiUrl, PUBLIC_CACHE_TAG } from './api';
import { SESSION_COOKIE } from './session';

export const resources = ['articles', 'categories', 'sponsors', 'campaigns', 'media', 'leads', 'users'];

export function sameOrigin(req: NextRequest) {
  return req.headers.get('origin') === (process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : req.nextUrl.origin);
}

/**
 * Visitor IP as recorded by the closest proxy: the last X-Forwarded-For entry. Next.js fills the
 * header from the socket only when it is absent, so in production run behind a proxy that
 * appends or overwrites it (Vercel, nginx, Cloudflare).
 */
export function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || null;
}

export async function proxy(req: NextRequest, path: string, auth = true) {
  const mutation = !['GET', 'HEAD'].includes(req.method);
  if (mutation && !sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (auth && !token) return NextResponse.json({ message: 'Faça login' }, { status: 401 });
  try {
    const body = req.method === 'GET' ? undefined : await req.text();
    if (body && Buffer.byteLength(body) > 150000) return NextResponse.json({ message: 'Conteúdo muito grande' }, { status: 413 });
    const r = await fetch(apiUrl() + path, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', ...apiHeaders(clientIp(req)), ...(auth ? { Authorization: 'Bearer ' + token } : {}) },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    // Admin changes must show up on the public pages right away, not after the 60s cache.
    if (auth && mutation && r.ok) revalidateTag(PUBLIC_CACHE_TAG, { expire: 0 });
    const text = await r.text();
    return new NextResponse(text, { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
