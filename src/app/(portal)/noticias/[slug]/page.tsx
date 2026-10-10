import Link from 'next/link';
import {notFound} from 'next/navigation';
import {fetchPublic,Article,dateLabel} from '@/lib/api';
import type {Metadata} from 'next';
async function article(slug:string){const r=await fetchPublic('/articles/'+encodeURIComponent(slug));if(r.status===404)notFound();if(!r.ok)throw new Error('Matéria indisponível');return r.json() as Promise<Article>;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const a=await article((await params).slug);return {title:a.title,description:a.excerpt,alternates:{canonical:'/noticias/'+a.slug},robots:a.demo?{index:false,follow:false}:undefined,openGraph:{type:'article',title:a.title,description:a.excerpt,images:a.imageUrl?[a.imageUrl]:[]}};}
export default async function News({params}:{params:Promise<{slug:string}>}){
  const a=await article((await params).slug);
  return (
    <main className="article-page">
      <header className="article-header">
        {a.demo&&<div className="notice">Matéria demonstrativa. Não relata um acontecimento real. Fotografia ilustrativa.</div>}
        {a.category
          ? <Link className="category" href={'/?editoria='+a.category.slug}>{a.category.name}</Link>
          : <span className="category">Itajubá News</span>}
        <h1>{a.title}</h1>
        <p className="article-excerpt">{a.excerpt}</p>
        <div className="byline">
          <span>Por <b>{a.author}</b></span>
          {a.publishedAt&&<time dateTime={a.publishedAt}>{dateLabel(a.publishedAt)}</time>}
        </div>
      </header>
      {a.imageUrl&&<figure className="article-figure"><img className="article-image" src={a.imageUrl} alt="Imagem da matéria"/></figure>}
      <div className="article-content">{a.content.split('\n').filter(Boolean).map((text,i)=><p key={i}>{text}</p>)}</div>
      <div className="article-more">
        {a.category
          ? <Link href={'/?editoria='+a.category.slug}>Mais notícias de {a.category.name} <span aria-hidden="true">→</span></Link>
          : <Link href="/">Voltar para a capa <span aria-hidden="true">→</span></Link>}
      </div>
    </main>
  );
}
