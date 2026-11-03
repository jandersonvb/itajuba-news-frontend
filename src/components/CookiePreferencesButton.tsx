'use client';
import { openCookiePreferences } from '@/lib/consent';

/** Footer entry that shows the cookie banner again, to accept or refuse anew. Looks like the links beside it. */
export default function CookiePreferencesButton() {
  return (
    <button type="button" className="text-left hover:text-white" onClick={openCookiePreferences}>
      Preferências de cookies
    </button>
  );
}
