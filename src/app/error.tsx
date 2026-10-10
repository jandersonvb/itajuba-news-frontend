'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="wrap article-page"><h1>Não foi possível carregar esta página.</h1><p>Tente novamente em alguns instantes.</p><button className="btn" onClick={reset}>Tentar novamente</button></main>}
