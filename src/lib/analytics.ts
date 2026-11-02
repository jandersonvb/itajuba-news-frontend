import { readConsent } from './consent';

/**
 * GA4 measurement ID (`G-XXXXXXXXXX`), from NEXT_PUBLIC_GA_ID: set only in production, and read at
 * build time like every NEXT_PUBLIC_ variable. Empty (local, or an invalid value): no banner and
 * nothing from Google.
 */
const configured = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? '';
export const GA_ID = /^G-[A-Z0-9]+$/.test(configured) ? configured : '';

type Gtag = (...args: unknown[]) => void;

/**
 * Sends a GA4 event when the visitor accepted the cookies and GA has loaded; otherwise does nothing.
 * Never put personal data in `params`: no name, e-mail, phone or message.
 */
export function track(event: 'ad_click' | 'generate_lead', params: Record<string, string>) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (GA_ID && typeof gtag === 'function' && readConsent() === 'aceito') gtag('event', event, params);
}
