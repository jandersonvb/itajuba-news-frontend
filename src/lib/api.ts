export type Category={id:string;name:string;slug:string;position:number};
export type Article={id:string;title:string;slug:string;excerpt:string;content:string;categoryId:string;imageUrl:string;author:string;publishedAt:string|null;status:'draft'|'published';featured:boolean;demo:boolean;category:{id:string;name:string;slug:string}|null};
export type Sponsor={id:string;name:string;logoUrl:string;websiteUrl:string;active:boolean};
export type Campaign={id:string;name:string;sponsorId:string;slot:'leaderboard'|'sidebar';imageUrl:string;targetUrl:string;startsAt:string;endsAt:string;active:boolean;sponsor?:Sponsor};

/** Active sponsor as returned by the public `GET /sponsors`. `logoUrl` may be empty. */
export type PublicSponsor = { id: string; name: string; logoUrl: string; websiteUrl: string };

/** Uploaded image. `url` is the relative path `/media/<file>`, served through the rewrite in next.config.ts. */
export type Media = { id: string; filename: string; originalName: string; mimeType: string; size: number; createdAt: string; url: string };

/** admin: tudo; editor: notícias, editorias e mídia; reporter: só os próprios rascunhos e envio de imagens. */
export type UserRole = 'admin' | 'editor' | 'reporter';

/** Logged-in user, from `GET /auth/me`. */
export type Me = { id: string; name: string; email: string; role: UserRole };

/** Staff account as listed in `GET /admin/users`. */
export type StaffUser = Me & { active: boolean; createdAt: string };

export const apiUrl = () => process.env.API_URL || 'http://localhost:4000/api';

/** Tag of the cached public reads. Successful admin mutations expire it (see proxy.ts). */
export const PUBLIC_CACHE_TAG = 'portal';

/**
 * Identifies this Next.js server to the API with INTERNAL_API_KEY. With a visitor IP the API
 * rate-limits that visitor; without one (shared cached reads) the request is not limited.
 */
export function apiHeaders(clientIp?: string | null): Record<string, string> {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return {};
  return clientIp ? { 'x-internal-key': key, 'x-client-ip': clientIp } : { 'x-internal-key': key };
}

/** Public read shared by all visitors, cached for 60 seconds. */
export function fetchPublic(path: string) {
  return fetch(apiUrl() + path, {
    headers: apiHeaders(),
    next: { revalidate: 60, tags: [PUBLIC_CACHE_TAG] },
    signal: AbortSignal.timeout(8000),
  });
}

export async function api<T>(path: string): Promise<T> {
  const res = await fetchPublic(path);
  if (!res.ok) throw new Error('API respondeu ' + res.status);
  return res.json() as Promise<T>;
}

export const dateLabel=(d:string|null)=>d?new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeZone:'America/Sao_Paulo'}).format(new Date(d)):'';
