'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Alert from './Alert';
import PasswordField from './PasswordField';
import { offerToSavePassword } from '@/lib/browser-credentials';

export default function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (r.ok) {
        offerToSavePassword(email, password);
        router.replace('/admin');
        router.refresh();
      } else {
        const body = await r.json().catch(() => null);
        setStatus(body?.message || 'Não foi possível entrar.');
      }
    } catch {
      setStatus('Não foi possível conectar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="editor-form" onSubmit={submit}>
      <label>E-mail<input type="email" name="email" autoComplete="username" required autoFocus/></label>
      <PasswordField id="login-password" label="Senha" name="password" autoComplete="current-password">
        <Link href="/admin/esqueci-senha" className="login-forgot">Esqueci minha senha</Link>
      </PasswordField>
      {status && <Alert tone="error">{status}</Alert>}
      <button className="btn login-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
