'use client';
import { openCookiePreferences } from '@/lib/consent';

/** Footer entry that shows the cookie banner again, to accept or refuse anew. */
export default function CookiePreferencesButton() {
  return (
    <button type="button" className="footer-link-button" onClick={openCookiePreferences}>
      Preferências de cookies
    </button>
  );
}
