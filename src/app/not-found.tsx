import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { button, eyebrow, pageMessage } from '@/lib/styles';

// The root boundary renders outside (portal)/layout.tsx, so it brings the portal chrome itself.
export default function NotFound() {
  return (
    <>
      <Header/>
      <main className={pageMessage.box}>
        <span className={eyebrow()}>Erro 404</span>
        <h1 className={pageMessage.title}>Página não encontrada.</h1>
        <p className={pageMessage.text}>O endereço pode ter mudado ou a matéria foi retirada do ar.</p>
        <Link className={button()} href="/">Voltar ao portal</Link>
      </main>
      <Footer/>
    </>
  );
}
