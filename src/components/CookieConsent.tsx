'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { clearAnalyticsCookies, type Consent, onCookiePreferences, readConsent, writeConsent } from '@/lib/consent';
import { button, cx } from '@/lib/styles';

/**
 * Cookie banner and the Google Analytics loader. Nothing from Google loads before "Aceitar", and
 * "Recusar" is as easy as accepting. "Preferências de cookies" in the footer shows the banner again.
 * Mounted by the portal footer, so the admin never shows it nor loads GA.
 */
export default function CookieConsent({ gaId }: { gaId: string }) {
  // Decided after mounting: the server does not read the cookie, and the banner must not flash.
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = readConsent();
    setConsent(current);
    setOpen(current === null);
    return onCookiePreferences(() => setOpen(true));
  }, []);

  function choose(value: Consent) {
    const wasAccepted = consent === 'aceito';
    writeConsent(value);
    setConsent(value);
    setOpen(false);
    // A loaded gtag keeps running: refusing after accepting deletes its cookies and reloads without it.
    if (value === 'recusado' && wasAccepted) {
      clearAnalyticsCookies();
      window.location.reload();
    }
  }

  const choice = cx(button(), 'min-w-[120px] max-xs:flex-1');

  return (
    <>
      {consent === 'aceito' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/>
          {/* Page changes are measured by GA4's enhanced measurement (browser history events); no manual page_view. */}
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      )}
      {open && (
        // A strip at the bottom that never covers the whole page.
        <div
          className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-90 flex w-[min(960px,calc(100%-24px))] -translate-x-1/2 flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-line-strong bg-white px-5 py-4 text-15 leading-[1.5] text-ink shadow-card"
          role="region"
          aria-label="Consentimento de cookies"
        >
          <p className="m-0 flex-[1_1_360px]">
            Usamos cookies do Google Analytics para saber quantas pessoas leem o portal e quais matérias interessam mais.
            Eles só são ativados se você aceitar. <Link href="/privacidade#cookies" className="text-red-text underline underline-offset-[0.15em]">Saiba mais</Link>
          </p>
          <div className="flex flex-none gap-2.5 max-xs:flex-[1_1_100%]">
            <button type="button" className={choice} onClick={() => choose('recusado')}>Recusar</button>
            <button type="button" className={choice} onClick={() => choose('aceito')}>Aceitar</button>
          </div>
        </div>
      )}
    </>
  );
}
