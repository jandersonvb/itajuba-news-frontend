import { articleColumn, categoryTag, cx, excerpt } from '@/lib/styles';

/** Text of the institutional pages: sections, lists with red markers, links and tables. */
const prose = cx(
  '[&_p+p]:mt-[1.1em] [&_p+ul]:mt-[1.1em] [&_ul+p]:mt-[1.1em]',
  '[&_h2]:mt-[1.9em] [&_h2]:mb-[0.55em] [&_h2]:text-[clamp(1.25rem,1.15rem+0.5vw,1.5rem)] [&_h2:first-child]:mt-0',
  '[&_ul]:grid [&_ul]:list-disc [&_ul]:gap-[0.4em] [&_ul]:pl-[1.25em] [&_li::marker]:text-red-text',
  '[&_strong]:font-bold [&_strong]:text-ink',
  '[&_a]:text-red-text [&_a]:underline [&_a]:underline-offset-[0.15em] [&_a]:[overflow-wrap:anywhere] [&_a:hover]:decoration-2',
  '[&_table]:w-full [&_table]:min-w-[520px] [&_table]:border-collapse [&_table]:text-15 [&_table]:leading-[1.5]',
  '[&_:is(th,td)]:border-b [&_:is(th,td)]:px-3 [&_:is(th,td)]:py-2.5 [&_:is(th,td)]:text-left [&_:is(th,td)]:align-top',
  '[&_td]:border-line [&_th]:border-line-strong [&_th]:font-bold [&_th]:text-ink',
  '[&_code]:text-[0.875em] [&_code]:[overflow-wrap:anywhere]',
);

/** Institutional page (expediente, contato, privacidade, termos), in the article's text column. */
export default function InfoPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="pt-[clamp(28px,5vw,64px)] pb-[72px]">
      <header className={articleColumn}>
        <span className={categoryTag()}>Institucional</span>
        <h1 className="my-[18px] text-[clamp(1.875rem,1.2rem+2.8vw,3.25rem)] leading-[1.15] tracking-[-0.025em]">{title}</h1>
        <p className={excerpt}>{intro}</p>
      </header>
      <div className={cx(articleColumn, 'mt-9 text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-[1.75] font-medium text-[#27272a] max-sm:text-18', prose)}>{children}</div>
    </main>
  );
}
