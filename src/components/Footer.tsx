import Link from 'next/link';
import { GA_ID } from '@/lib/analytics';
import CookieConsent from './CookieConsent';
import CookiePreferencesButton from './CookiePreferencesButton';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link href="/" className="logo-dark"><img src="/logo-dark.png" alt="Itajubá News" width={400} height={220} loading="lazy" decoding="async"/></Link>
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
              <li><Link href="/contato">Contato</Link></li>
              {/* A full page load: a Google Analytics loaded on the portal never carries over into the admin. */}
              <li><a href="/admin">Área da redação ↗</a></li>
            </ul>
          </div>
          <div>
            <h4>Institucional</h4>
            <ul className="footer-links">
              <li><Link href="/expediente">Expediente</Link></li>
              <li><Link href="/contato">Contato</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><Link href="/termos">Termos de uso</Link></li>
              {GA_ID && <li><CookiePreferencesButton/></li>}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Itajubá News</span>
          <span>Jornalismo local. Conexões que importam.</span>
        </div>
      </div>
      {GA_ID && <CookieConsent gaId={GA_ID}/>}
    </footer>
  );
}
