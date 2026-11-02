import Link from 'next/link';
import { Article, dateLabel } from '@/lib/api';

/** Label above the title: the editoria, and whether the article is a demo. */
export const categoryLabel = (a: Article) => (a.category?.name || 'Itajubá News') + (a.demo ? ' · exemplo' : '');

/** News cards of the listings (home, editorias and search). */
export default function NewsList({ articles, empty }: { articles: Article[]; empty: string }) {
  if (!articles.length) return <div className="empty">{empty}</div>;
  return (
    <div className="news-list">
      {articles.map((a) => (
        <Link className="news-card" key={a.id} href={'/noticias/' + a.slug}>
          <div className="thumb">{a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" decoding="async"/>}</div>
          <div>
            <span className="category plain">{categoryLabel(a)}</span>
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
            <div className="meta">{a.author} · {dateLabel(a.publishedAt)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
