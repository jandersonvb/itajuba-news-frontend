'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="wrap page-message">
      <Link href="/" className="page-message-logo"><img src="/logo.png" alt="Itajubá News" className="logo" width={225} height={225}/></Link>
      <h1>Não foi possível carregar esta página.</h1>
      <p className="subtitle">Tente novamente em alguns instantes.</p>
      <div className="page-message-actions">
        <button className="btn" onClick={reset}>Tentar novamente</button>
        <Link className="btn light" href="/">Voltar ao portal</Link>
      </div>
    </main>
  );
}
