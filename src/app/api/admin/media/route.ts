import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { apiHeaders, apiUrl } from '@/lib/api';
import { clientIp, proxy, sameOrigin } from '@/lib/proxy';
import { SESSION_COOKIE } from '@/lib/session';

/** Same limit as the API. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;
/**
 * The file plus the multipart envelope (boundary, part headers, file name): 4.5 MB. It is also the
 * most Vercel accepts in the body of a request to a function, so the limit holds on either host.
 */
const MAX_BODY_BYTES = MAX_FILE_BYTES + 512 * 1024;

const tooLarge = () => NextResponse.json({ message: 'Imagem maior que 4 MB' }, { status: 413 });

// This static route takes precedence over [resource], so it also serves the listing.
export function GET(req: NextRequest) {
  return proxy(req, '/admin/media');
}

/** Upload in the multipart `file` field. proxy() only forwards JSON, hence this route. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ message: 'Origem inválida' }, { status: 403 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Faça login' }, { status: 401 });
  // Node stops reading the body at Content-Length, so the header bounds what formData() buffers.
  const length = req.headers.get('content-length');
  if (!length || !/^\d+$/.test(length)) return NextResponse.json({ message: 'Envio sem tamanho declarado' }, { status: 411 });
  if (Number(length) > MAX_BODY_BYTES) return tooLarge();

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get('file');
  } catch {
    file = null;
  }
  if (!(file instanceof File)) return NextResponse.json({ message: 'Envie a imagem no campo "file"' }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return tooLarge();

  try {
    const form = new FormData();
    form.append('file', file, file.name);
    // No Content-Type: fetch sets multipart/form-data with the boundary.
    const r = await fetch(apiUrl() + '/admin/media', {
      method: 'POST',
      headers: { ...apiHeaders(clientIp(req)), Authorization: 'Bearer ' + token },
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    if (r.status === 413) return tooLarge();
    const text = await r.text();
    return new NextResponse(text, { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'API indisponível' }, { status: 503 });
  }
}
