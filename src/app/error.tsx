'use client';
import Link from 'next/link';
import { button, pageMessage } from '@/lib/styles';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className={pageMessage.box}>
      <Link href="/" className="mb-3 inline-block"><img src="/logo.png" alt="Itajubá News" className="block h-[86px] w-[150px] object-cover max-sm:h-[66px] max-sm:w-[116px]" width={225} height={225}/></Link>
      <h1 className={pageMessage.title}>Não foi possível carregar esta página.</h1>
      <p className={pageMessage.text}>Tente novamente em alguns instantes.</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button className={button()} onClick={reset}>Tentar novamente</button>
        <Link className={button('light')} href="/">Voltar ao portal</Link>
      </div>
    </main>
  );
}
