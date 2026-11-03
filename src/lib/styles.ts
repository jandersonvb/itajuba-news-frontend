/**
 * Tailwind classes shared by many components: buttons, form fields and labels of the portal and of
 * the admin panel. Variants are chosen by argument, never by adding a conflicting class later: two
 * utilities for the same property would be resolved by the CSS order, not by the class order.
 */

type ClassValue = string | false | null | undefined;

/** Joins class names, skipping the empty ones. */
export const cx = (...names: ClassValue[]) => names.filter(Boolean).join(' ');

/* Portal */

const buttonTones = {
  red: 'border-red bg-red text-white hover:border-red-dark hover:bg-red-dark',
  light: 'border-line-strong bg-white text-ink hover:border-ink',
  dark: 'border-ink bg-ink text-white',
};

const buttonSizes = {
  md: 'min-h-11 px-5 text-15',
  sm: 'min-h-9 px-[13px] text-14',
  /** Next to the 48px search field. */
  lg: 'min-h-12 px-[26px] text-15',
  /** Login screens. */
  xl: 'min-h-[50px] px-5 text-16',
  /** Header: a little smaller on phones. */
  header: 'min-h-11 px-5 text-15 max-sm:min-h-10 max-sm:px-3.5 max-sm:text-14',
};

/** Portal button (also for links that look like one). */
export const button = (tone: keyof typeof buttonTones = 'red', size: keyof typeof buttonSizes = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-md border font-semibold leading-none tracking-[0.01em] whitespace-nowrap',
    'transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px',
    'disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55',
    buttonTones[tone],
    buttonSizes[size],
  );

/** Underlined-on-hover red link ("Seja um parceiro ↗"). */
export const textLink =
  'whitespace-nowrap bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_1px] bg-[position:0_100%] bg-no-repeat text-15 font-semibold text-red-text transition-[background-size] duration-200 ease-soft hover:bg-[length:100%_1px]';

/** Small uppercase label above titles; another color on dark backgrounds. */
export const eyebrow = (color = 'text-muted') => cx('text-12 leading-[1.3] font-bold tracking-[0.1em] uppercase', color);

/** Editoria tag: red box on photos and article pages, or just red text (plain) in lists. */
export const categoryTag = (plain = false) =>
  cx('inline-block text-12 leading-none font-bold tracking-[0.08em] uppercase', plain ? 'text-red-text' : 'rounded-xs bg-red px-2 pt-[5px] pb-1 text-white');

/** Date and author line; another color on photos. */
export const meta = (color = 'text-muted') => cx('text-13 leading-[1.45] font-normal', color);

/** Muted paragraph under titles. */
export const subtitle = 'text-15 leading-[1.6] text-muted';

/** Form of the portal and of the login screens: fields stacked with even gaps. */
export const form = 'mt-[22px] grid gap-[18px]';

/** Label above a portal field (it may wrap the field). */
export const formLabel = 'block text-14 leading-[1.4] font-semibold text-ink';

const fieldBase = cx(
  'mt-[7px] block w-full rounded-md border border-line-strong bg-white text-16 font-normal',
  'transition-[border-color,box-shadow] duration-150 focus:border-ink focus:shadow-[0_0_0_3px_rgb(20_20_22/0.1)] focus:outline-none',
  'user-invalid:border-red read-only:bg-paper read-only:text-ink-soft',
  // Chrome shows autofilled values in its own font until the user interacts with the page.
  '[&:-webkit-autofill::first-line]:font-sans',
);

/** Text input of the portal and login forms. */
export const formInput = cx(fieldBase, 'min-h-[46px] px-[13px] py-[11px] leading-[1.4]');

/** Password input: room on the right for the show/hide button. */
export const formPasswordInput = cx(fieldBase, 'min-h-[46px] py-[11px] pr-[52px] pl-[13px] leading-[1.4]');

export const formTextarea = cx(fieldBase, 'min-h-[120px] resize-y px-[13px] py-[11px] leading-[1.55]');

/** Pulsing red dot and uppercase label ("NO RADAR", "PLANTÃO"). */
export const tickerLabel = (color = 'text-red-text') =>
  cx(
    'inline-flex items-center gap-[9px] text-12 leading-none font-bold tracking-[0.12em] whitespace-nowrap',
    "before:size-2 before:animate-pulse-dot before:rounded-full before:bg-red before:content-['']",
    color,
  );

/** Pink box for notices on portal pages. */
export const notice = 'my-5 rounded-md border border-[#f3c6c9] border-l-4 border-l-red bg-[#fff4f4] px-[18px] py-3.5 text-15 leading-[1.6]';

/** Text column of articles and institutional pages. */
export const articleColumn = 'mx-auto w-full max-w-[calc(720px+2*var(--gutter))] px-(--gutter)';

/** Lead paragraph under the title of articles and pages. */
export const excerpt = 'text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] leading-[1.55] font-medium text-ink-soft';

/** 404 and error pages: a short centered message. */
export const pageMessage = {
  box: 'mx-auto w-full max-w-[640px] px-(--gutter) py-[clamp(64px,10vw,120px)] text-center',
  title: 'my-3 text-[clamp(2rem,1.4rem+2.4vw,3rem)]',
  text: 'mb-7 text-17 leading-[1.6] text-muted',
};

/** Wide submit button of the login screens. */
export const loginSubmit = cx(button('red', 'xl'), 'mt-1 w-full');

/** Title of the login cards. */
export const loginTitle = 'mb-2 text-[clamp(1.9rem,1.5rem+1.2vw,2.4rem)]';

/** Step label above the title on the first-access screens. */
export const loginStep =
  "mb-3.5 inline-flex items-center gap-2 text-12 leading-none font-bold tracking-[0.12em] text-red-text uppercase before:size-[7px] before:rounded-full before:bg-red before:content-['']";

/** "← Voltar" link under the login cards. */
export const loginBack = 'mt-7 inline-block text-15 font-semibold text-muted hover:text-ink';

/** Section title with the hairline and the red tab, plus a label on the right. */
export const sectionHeading = cx(
  'relative mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-ink pt-3.5',
  "before:absolute before:-top-px before:left-0 before:h-1 before:w-14 before:bg-red before:content-['']",
  '[&_:is(h1,h2)]:text-[clamp(1.5rem,1.25rem+1vw,2.125rem)]',
);

/* Admin panel */

const admButtonTones = {
  default: 'border-adm-border-strong bg-adm-raised text-adm-text hover:border-adm-border-hover hover:text-adm-strong',
  primary: 'border-red bg-red text-white hover:border-red-dark hover:bg-red-dark',
  ghost: 'border-transparent bg-transparent text-adm-muted hover:bg-adm-raised hover:text-adm-strong',
};

/** Admin button. `tall` matches the 40px fields beside it. */
export const admButton = (tone: keyof typeof admButtonTones = 'default', { tall = false } = {}) =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 text-13 leading-none font-bold whitespace-nowrap',
    'transition-[background-color,border-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4',
    tall ? 'min-h-10' : 'min-h-[38px]',
    admButtonTones[tone],
  );

/** Square icon button of the tables, the top bar and the drawers. */
export const admIconButton = ({ danger = false, small = false } = {}) =>
  cx(
    'inline-grid shrink-0 place-items-center rounded-lg border border-transparent bg-transparent p-0 text-adm-muted',
    'transition-[background-color,color,border-color] duration-150 [&_svg]:size-[17px]',
    'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:text-adm-muted',
    small ? '-my-[3px] size-[26px]' : 'size-[34px]',
    danger
      ? 'hover:border-adm-danger-border hover:bg-adm-danger-bg hover:text-adm-danger'
      : 'hover:border-adm-border-strong hover:bg-adm-raised hover:text-adm-strong',
  );

/** Label of an admin field (or legend of a group of choices). */
export const admLabel = 'flex items-baseline justify-between gap-3 p-0 text-13 leading-[1.3] font-semibold text-adm-label';

/** Look of an admin text field; also the closed state of the admin select and date field. */
export const admControl = cx(
  'w-full min-h-10 rounded-lg border border-adm-border-strong bg-adm-input px-3 py-[9px] text-14 leading-[1.45] font-medium text-adm-text',
  'transition-[border-color,box-shadow] duration-150 placeholder:text-adm-faint',
  'focus:border-adm-border-hover focus:shadow-[0_0_0_3px_rgb(227_20_29/0.22)] focus:outline-none',
  'user-invalid:border-adm-danger disabled:cursor-not-allowed disabled:opacity-60',
);

export const admHint = 'text-12 leading-[1.5] text-adm-faint';

/** Red bordered note in forms and above the lists; `info` is the neutral version. */
export const admCallout = (tone: 'warn' | 'info' = 'warn') =>
  cx(
    'rounded-[10px] border px-3.5 py-3 text-13 leading-[1.55]',
    tone === 'info' ? 'border-adm-border-strong bg-adm-raised text-adm-muted' : 'border-adm-callout-border bg-adm-callout-bg text-adm-callout',
  );
