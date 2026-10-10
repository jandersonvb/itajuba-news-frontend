import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// The root boundary renders outside (portal)/layout.tsx, so it brings the portal chrome itself.
export default function NotFound() {
  return (
    <>
      <Header/>
      <main className="wrap page-message">
        <span className="eyebrow">Erro 404</span>
        <h1>Página não encontrada.</h1>
        <p className="subtitle">O endereço pode ter mudado ou a matéria foi retirada do ar.</p>
        <Link className="btn" href="/">Voltar ao portal</Link>
      </main>
      <Footer/>
    </>
  );
}
