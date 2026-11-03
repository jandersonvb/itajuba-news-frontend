import Link from 'next/link';
import { Article, dateLabel } from '@/lib/api';
import { categoryTag, meta } from '@/lib/styles';

/** Label above the title: the editoria, and whether the article is a demo. */
export const categoryLabel = (a: Article) => (a.category?.name || 'Itajubá News') + (a.demo ? ' · exemplo' : '');

/** News cards of the listings (home, editorias and search). */
export default function NewsList({ articles, empty }: { articles: Article[]; empty: string }) {
  if (!articles.length) return <div className="px-5 py-11 text-center text-muted">{empty}</div>;
  return (
    <div>
      {articles.map((a) => (
        <Link
          className="group grid grid-cols-[minmax(0,250px)_minmax(0,1fr)] gap-6 border-b border-line py-[22px] first:pt-0 max-xl:grid-cols-[minmax(0,200px)_minmax(0,1fr)] max-xl:gap-5 max-sm:grid-cols-[112px_minmax(0,1fr)] max-sm:gap-3.5 max-sm:py-[18px] max-sm:first:pt-0"
          key={a.id}
          href={'/noticias/' + a.slug}
        >
          {/* Striped placeholder while (or when there is no) photo. */}
          <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-paper bg-[repeating-linear-gradient(135deg,transparent_0_11px,rgb(0_0_0/0.03)_11px_22px)] max-sm:aspect-square">
            {a.imageUrl && <img className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-soft group-hover:scale-[1.04]" src={a.imageUrl} alt="" loading="lazy" decoding="async"/>}
          </div>
          <div>
            <span className={categoryTag(true)}>{categoryLabel(a)}</span>
            <h3 className="my-2 text-[clamp(1.125rem,1rem+0.4vw,1.375rem)] leading-[1.3] underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-red max-sm:my-1.5 max-sm:text-18">{a.title}</h3>
            <p className="mb-2.5 line-clamp-3 text-16 leading-[1.55] text-muted max-sm:hidden">{a.excerpt}</p>
            <div className={meta()}>{a.author} · {dateLabel(a.publishedAt)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
