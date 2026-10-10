import Link from 'next/link';
import {api,Article,Category,Campaign,PublicSponsor,dateLabel} from '@/lib/api';
import AdSlot from '@/components/AdSlot';
import Partners from '@/components/Partners';

const plans=[
  ['Banner premium','Sua marca na página inicial do portal.'],
  ['Banner lateral','Presença junto aos conteúdos da cidade.'],
  ['Patrocínio de editoria','Converse com a equipe sobre uma proposta personalizada.'],
];

export default async function Home({searchParams}:{searchParams:Promise<{editoria?:string;busca?:string;pagina?:string}>}){
  const p=await searchParams;
  let categories:Category[]=[],articles:Article[]=[],leader:Campaign[]=[],side:Campaign[]=[],sponsors:PublicSponsor[]=[];
  let unavailable=false,total=0;
  const page=Math.max(1,Math.min(1000,Number(p.pagina)||1));
  try{
    categories=await api<Category[]>('/categories');
    const category=categories.find(c=>c.slug===p.editoria);
    const query=new URLSearchParams({page:String(page),search:(p.busca||'').slice(0,200)});
    if(category)query.set('category',category.id);
    const news=await api<{items:Article[];total:number}>('/articles?'+query);
    articles=news.items;
    total=news.total;
    [leader,side,sponsors]=await Promise.all([
      api<Campaign[]>('/campaigns?slot=leaderboard'),
      api<Campaign[]>('/campaigns?slot=sidebar'),
      // "Quem apoia" falls back to its placeholder; it must not take the news down with it.
      api<PublicSponsor[]>('/sponsors').catch(()=>[]),
    ]);
  }catch{
    unavailable=true;
  }
  const cat=(a:Article)=>a.category?.name||'Itajubá News';
  const hero=articles.find(a=>a.featured)||articles[0];
  const sides=articles.filter(a=>a.id!==hero?.id).slice(0,2);
  const heading=p.busca?'Resultados da busca':categories.find(c=>c.slug===p.editoria)?.name||'Últimas notícias';
  return (
    <main>
      <div className="wrap">
        <div className="ticker"><b className="ticker-label">NO RADAR</b><span>Notícias, serviços e histórias de quem vive em Itajubá.</span></div>
        <AdSlot campaigns={leader} slot="leaderboard"/>
        <form className="search-form" action="/" role="search">
          <input name="busca" type="search" defaultValue={p.busca} aria-label="Buscar notícias" placeholder="Busque por assunto ou palavra-chave…"/>
          <select name="editoria" defaultValue={p.editoria||''} aria-label="Editoria">
            <option value="">Todas as editorias</option>
            {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button className="btn">Buscar</button>
        </form>
        {unavailable?(
          <div className="notice">Não foi possível carregar as notícias. Verifique se a API está disponível e o banco foi configurado.</div>
        ):(
          <>
            {hero&&page===1&&!p.busca&&!p.editoria&&(
              <>
                <div className="section-heading"><h2>Itajubá em destaque</h2><span className="eyebrow">O que move a nossa cidade</span></div>
                <section className={'hero-grid'+(sides.length?'':' solo')}>
                  <Link className="story hero-main" href={'/noticias/'+hero.slug}>
                    {hero.imageUrl&&<img src={hero.imageUrl} alt=""/>}
                    <div className="story-copy">
                      <span className="category">{cat(hero)}{hero.demo?' · exemplo':''}</span>
                      <h1>{hero.title}</h1>
                      <p>{hero.excerpt}</p>
                      <div className="meta">{hero.author} · {dateLabel(hero.publishedAt)}</div>
                    </div>
                  </Link>
                  {sides.length>0&&(
                    <div className="hero-side">
                      {sides.map(a=>(
                        <Link className="story" href={'/noticias/'+a.slug} key={a.id}>
                          {a.imageUrl&&<img src={a.imageUrl} alt=""/>}
                          <div className="story-copy">
                            <span className="category">{cat(a)}{a.demo?' · exemplo':''}</span>
                            <h3>{a.title}</h3>
                            <div className="meta">{dateLabel(a.publishedAt)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
            <Partners sponsors={sponsors}/>
            <div className="news-layout">
              <section>
                <div className="section-heading"><h2>{heading}</h2><span className="eyebrow">{total} matéria(s)</span></div>
                <div className="news-list">
                  {articles.map(a=>(
                    <Link className="news-card" key={a.id} href={'/noticias/'+a.slug}>
                      <div className="thumb">{a.imageUrl&&<img src={a.imageUrl} alt=""/>}</div>
                      <div>
                        <span className="category plain">{cat(a)}{a.demo?' · exemplo':''}</span>
                        <h3>{a.title}</h3>
                        <p>{a.excerpt}</p>
                        <div className="meta">{a.author} · {dateLabel(a.publishedAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                {!articles.length&&<div className="empty">Nenhuma notícia publicada para esta pesquisa.</div>}
                <div className="pagination">
                  {page>1&&<Link className="btn light" href={'/?'+new URLSearchParams({...p,pagina:String(page-1)})}>← Anterior</Link>}
                  {total>page*12&&<Link className="btn light" href={'/?'+new URLSearchParams({...p,pagina:String(page+1)})}>Próxima →</Link>}
                </div>
              </section>
              <aside>
                <AdSlot campaigns={side} slot="sidebar"/>
                <div className="side-box">
                  <h3>O seu negócio tem uma história.</h3>
                  <p className="subtitle">Conecte sua marca ao público local com uma campanha no portal.</p>
                  <Link href="/anuncie" className="text-link">Conheça os espaços ↗</Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      <section className="commercial">
        <div className="wrap">
          <div className="section-heading"><h2>Sua empresa faz parte desta história.</h2><span className="eyebrow">Publicidade local</span></div>
          <div className="plans">
            {plans.map(([title,desc])=>(
              <div className="plan" key={title}>
                <h3>{title}</h3>
                <p>{desc}</p>
                <Link className="btn light" href={'/anuncie?interesse='+encodeURIComponent(title)}>Solicitar proposta ↗</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
