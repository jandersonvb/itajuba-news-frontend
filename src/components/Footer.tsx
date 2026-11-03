import Link from 'next/link';
import { GA_ID } from '@/lib/analytics';
import CookieConsent from './CookieConsent';
import CookiePreferencesButton from './CookiePreferencesButton';

const title = 'mb-4 text-12 leading-none font-bold tracking-[0.12em] text-white uppercase';
const links = 'grid list-none gap-2.5 text-15 [&_a:hover]:text-white';

export default function Footer() {
  return (
    <footer className="bg-ink pt-14 pb-7 text-[#b6b6bd]">
      <div className="wrap">
        <div className="grid grid-cols-[2fr_repeat(3,1fr)] gap-10 pb-9 max-lg:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-7">
          <div className="max-lg:col-span-full">
            {/* Logo for dark backgrounds; logo.png has a white background. */}
            <Link href="/" className="block w-fit"><img className="block h-auto w-[170px]" src="/logo-dark.png" alt="Itajubá News" width={400} height={220} loading="lazy" decoding="async"/></Link>
            <p className="mt-4 max-w-[36ch] text-15 leading-[1.7]">A cidade acontece aqui. Notícias, histórias e conexões do Sul de Minas.</p>
          </div>
          <div>
            <h4 className={title}>Explore</h4>
            <ul className={links}>
              <li><Link href="/">Notícias</Link></li>
              <li><Link href="/anuncie">Seja um patrocinador</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={title}>Fale com o portal</h4>
            <ul className={links}>
              <li><Link href="/contato">Contato</Link></li>
              {/* A full page load: a Google Analytics loaded on the portal never carries over into the admin. */}
              <li><a href="/admin">Área da redação ↗</a></li>
            </ul>
          </div>
          <div>
            <h4 className={title}>Institucional</h4>
            <ul className={links}>
              <li><Link href="/expediente">Expediente</Link></li>
              <li><Link href="/contato">Contato</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><Link href="/termos">Termos de uso</Link></li>
              {GA_ID && <li><CookiePreferencesButton/></li>}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-[#2c2c31] pt-[22px] text-13 text-[#8a8a92]">
          <span>© {new Date().getFullYear()} Itajubá News</span>
          <span>Jornalismo local. Conexões que importam.</span>
        </div>
      </div>
      {GA_ID && <CookieConsent gaId={GA_ID}/>}
    </footer>
  );
}
