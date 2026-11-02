import { Category } from '@/lib/api';

/** Search box of the listings. Opens /busca with the text (`q`) and, optionally, the editoria slug. */
export default function SearchForm({ categories, q = '', editoria = '' }: { categories: Category[]; q?: string; editoria?: string }) {
  return (
    <form className="search-form" action="/busca" role="search">
      <input name="q" type="search" defaultValue={q} aria-label="Buscar notícias" placeholder="Busque por assunto ou palavra-chave…"/>
      <select name="editoria" defaultValue={editoria} aria-label="Editoria">
        <option value="">Todas as editorias</option>
        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      <button className="btn">Buscar</button>
    </form>
  );
}
