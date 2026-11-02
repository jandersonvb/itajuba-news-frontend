/**
 * The visitor's choice about the Google Analytics cookies. Under the LGPD and the ANPD cookie guide
 * they are not necessary for the site to work, so nothing from Google loads before "Aceitar". The
 * choice lasts 180 days; then the banner asks again. Browser-only: every function uses `document`.
 */
export type Consent = 'aceito' | 'recusado';

export const CONSENT_COOKIE = 'consentimento_cookies';
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const CHANGE_EVENT = 'itajuba:consentimento';
const REOPEN_EVENT = 'itajuba:preferencias-cookies';

export function readConsent(): Consent | null {
  const match = document.cookie.match(/(?:^|;\s*)consentimento_cookies=(aceito|recusado)(?:;|$)/);
  return match ? (match[1] as Consent) : null;
}

export function writeConsent(value: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<Consent>(CHANGE_EVENT, { detail: value }));
}

/** Calls `listener` whenever the choice changes in this tab; returns the unsubscribe function. */
export function onConsentChange(listener: (value: Consent) => void) {
  const handler = (e: Event) => listener((e as CustomEvent<Consent>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/**
 * Deletes `_ga` and `_ga_<ID>`. gtag sets them on the highest domain it can (`.dominio.com.br`), so
 * this clears them on the current host and on every parent domain; the browser ignores the attempt
 * on a public suffix like `.com.br`.
 */
export function clearAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  const labels = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < labels.length - 1; i++) domains.push('; domain=.' + labels.slice(i).join('.'));
  for (const name of names) for (const domain of domains) document.cookie = `${name}=; path=/; max-age=0${domain}`;
}

/** "Preferências de cookies" in the footer: shows the banner again with the current choice. */
export const openCookiePreferences = () => window.dispatchEvent(new Event(REOPEN_EVENT));

export function onCookiePreferences(listener: () => void) {
  window.addEventListener(REOPEN_EVENT, listener);
  return () => window.removeEventListener(REOPEN_EVENT, listener);
}
