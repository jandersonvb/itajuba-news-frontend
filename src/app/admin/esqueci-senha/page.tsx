'use client';
import { useState } from 'react';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoginBrand from '@/components/LoginBrand';
import { button, form, formInput, formLabel, loginBack, loginSubmit, loginTitle, subtitle } from '@/lib/styles';

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
    <main className="grid min-h-dvh grid-cols-2 max-lg:grid-cols-1">
      <LoginBrand/>
      <section className="flex items-center justify-center px-(--gutter) py-[clamp(32px,5vw,64px)] max-lg:items-start">
        <div className="w-full max-w-[400px]">
          <h2 className={loginTitle}>Esqueci minha senha</h2>
          <p className={subtitle}>Informe o e-mail da sua conta da redação. Enviaremos um link para você criar uma nova senha.</p>
          {sent ? (
            <div className="mt-[22px] grid justify-items-start gap-4">
              {/* Same message whether or not the e-mail has an account. */}
              <Alert tone="success" title="Verifique seu e-mail" spaced={false} className="justify-self-stretch">Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Ele vale por 30 minutos; confira também a caixa de spam.</Alert>
              <button type="button" className={button('light')} onClick={() => setSent(false)}>Enviar de novo</button>
            </div>
          ) : (
            <form className={form} onSubmit={submit}>
              <label className={formLabel}>E-mail<input className={formInput} type="email" name="email" autoComplete="username" required autoFocus defaultValue={email}/></label>
              {status && <Alert tone="error" spaced={false}>{status}</Alert>}
              <button className={loginSubmit} disabled={busy}>{busy ? 'Enviando…' : 'Enviar link'}</button>
            </form>
          )}
          <Link href="/admin/login" className={loginBack}>← Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
