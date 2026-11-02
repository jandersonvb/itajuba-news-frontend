'use client';
import { useState } from 'react';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoginBrand from '@/components/LoginBrand';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const value = String(new FormData(e.currentTarget).get('email'));
    // Kept so "Enviar de novo" brings the form back already filled.
    setEmail(value);
    try {
      const r = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: value }) });
      if (r.ok) {
        setSent(true);
      } else {
        const body = await r.json().catch(() => null);
        setStatus(body?.message || 'Não foi possível enviar agora. Tente de novo em instantes.');
      }
    } catch {
      setStatus('Não foi possível conectar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <LoginBrand/>
      <section className="login-panel">
        <div className="login-card">
          <h2>Esqueci minha senha</h2>
          <p className="subtitle">Informe o e-mail da sua conta da redação. Enviaremos um link para você criar uma nova senha.</p>
          {sent ? (
            <div className="login-sent">
              {/* Same message whether or not the e-mail has an account. */}
              <Alert tone="success" title="Verifique seu e-mail">Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Ele vale por 30 minutos; confira também a caixa de spam.</Alert>
              <button type="button" className="btn light" onClick={() => setSent(false)}>Enviar de novo</button>
            </div>
          ) : (
            <form className="editor-form" onSubmit={submit}>
              <label>E-mail<input type="email" name="email" autoComplete="username" required autoFocus defaultValue={email}/></label>
              {status && <Alert tone="error">{status}</Alert>}
              <button className="btn login-submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link'}</button>
            </form>
          )}
          <Link href="/admin/login" className="login-back">← Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
