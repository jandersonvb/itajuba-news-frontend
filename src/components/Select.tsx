'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@/lib/styles';

export type SelectOption = { value: string; label: string };

type Variant = 'portal' | 'search' | 'admin';

type Props = {
  name: string;
  options: SelectOption[];
  /** Initial value when uncontrolled. Defaults to the first option. */
  defaultValue?: string;
  /** Controlled value; pair it with onChange. */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: Variant;
  /** Id of the button, for a <label htmlFor>. */
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Classes of the outer box (margins, grid placement). */
  className?: string;
};

const looks: Record<Variant, { trigger: string; invalid: string; chevron: string; list: string; option: string; check: string }> = {
  portal: {
    trigger:
      'min-h-[46px] rounded-md border border-line-strong bg-white py-[11px] pr-10 pl-[13px] text-16 leading-[1.4] font-normal text-ink transition-[border-color,box-shadow] duration-150 focus:border-ink focus:shadow-[0_0_0_3px_rgb(20_20_22/0.1)] focus:outline-none aria-expanded:border-ink',
    invalid: 'border-red',
    chevron: 'right-3.5 text-muted',
    list: 'rounded-md border border-line-strong bg-white p-1 text-ink shadow-card',
    option: 'rounded px-3 py-2.5 text-15 leading-[1.35] data-active:bg-paper aria-selected:font-semibold',
    check: 'text-red',
  },
  search: {
    trigger:
      'min-h-12 rounded-md border border-line-strong bg-white pr-10 pl-3.5 text-16 text-ink transition-[border-color,box-shadow] duration-150 focus:border-ink focus:shadow-[0_0_0_3px_rgb(20_20_22/0.08)] focus:outline-none aria-expanded:border-ink',
    invalid: 'border-red',
    chevron: 'right-3.5 text-muted',
    list: 'rounded-md border border-line-strong bg-white p-1 text-ink shadow-card',
    option: 'rounded px-3 py-2.5 text-15 leading-[1.35] data-active:bg-paper aria-selected:font-semibold',
    check: 'text-red',
  },
  admin: {
    trigger:
      'min-h-10 rounded-lg border border-adm-border-strong bg-adm-input py-[9px] pr-9 pl-3 text-14 leading-[1.45] font-medium text-adm-text transition-[border-color,box-shadow] duration-150 focus:border-adm-border-hover focus:shadow-[0_0_0_3px_rgb(227_20_29/0.22)] focus:outline-none aria-expanded:border-adm-border-hover disabled:cursor-not-allowed disabled:opacity-60',
    invalid: 'border-adm-danger',
    chevron: 'right-3 text-adm-faint',
    list: 'rounded-xl border border-adm-border-strong bg-adm-surface p-1.5 text-adm-text shadow-adm-pop',
    option: 'rounded-lg px-2.5 py-2 text-13 leading-[1.35] font-semibold data-active:bg-adm-raised data-active:text-adm-strong',
    check: 'text-red',
  },
};

/** Lowercase, without accents: "É" types as "e" in the type-ahead. */
const plain = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Select drawn by the portal instead of the operating system: a button that opens a list (WAI-ARIA
 * "select-only combobox"). Keyboard: arrows, Home/End, Page Up/Down, Enter or Space to choose, Esc
 * to close, and typing the first letters of an option. A hidden native <select> carries the value,
 * so forms, FormData, `required` and form.reset() keep working as before.
 */
export default function Select({ name, options, defaultValue, value: controlled, onChange, required, disabled, variant = 'admin', id, className, ...aria }: Props) {
  const look = looks[variant];
  const fallback = defaultValue ?? options[0]?.value ?? '';
  const [own, setOwn] = useState(fallback);
  const value = controlled ?? own;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const autoId = useId();
  const buttonId = id ?? autoId + '-button';
  const listId = autoId + '-list';
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const selected = options.findIndex((o) => o.value === value);
  const label = options[selected]?.label ?? '';

  /** Places the list under the button, or above it when there is more room there. */
  const place = useCallback(() => {
    const anchor = button.current;
    const list = popup.current;
    if (!anchor || !list) return;
    const r = anchor.getBoundingClientRect();
    const gap = 4;
    const margin = 8;
    const below = window.innerHeight - r.bottom - gap - margin;
    const above = r.top - gap - margin;
    const wanted = Math.min(list.scrollHeight, 296);
    const up = below < wanted && above > below;
    list.style.left = `${Math.max(margin, r.left)}px`;
    list.style.width = `${r.width}px`;
    list.style.maxHeight = `${Math.max(120, Math.min(296, up ? above : below))}px`;
    list.style.top = up ? 'auto' : `${r.bottom + gap}px`;
    list.style.bottom = up ? `${window.innerHeight - r.top + gap}px` : 'auto';
  }, []);

  // The list lives in the top layer (popover), so no overflow or modal dialog clips it.
  useLayoutEffect(() => {
    const list = popup.current;
    if (!list?.showPopover) return;
    const shown = list.matches(':popover-open');
    if (open && !shown) list.showPopover();
    if (!open && shown) list.hidePopover();
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, listId]);

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

  // form.reset() puts the native select back on its first state: follow it.
  useEffect(() => {
    const form = native.current?.form;
    if (!form || controlled !== undefined) return;
    const onReset = () => {
      setOwn(fallback);
      setInvalid(false);
    };
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [controlled, fallback]);

  function show(index: number) {
    setActive(Math.max(0, Math.min(options.length - 1, index)));
    setOpen(true);
  }

  /** Chooses an option. The change goes through the native select, as if the person had used it. */
  function choose(index: number, close = true) {
    const option = options[index];
    if (close) setOpen(false);
    button.current?.focus();
    if (!option || option.value === value || !native.current) return;
    native.current.value = option.value;
    native.current.dispatchEvent(new Event('input', { bubbles: true }));
    native.current.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Next option starting with the letters typed in the last half second. */
  function typeAhead(key: string, from: number) {
    const now = Date.now();
    const text = now - typed.current.at > 500 ? key : typed.current.text + key;
    typed.current = { text, at: now };
    const query = plain(text);
    const repeated = [...query].every((c) => c === query[0]);
    const start = repeated && query.length > 1 ? from + 1 : query.length === 1 ? from + 1 : from;
    for (let i = 0; i < options.length; i++) {
      const index = (start + i) % options.length;
      const option = plain(options[index].label);
      if (option.startsWith(query) || (repeated && option.startsWith(query[0]))) return index;
    }
    return -1;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ';
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show(selected >= 0 ? selected : 0);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        show(e.key === 'Home' ? 0 : last);
      } else if (printable) {
        e.preventDefault();
        const index = typeAhead(e.key, Math.max(selected, 0));
        if (index >= 0) choose(index, false);
      }
      return;
    }
    const move = (to: number) => {
      e.preventDefault();
      setActive(Math.max(0, Math.min(last, to)));
    };
    switch (e.key) {
      case 'ArrowDown':
        return move(active + 1);
      case 'ArrowUp':
        if (e.altKey) return e.preventDefault(), choose(active);
        return move(active - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
      case 'PageDown':
        return move(active + 10);
      case 'PageUp':
        return move(active - 10);
      case 'Enter':
      case ' ':
        e.preventDefault();
        return choose(active);
      case 'Escape':
        // Closes only the list, not the drawer (<dialog>) it is in.
        e.preventDefault();
        e.stopPropagation();
        return setOpen(false);
      case 'Tab':
        return choose(active);
      default:
        if (printable) {
          e.preventDefault();
          const index = typeAhead(e.key, active);
          if (index >= 0) setActive(index);
        }
    }
  }

  return (
    <div ref={box} className={cx('relative', className)}>
      <select
        ref={native}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full opacity-0"
        onChange={(e) => {
          setOwn(e.target.value);
          setInvalid(false);
          onChange?.(e.target.value);
        }}
        onInvalid={() => setInvalid(true)}
        // The browser focuses an invalid field on submit: hand the focus to the visible button.
        onFocus={() => button.current?.focus()}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button
        ref={button}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        disabled={disabled}
        className={cx('relative flex w-full items-center text-left', look.trigger, invalid && look.invalid)}
        onClick={() => (open ? setOpen(false) : show(selected >= 0 ? selected : 0))}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!popup.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        {...aria}
      >
        <span className="block min-w-0 flex-1 truncate">{label}</span>
        <svg
          className={cx('pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 transition-transform duration-150', look.chevron, open && 'rotate-180')}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div ref={popup} popover="manual" className={cx('fixed inset-auto m-0 h-auto overflow-y-auto overscroll-contain', look.list)}>
        <ul id={listId} role="listbox" aria-label={aria['aria-label']} aria-labelledby={aria['aria-label'] ? undefined : buttonId} onPointerDown={(e) => e.preventDefault()}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              data-active={(open && i === active) || undefined}
              className={cx('flex cursor-pointer items-center justify-between gap-3', look.option)}
              onPointerMove={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span className="min-w-0">{o.label}</span>
              {o.value === value && (
                <svg className={cx('size-4 shrink-0', look.check)} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
