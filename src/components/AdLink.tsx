'use client';
import { track } from '@/lib/analytics';
import type { Campaign } from '@/lib/api';

/** Banner link of an active campaign. A click is the GA event `ad_click` (only with consent). */
export default function AdLink({ ad, slot, children }: { ad: Campaign; slot: Campaign['slot']; children: React.ReactNode }) {
  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() => track('ad_click', { campaign_id: ad.id, campaign_name: ad.name, sponsor: ad.sponsor?.name ?? '', slot })}
    >
      {children}
    </a>
  );
}
