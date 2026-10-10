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
