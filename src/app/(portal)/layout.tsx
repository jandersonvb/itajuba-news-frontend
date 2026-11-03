import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header/>
      <div id="conteudo" tabIndex={-1} className="focus:outline-none">{children}</div>
      <Footer/>
    </>
  );
}
