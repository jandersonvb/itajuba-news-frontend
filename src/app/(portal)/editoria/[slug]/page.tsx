import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api, ArticlePage, Category } from '@/lib/api';
import { alternates } from '@/lib/seo';
import { pageParam, SearchParams } from '@/lib/search-params';
import NewsIndex from '@/components/NewsIndex';
import NewsList from '@/components/NewsList';
import Pagination from '@/components/Pagination';

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

/**
 * Editoria of the slug, or the 404 page. When the API is down this throws (error page) instead:
 * an existing section must not be answered with 404.
 */
async function findCategory(slug: string) {
  const category = (await api<Category[]>('/categories')).find((c) => c.slug === slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await findCategory(slug);
  const page = pageParam(query.pagina);
  const path = '/editoria/' + category.slug;
  return {
    title: 'Notícias de ' + category.name,
    description: `Últimas notícias de ${category.name} em Itajubá e região.`,
    alternates: alternates(page > 1 ? path + '?pagina=' + page : path),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await findCategory(slug);
  const page = pageParam(query.pagina);
  const news = await api<ArticlePage>('/articles?' + new URLSearchParams({ page: String(page), category: category.id }));
  return (
    <NewsIndex search={{ editoria: category.slug }}>
      <div className="section-heading"><h1>{category.name}</h1><span className="eyebrow">{news.total} matéria(s)</span></div>
      <NewsList articles={news.items} empty="Nenhuma notícia publicada nesta editoria."/>
      <Pagination path={'/editoria/' + category.slug} page={page} total={news.total}/>
    </NewsIndex>
  );
}
