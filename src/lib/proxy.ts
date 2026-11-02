import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { apiHeaders, apiUrl, PUBLIC_CACHE_TAG } from './api';
import { isCloudflareIp } from './cloudflare-ips';
import { SESSION_COOKIE } from './session';

export const resources = ['articles', 'categories', 'sponsors', 'campaigns', 'media', 'leads', 'users'];

export function sameOrigin(req: NextRequest) {
  return req.headers.get('origin') === (process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : req.nextUrl.origin);
}

/** Header with the visitor IP, set by the hosting provider's proxy (see clientIp). */
const IP_HEADER = (process.env.CLIENT_IP_HEADER || 'x-forwarded-for').trim().toLowerCase();
/** IPv4 or IPv6: anything else in the header is ignored. */
const IP_PATTERN = /^[0-9a-f.:]{1,64}$/i;

/** The IP in a header: the last entry of x-forwarded-for, the first of any other list. Null if missing or not an IP. */
function headerIp(req: NextRequest, name: string) {
  const entries = req.headers.get(name)?.split(',');
  if (!entries) return null;
  const ip = (name === 'x-forwarded-for' ? entries[entries.length - 1] : entries[0]).trim();
  return IP_PATTERN.test(ip) ? ip : null;
}

/**
 * Visitor IP, sent to the API as `x-client-ip` for the per-visitor rate limit. Without it the API
 * does not limit the request at all. CLIENT_IP_HEADER names the header the provider's proxy sets:
 *
 * | Provider                                         | CLIENT_IP_HEADER                                |
 * | ------------------------------------------------ | ----------------------------------------------- |
 * | Railway                                          | x-real-ip                                       |
 * | Railway behind Cloudflare's proxy (orange cloud) | cf-connecting-ip                                |
 * | Vercel                                           | x-forwarded-for (default; Vercel overwrites it) |
 * | Render                                           | cf-connecting-ip                                |
 *
 * For x-forwarded-for, the last entry: the one recorded by the closest proxy. Next.js fills that
 * header from the socket only when it is absent, so the proxy must append to it or overwrite it.
 * Any other header holds the visitor's address itself; if it is a list, the first entry.
 *
 * cf-connecting-ip is believed only when the connection came from Cloudflare, that is, when the
 * address that reached the provider (`x-real-ip` on Railway, else the last x-forwarded-for entry)
 * is in Cloudflare's ranges. Anyone who skips Cloudflare, through a leftover *.up.railway.app
 * domain or by connecting to the provider with the portal's Host, sends no such header or forges
 * one; they are limited by the address they connected from.
 */
export function clientIp(req: NextRequest) {
  if (IP_HEADER !== 'cf-connecting-ip') return headerIp(req, IP_HEADER);
  const peer = headerIp(req, 'x-real-ip') ?? headerIp(req, 'x-forwarded-for');
  if (peer && isCloudflareIp(peer)) return headerIp(req, 'cf-connecting-ip') ?? peer;
  return peer;
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
