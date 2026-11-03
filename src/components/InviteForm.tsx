'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/api';
import { roleNames } from '@/lib/permissions';
import { offerToSavePassword } from '@/lib/browser-credentials';
import Alert from './Alert';
import PasswordField from './PasswordField';
import { form, formInput, formLabel, loginSubmit, subtitle } from '@/lib/styles';

export type Invite = { name: string; email: string; role: UserRole };

/**
 * Accepts an invitation: the person confirms their name and chooses a password, then the session
 * opens. The e-mail is shown read-only as the username, so the browser saves the login for it.
 */
export default function InviteForm({ token, invite }: { token: string; invite: Invite }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name')).trim();
    const password = String(data.get('password'));
    if (password !== data.get('confirmation')) return setStatus('As duas senhas não são iguais.');
    setBusy(true);
    setStatus('');
    try {
      const r = await fetch('/api/auth/accept-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password, name }) });
      if (r.ok) {
        // Stays busy until the panel opens: the link is already used.
        offerToSavePassword(invite.email, password, name);
        router.replace('/admin');
        router.refresh();
        return;
      }
      const body = await r.json().catch(() => null);
      setInvalidLink(body?.invalidLink === true);
      setStatus(body?.message || 'Não foi possível criar a senha.');
    } catch {
      setStatus('Não foi possível conectar.');
    }
    setBusy(false);
  }

  if (invalidLink)
    return <Alert tone="error" title="Convite inválido ou expirado">Os convites valem por 7 dias e só podem ser usados uma vez. Peça a um administrador para reenviar o seu.</Alert>;

  return (
    <>
      <p className={subtitle}>Você recebeu um convite para a redação do Itajubá News como <b>{roleNames[invite.role].replace(/ \(.*\)$/, '')}</b>. Escolha uma senha para entrar no painel.</p>
      <form className={form} onSubmit={submit}>
        <label className={formLabel}>Seu nome<input className={formInput} name="name" defaultValue={invite.name} autoComplete="name" required minLength={2} maxLength={100} autoFocus={!invite.name}/></label>
        <label className={formLabel}>E-mail<input className={formInput} type="email" name="email" value={invite.email} readOnly autoComplete="username"/></label>
        <PasswordField id="invite-password" label="Senha (mínimo 12 caracteres)" name="password" autoComplete="new-password" autoFocus={!!invite.name}/>
        <PasswordField id="invite-confirmation" label="Confirme a senha" name="confirmation" autoComplete="new-password"/>
        {status && <Alert tone="error" spaced={false}>{status}</Alert>}
        <button className={loginSubmit} disabled={busy}>{busy ? 'Entrando…' : 'Criar senha e entrar'}</button>
      </form>
    </>
  );
}
