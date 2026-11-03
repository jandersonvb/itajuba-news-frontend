'use client';
import { useState } from 'react';
import Alert from './Alert';
import { button } from '@/lib/styles';

/** "Reenviar convite" for the first administrator; the API sends it only to ADMIN_EMAIL. */
export default function ResendSetupInvite() {
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function resend() {
    setState('busy');
    try {
      const r = await fetch('/api/auth/setup/resend', { method: 'POST' });
      if (r.ok) return setState('sent');
      setMessage((await r.json().catch(() => null))?.message || 'Não foi possível reenviar agora.');
    } catch {
      setMessage('Não foi possível conectar.');
    }
    setState('error');
  }

  return (
    <div className="mt-[22px] grid justify-items-start gap-4">
      {state === 'sent' && <Alert tone="success" title="Convite reenviado" spaced={false} className="justify-self-stretch">O link anterior deixou de valer. Use o do e-mail mais recente.</Alert>}
      {state === 'error' && <Alert tone="error" spaced={false} className="justify-self-stretch">{message}</Alert>}
      <button type="button" className={button('light')} disabled={state === 'busy'} onClick={resend}>{state === 'busy' ? 'Reenviando…' : 'Reenviar convite'}</button>
    </div>
  );
}
