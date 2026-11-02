'use client';
import { useState } from 'react';
import Alert from './Alert';

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
    <div className="login-sent">
      {state === 'sent' && <Alert tone="success" title="Convite reenviado">O link anterior deixou de valer. Use o do e-mail mais recente.</Alert>}
      {state === 'error' && <Alert tone="error">{message}</Alert>}
      <button type="button" className="btn light" disabled={state === 'busy'} onClick={resend}>{state === 'busy' ? 'Reenviando…' : 'Reenviar convite'}</button>
    </div>
  );
}
