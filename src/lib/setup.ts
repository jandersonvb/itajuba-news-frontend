import { apiHeaders, apiUrl } from './api';

/**
 * First setup of the panel, from `GET /auth/setup`: `ready` (normal login), `invited` (the first
 * admin, from ADMIN_EMAIL, still has to accept the e-mailed invitation) or `unconfigured`.
 */
export type SetupStatus = { state: 'ready' } | { state: 'invited'; email: string } | { state: 'unconfigured' };

/** Server-side only. Null when the API cannot be reached. */
export async function setupStatus(): Promise<SetupStatus | null> {
  try {
    const r = await fetch(apiUrl() + '/auth/setup', { headers: apiHeaders(), cache: 'no-store', signal: AbortSignal.timeout(8000) });
    return r.ok ? ((await r.json()) as SetupStatus) : null;
  } catch {
    return null;
  }
}
