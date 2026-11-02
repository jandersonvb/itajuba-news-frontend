import type { Media } from './api';

/** Admin color theme. "system" follows the operating system setting. */
export type AdminTheme = 'light' | 'dark' | 'system';

/** Cookie with the chosen theme, read by the server so the page is rendered in it from the start. */
export const THEME_COOKIE = 'adm-theme';

export const parseTheme = (value?: string): AdminTheme => (value === 'light' || value === 'system' ? value : 'dark');

/** Clears the session cookie and opens the login with a "sessão expirada" notice. */
export const SESSION_EXPIRED_PATH = '/api/auth/session-expired';

/** Thrown after a 401 while the browser is already leaving for the login. */
export class SessionExpired extends Error {
  constructor() {
    super('Sessão expirada');
  }
}

/**
 * fetch for the admin intermediate routes. A 401 (expired token, deactivated user, password reset)
 * ends the session; a 403 is returned as is, so the caller shows the API message without logging out.
 */
export async function adminFetch(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (r.status === 401) {
    window.location.assign(SESSION_EXPIRED_PATH);
    throw new SessionExpired();
  }
  return r;
}

/** API errors carry `message` as a string or, for validation errors, a list of strings. */
export function errorMessage(body: unknown, fallback: string) {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' && message ? message : fallback;
}

/** Message to show for a failed action; empty after a 401, when the page is already going to the login. */
export const failure = (e: unknown) => (e instanceof SessionExpired ? '' : (e as Error).message);

/** Same limit as the API and /api/admin/media. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export async function uploadImage(file: File): Promise<Media> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" tem mais de 4 MB. Reduza a imagem e envie de novo.`);
  const form = new FormData();
  form.append('file', file);
  const r = await adminFetch('/api/admin/media', { method: 'POST', body: form });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(errorMessage(body, 'Não foi possível enviar a imagem'));
  return body as Media;
}
