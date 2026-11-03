import { Category } from '@/lib/api';
import { button } from '@/lib/styles';
import Select from './Select';

/** Search box of the listings. Opens /busca with the text (`q`) and, optionally, the editoria slug. */
export default function SearchForm({ categories, q = '', editoria = '' }: { categories: Category[]; q?: string; editoria?: string }) {
  return (
    <form className="mb-10 grid grid-cols-[minmax(0,1fr)_minmax(170px,240px)_auto] gap-2.5 max-sm:mb-8 max-sm:grid-cols-[minmax(0,1fr)_auto]" action="/busca" role="search">
      <input
        name="q"
        type="search"
        defaultValue={q}
        aria-label="Buscar notícias"
        placeholder="Busque por assunto ou palavra-chave…"
        className="min-h-12 rounded-md border border-line-strong bg-white px-3.5 text-16 transition-[border-color,box-shadow] duration-150 focus:border-ink focus:shadow-[0_0_0_3px_rgb(20_20_22/0.08)] max-sm:col-span-full"
      />
      <Select
        variant="search"
        name="editoria"
        aria-label="Editoria"
        defaultValue={editoria}
        options={[{ value: '', label: 'Todas as editorias' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
      />
      <button className={button('red', 'lg')}>Buscar</button>
    </form>
  );
}
