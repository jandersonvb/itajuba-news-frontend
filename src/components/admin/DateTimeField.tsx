'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { admControl, admHint, admIconButton, admLabel, cx } from '@/lib/styles';
import Icon from './Icon';

type Props = {
  name: string;
  label: string;
  /** `YYYY-MM-DDTHH:mm`, as a datetime-local input would hold it. */
  defaultValue?: string;
  required?: boolean;
  hint?: string;
};

type Day = { y: number; m: number; d: number };

const pad = (n: number) => String(n).padStart(2, '0');
const iso = ({ y, m, d }: Day) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (v: string): Day | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) } : null;
};
/** Day moved by `days` (and `months`), normalized through UTC so month ends roll over. */
const shift = ({ y, m, d }: Day, days: number, months = 0): Day => {
  const target = new Date(Date.UTC(y, m + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, last) + days));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
};
/** Today in Brasília, the time zone of the campaigns. */
const today = (): Day => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'America/Sao_Paulo' }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return { y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day) };
};
const sameDay = (a: Day | null, b: Day | null) => !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;

const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const WEEKDAYS = [['D', 'domingo'], ['S', 'segunda-feira'], ['T', 'terça-feira'], ['Q', 'quarta-feira'], ['Q', 'quinta-feira'], ['S', 'sexta-feira'], ['S', 'sábado']];

/** 42 days (6 weeks, starting on Sunday) around the month of `view`. */
function weeks(view: Day) {
  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  return Array.from({ length: 42 }, (_, i) => shift({ y: view.y, m: view.m, d: 1 }, i - first));
}

/** Time typed as digits only: "0830" becomes "08:30". */
const formatTime = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

/**
 * Date and time of the admin forms, without the browser's datetime-local picker: a calendar for the
 * day and an "hh:mm" field for the time. The form receives `name` as `YYYY-MM-DDTHH:mm`.
 * Calendar keys: arrows move by day and week, Page Up/Down by month, Home/End to the week's ends,
 * Enter picks, Esc closes.
 */
export default function DateTimeField({ name, label, defaultValue = '', required = true, hint }: Props) {
  const id = useId();
  const [date, setDate] = useState(defaultValue.slice(0, 10));
  const [time, setTime] = useState(defaultValue.slice(11, 16));
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<Day>(() => parse(defaultValue.slice(0, 10)) ?? today());
  const [invalid, setInvalid] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  /** Set when the focus must go to the calendar day (opening, arrow keys), not by the month buttons. */
  const focusDay = useRef(false);

  const chosen = parse(date);
  const now = today();
  const value = chosen && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? `${date}T${time}` : '';

  const place = useCallback(() => {
    const anchor = button.current;
    const panel = popup.current;
    if (!anchor || !panel) return;
    const r = anchor.getBoundingClientRect();
    const height = panel.offsetHeight;
    const up = window.innerHeight - r.bottom < height + 12 && r.top > height + 12;
    panel.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8))}px`;
    panel.style.top = up ? `${r.top - height - 4}px` : `${r.bottom + 4}px`;
  }, []);

  useLayoutEffect(() => {
    const panel = popup.current;
    if (!panel?.showPopover) return;
    const shown = panel.matches(':popover-open');
    if (open && !shown) panel.showPopover();
    if (!open && shown) panel.hidePopover();
    if (open) place();
  }, [open, place]);

  // The focused day follows the arrows.
  useEffect(() => {
    if (!open || !focusDay.current) return;
    focusDay.current = false;
    grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [open, focus]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!box.current?.contains(target) && !popup.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  function show() {
    focusDay.current = true;
    setFocus(chosen ?? now);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  function pick(day: Day) {
    setDate(iso(day));
    setInvalid(false);
    close();
  }

  function onGridKey(e: React.KeyboardEvent) {
    const moves: Record<string, () => Day> = {
      ArrowLeft: () => shift(focus, -1),
      ArrowRight: () => shift(focus, 1),
      ArrowUp: () => shift(focus, -7),
      ArrowDown: () => shift(focus, 7),
      Home: () => shift(focus, -new Date(Date.UTC(focus.y, focus.m, focus.d)).getUTCDay()),
      End: () => shift(focus, 6 - new Date(Date.UTC(focus.y, focus.m, focus.d)).getUTCDay()),
      PageUp: () => shift(focus, 0, e.shiftKey ? -12 : -1),
      PageDown: () => shift(focus, 0, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      focusDay.current = true;
      setFocus(moves[e.key]());
    }
  }

  const days = weeks(focus);

  return (
    <div className="grid min-w-0 gap-[7px]">
      <label htmlFor={id} className={admLabel}>{label}</label>
      <div ref={box} className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
        <div className="relative min-w-0">
          {/* Takes part in the form validation (required) for the visible button above it. */}
          <input
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full opacity-0"
            required={required}
            value={date}
            onChange={() => {}}
            onInvalid={() => setInvalid(true)}
            onFocus={() => button.current?.focus()}
          />
          <button
            ref={button}
            id={id}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={hint ? id + '-hint' : undefined}
            aria-invalid={invalid || undefined}
            className={cx(admControl, 'relative flex items-center gap-2.5 text-left [&_svg]:size-4 [&_svg]:text-adm-faint', invalid && 'border-adm-danger', open && 'border-adm-border-hover')}
            onClick={() => (open ? setOpen(false) : show())}
          >
            <Icon name="calendar"/>
            {chosen ? <span className="tabular-nums">{`${pad(chosen.d)}/${pad(chosen.m + 1)}/${chosen.y}`}</span> : <span className="text-adm-faint">dd/mm/aaaa</span>}
          </button>
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="hh:mm"
          maxLength={5}
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          title="Horário no formato hh:mm, de 00:00 a 23:59"
          aria-label={label + ': horário'}
          required={required}
          value={time}
          onChange={(e) => setTime(formatTime(e.target.value))}
          className={cx(admControl, 'text-center tabular-nums')}
        />
        <input type="hidden" name={name} value={value}/>
      </div>
      {hint && <small id={id + '-hint'} className={admHint}>{hint}</small>}

      <div
        ref={popup}
        popover="manual"
        role="dialog"
        aria-label={'Escolher a data: ' + label}
        className="fixed inset-auto m-0 h-auto w-[296px] rounded-xl border border-adm-border-strong bg-adm-surface p-3 text-adm-text shadow-adm-pop"
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          // Closes only the calendar, not the drawer (<dialog>) it is in.
          e.preventDefault();
          e.stopPropagation();
          close();
        }}
        onBlur={(e) => {
          if (!popup.current?.contains(e.relatedTarget as Node) && e.relatedTarget !== button.current) setOpen(false);
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" className={admIconButton()} aria-label="Mês anterior" onClick={() => setFocus(shift(focus, 0, -1))}><Icon name="chevronLeft"/></button>
          <p className="text-13 font-bold text-adm-strong first-letter:uppercase" aria-live="polite">{monthTitle.format(Date.UTC(focus.y, focus.m, 1))}</p>
          <button type="button" className={admIconButton()} aria-label="Próximo mês" onClick={() => setFocus(shift(focus, 0, 1))}><Icon name="chevronRight"/></button>
        </div>
        <div className="grid grid-cols-7 text-center text-11 font-bold tracking-[0.08em] text-adm-faint" aria-hidden="true">
          {WEEKDAYS.map(([letter, day]) => <span key={day} className="py-1" title={day}>{letter}</span>)}
        </div>
        <div ref={grid} className="grid grid-cols-7 gap-0.5" onKeyDown={onGridKey}>
          {days.map((day) => {
            const selected = sameDay(day, chosen);
            const outside = day.m !== focus.m;
            return (
              <button
                key={iso(day)}
                type="button"
                tabIndex={sameDay(day, focus) ? 0 : -1}
                aria-label={fullDate.format(Date.UTC(day.y, day.m, day.d))}
                aria-pressed={selected}
                aria-current={sameDay(day, now) ? 'date' : undefined}
                className={cx(
                  'grid h-9 place-items-center rounded-lg text-13 font-semibold tabular-nums transition-colors duration-100',
                  selected ? 'bg-red text-white hover:bg-red-dark' : cx('hover:bg-adm-raised', outside ? 'text-adm-faint' : 'text-adm-text'),
                  !selected && sameDay(day, now) && 'shadow-[inset_0_0_0_1px_var(--color-adm-border-hover)]',
                )}
                onClick={() => pick(day)}
              >
                {day.d}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between border-t border-adm-border pt-2">
          <button type="button" className="rounded-md px-2 py-1.5 text-12 font-bold text-adm-muted hover:bg-adm-raised hover:text-adm-strong" onClick={() => pick(now)}>Hoje</button>
          <button type="button" className="rounded-md px-2 py-1.5 text-12 font-bold text-adm-muted hover:bg-adm-raised hover:text-adm-strong" onClick={close}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
