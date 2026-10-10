import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark">Itajubá <span>NEWS</span></Link>
            <p>A cidade acontece aqui. Notícias, histórias e conexões do Sul de Minas.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><Link href="/">Notícias</Link></li>
              <li><Link href="/anuncie">Seja um patrocinador</Link></li>
            </ul>
          </div>
          <div>
            <h4>Fale com o portal</h4>
            <ul className="footer-links">
              <li><Link href="/anuncie">Formulário comercial</Link></li>
              <li><Link href="/admin">Área da redação ↗</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Itajubá News</span>
          <span>Jornalismo local. Conexões que importam.</span>
        </div>
      </div>
    </footer>
  );
}
