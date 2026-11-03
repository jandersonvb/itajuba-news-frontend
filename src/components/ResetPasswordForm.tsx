'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Alert from './Alert';
import PasswordField from './PasswordField';
import { form, loginSubmit, subtitle } from '@/lib/styles';

/**
 * New-password form of the e-mailed link. The API has no way to check a token without using it,
 * so a used or expired link only shows up when the form is sent.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get('password'));
    if (password !== data.get('confirmation')) {
      setStatus('As duas senhas não são iguais.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      if (r.ok) {
        // Stays busy until the login opens: the link is already used, a second send would fail.
        router.replace('/admin/login?senha=redefinida');
        return;
      }
      const body = await r.json().catch(() => null);
      setInvalidLink(body?.invalidLink === true);
      setStatus(body?.message || 'Não foi possível redefinir a senha.');
    } catch {
      setStatus('Não foi possível conectar.');
    }
    setBusy(false);
  }

  // Sending again cannot work: the only way forward is a new link.
  if (invalidLink)
    return <Alert tone="error" title="Link inválido ou expirado">Os links valem por 30 minutos e funcionam uma única vez. <Link href="/admin/esqueci-senha">Pedir um novo link</Link></Alert>;

  return (
    <>
      <p className={subtitle}>Escolha uma senha com pelo menos 12 caracteres. Ao salvar, as sessões abertas da sua conta serão encerradas.</p>
      <form className={form} onSubmit={submit}>
        <PasswordField id="new-password" label="Nova senha" name="password" autoComplete="new-password" autoFocus/>
        <PasswordField id="new-password-confirmation" label="Confirme a nova senha" name="confirmation" autoComplete="new-password"/>
        {status && <Alert tone="error" spaced={false}>{status}</Alert>}
        <button className={loginSubmit} disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </>
  );
}
