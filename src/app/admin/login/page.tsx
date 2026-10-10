'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [expired, setExpired] = useState(false);

  // Read after mount: useSearchParams would need a Suspense boundary on this prerendered page.
  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get('sessao') === 'expirada');
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const data = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      if (r.ok) {
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
    <main className="login">
      <section className="login-brand" aria-label="Itajubá News">
        <Link href="/" className="wordmark">Itajubá <span>NEWS</span></Link>
        <div>
          <span className="eyebrow">Área da redação</span>
          <h1>A cidade acontece aqui. A notícia começa por você.</h1>
          <p>Publique matérias, organize as editorias e cuide dos patrocinadores do portal.</p>
        </div>
        <div className="login-dots" aria-hidden="true"><span/><span/><span/><span/></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <h2>Entrar no painel</h2>
          <p className="subtitle">Use o e-mail e a senha da sua conta da redação.</p>
          {expired && !status && <p className="notice" role="status">Sua sessão expirou ou foi encerrada. Entre novamente.</p>}
          <form className="editor-form" onSubmit={submit}>
            <label>E-mail<input type="email" name="email" autoComplete="username" required autoFocus/></label>
            <div>
              <label htmlFor="login-password">Senha</label>
              <span className="password-field">
                <input id="login-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" required minLength={12}/>
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </span>
            </div>
            {status && <p className="form-error" role="alert">{status}</p>}
            <button className="btn login-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          </form>
          <Link href="/" className="login-back">← Voltar ao portal</Link>
        </div>
      </section>
    </main>
  );
}
