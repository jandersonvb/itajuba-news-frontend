import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { api, ArticlePage, Category } from '@/lib/api';
import { pageParam, param, SearchParams } from '@/lib/search-params';
import NewsIndex, { Unavailable } from '@/components/NewsIndex';
import NewsList from '@/components/NewsList';
import Pagination from '@/components/Pagination';
import { eyebrow, sectionHeading } from '@/lib/styles';

/** Search text, up to the 200 characters the API accepts. */
const searchText = (p: Awaited<SearchParams>) => param(p.q).trim().slice(0, 200);

/** A page of results, filtered by the editoria when the slug exists. Null when the API does not answer. */
async function results(q: string, slug: string, page: number) {
  try {
    const category = (await api<Category[]>('/categories')).find((c) => c.slug === slug);
    const query = new URLSearchParams({ page: String(page), search: q });
    if (category) query.set('category', category.id);
    return { category, news: await api<ArticlePage>('/articles?' + query) };
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = searchText(await searchParams);
  return {
    title: q ? `Resultados para “${q}”` : 'Buscar notícias',
    // Results change all the time and repeat the editoria pages: followed, not indexed.
    robots: { index: false, follow: true },
  };
}

export default async function Search({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams;
  const q = searchText(p);
  const slug = param(p.editoria);
  // The form sent only an editoria: that is its page.
  if (!q && slug) redirect('/editoria/' + encodeURIComponent(slug));

  if (!q) {
    return (
      <NewsIndex>
        <div className={sectionHeading}><h1>Buscar notícias</h1></div>
        <div className="px-5 py-11 text-center text-muted">Digite um assunto ou palavra-chave no campo acima.</div>
      </NewsIndex>
    );
  }

  const page = pageParam(p.pagina);
  const found = await results(q, slug, page);
  return (
    <NewsIndex search={{ q, editoria: slug }}>
      {found ? (
        <>
          <div className={sectionHeading}>
            <h1>Resultados para “{q}”</h1>
            <span className={eyebrow()}>{found.news.total} matéria(s){found.category && ' em ' + found.category.name}</span>
          </div>
          <NewsList articles={found.news.items} empty="Nenhuma notícia encontrada para esta busca."/>
          <Pagination
            path="/busca"
            query={found.category ? { q, editoria: found.category.slug } : { q }}
            page={page}
            total={found.news.total}
          />
        </>
      ) : (
        <Unavailable/>
      )}
    </NewsIndex>
  );
}
