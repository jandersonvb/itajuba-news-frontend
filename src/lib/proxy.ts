import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { apiHeaders, apiUrl, PUBLIC_CACHE_TAG } from './api';
import { SESSION_COOKIE } from './session';

export const resources = ['articles', 'categories', 'sponsors', 'campaigns', 'media', 'leads', 'users'];

export function sameOrigin(req: NextRequest) {
  return req.headers.get('origin') === (process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : req.nextUrl.origin);
}

/** Header with the visitor IP, set by the hosting provider's proxy (see clientIp). */
const IP_HEADER = (process.env.CLIENT_IP_HEADER || 'x-forwarded-for').trim().toLowerCase();
/** IPv4 or IPv6: anything else in the header is ignored. */
const IP_PATTERN = /^[0-9a-f.:]{1,64}$/i;

/**
 * Visitor IP, sent to the API as `x-client-ip` for the per-visitor rate limit. CLIENT_IP_HEADER
 * names the header the provider's proxy sets:
 *
 * | Provider                            | CLIENT_IP_HEADER                                             |
 * | ----------------------------------- | ------------------------------------------------------------ |
 * | Vercel                              | x-forwarded-for (default; Vercel overwrites it) or x-real-ip |
 * | Railway                             | x-real-ip                                                    |
 * | Render                              | cf-connecting-ip                                             |
 * | Cloudflare in front of any provider | cf-connecting-ip                                             |
 *
 * For x-forwarded-for, the last entry: the one recorded by the closest proxy. Next.js fills that
 * header from the socket only when it is absent, so the proxy must append to it or overwrite it.
 * Behind Cloudflare the last entry is Cloudflare's own address, and every visitor would share it.
 * Any other header holds the visitor's address itself; if it is a list, the first entry.
 * Null when the header is missing or does not look like an IP.
 */
export function clientIp(req: NextRequest) {
  const entries = req.headers.get(IP_HEADER)?.split(',');
  if (!entries) return null;
  const ip = (IP_HEADER === 'x-forwarded-for' ? entries[entries.length - 1] : entries[0]).trim();
  return IP_PATTERN.test(ip) ? ip : null;
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
