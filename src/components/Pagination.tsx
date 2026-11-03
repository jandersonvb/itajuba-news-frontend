import Link from 'next/link';
import { button } from '@/lib/styles';

type Props = {
  /** Path of the listing, e.g. "/editoria/cidade". */
  path: string;
  /** Other query parameters to keep, e.g. the search text. */
  query?: Record<string, string>;
  page: number;
  total: number;
};

const PER_PAGE = 12;

/** "Anterior" and "Próxima". Page 1 has no `pagina` parameter: its URL is the canonical one. */
export default function Pagination({ path, query = {}, page, total }: Props) {
  const href = (n: number) => {
    const params = new URLSearchParams(query);
    if (n > 1) params.set('pagina', String(n));
    const search = params.toString();
    return search ? path + '?' + search : path;
  };
  const next = total > page * PER_PAGE;
  if (page <= 1 && !next) return null;
  return (
    <nav className="mt-7 flex gap-3" aria-label="Paginação">
      {page > 1 && <Link className={button('light')} href={href(page - 1)} rel="prev">← Anterior</Link>}
      {next && <Link className={button('light')} href={href(page + 1)} rel="next">Próxima →</Link>}
    </nav>
  );
}
