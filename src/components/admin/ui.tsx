'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { failure, IMAGE_TYPES, uploadImage } from '@/lib/admin-client';
import { admButton, admControl, admHint, admIconButton, admLabel, cx } from '@/lib/styles';
import BaseSelect, { type SelectOption } from '../Select';
import Icon from './Icon';

/** Address-friendly version of a title: lowercase, no accents, words joined by hyphens. */
export const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100).replace(/-+$/, '');

/** What the API accepts in image fields: an uploaded image or an absolute http(s) URL. */
const isImageUrl = (v: string) => /^(\/media\/|https?:\/\/)/.test(v);

const initial = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? value : '');

/** Label, control and hint, stacked. */
const fieldBox = 'grid min-w-0 gap-[7px]';

/** Number fields without the browser's spin buttons. */
const noSpinner = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** Transparent checkerboard behind images, so transparent PNGs are visible as such. */
export const checkerboard = 'bg-[repeating-conic-gradient(var(--color-adm-check-a)_0_25%,var(--color-adm-check-b)_0_50%)] bg-[length:16px_16px]';

type FieldProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'defaultValue' | 'className'>;

export function Field({ label, value, hint, required = true, type, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className={fieldBox}>
      <label htmlFor={id} className={admLabel}>{label}</label>
      <input {...input} type={type} id={id} required={required} defaultValue={initial(value)} data-autofocus={input.autoFocus || undefined} aria-describedby={hint ? id + '-hint' : undefined} className={cx(admControl, type === 'number' && noSpinner)}/>
      {hint && <small id={id + '-hint'} className={admHint}>{hint}</small>}
    </div>
  );
}

type TextAreaProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'value' | 'defaultValue' | 'className'>;

/** Textarea with a character counter when it has a maxLength. */
export function TextArea({ label, value, hint, required = true, maxLength, ...textarea }: TextAreaProps) {
  const id = useId();
  const [length, setLength] = useState(String(initial(value)).length);
  return (
    <div className={fieldBox}>
      <label htmlFor={id} className={admLabel}>
        {label}
        {maxLength && <span className="text-12 font-medium text-adm-faint tabular-nums">{length.toLocaleString('pt-BR')}/{maxLength.toLocaleString('pt-BR')}</span>}
      </label>
      <textarea {...textarea} id={id} required={required} data-autofocus={textarea.autoFocus || undefined} maxLength={maxLength} defaultValue={String(initial(value))} onInput={(e) => setLength(e.currentTarget.value.length)} aria-describedby={hint ? id + '-hint' : undefined} className={cx(admControl, 'min-h-24 resize-y')}/>
      {hint && <small id={id + '-hint'} className={admHint}>{hint}</small>}
    </div>
  );
}

type SelectProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode; options: SelectOption[]; required?: boolean };

/** Labeled select of the admin forms (the panel's own list, see components/Select.tsx). */
export function Select({ name, label, value, hint, options, required }: SelectProps) {
  const id = useId();
  return (
    <div className={fieldBox}>
      <label htmlFor={id} className={admLabel}>{label}</label>
      <BaseSelect id={id} name={name} options={options} defaultValue={String(initial(value))} required={required} aria-describedby={hint ? id + '-hint' : undefined}/>
      {hint && <small id={id + '-hint'} className={admHint}>{hint}</small>}
    </div>
  );
}

/** Checkbox drawn as an on/off switch, with a title and a one-line explanation. */
export function Switch({ name, label, description, checked, disabled }: { name: string; label: string; description?: string; checked: boolean; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-adm-border bg-adm-input px-3.5 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-55">
      <span>
        <b className="block text-13 text-adm-strong">{label}</b>
        {description && <small className="mt-[3px] block text-12 leading-[1.4] text-adm-faint">{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={checked}
        disabled={disabled}
        className={cx(
          'relative m-0 h-[22px] w-10 shrink-0 cursor-pointer appearance-none rounded-full bg-adm-switch-off transition-colors duration-150 checked:bg-red disabled:cursor-not-allowed',
          "after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgb(0_0_0/0.4)] after:transition-transform after:duration-[180ms] after:ease-soft after:content-[''] checked:after:translate-x-[18px]",
        )}
      />
    </label>
  );
}

/**
 * Image field filled by hand or by uploading a file. A text input, since type="url" would make the
 * browser reject the relative `/media/...` path.
 */
export function ImageField({ name, label, value, hint, required = false }: { name: string; label: string; value?: unknown; hint?: string; required?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(typeof value === 'string' ? value : '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const valid = !url || isImageUrl(url);

  useEffect(() => {
    input.current?.setCustomValidity(valid ? '' : 'Use uma imagem enviada (/media/...) ou um endereço que comece com http:// ou https://');
  }, [valid]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      setUrl((await uploadImage(file)).url);
    } catch (err) {
      setError(failure(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={fieldBox}>
      <label htmlFor={id} className={admLabel}>{label}</label>
      <div className="flex gap-2">
        <input ref={input} id={id} name={name} type="text" inputMode="url" required={required} value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="/media/... ou https://..." aria-describedby={hint ? id + '-hint' : undefined} className={cx(admControl, 'min-w-0 flex-1')}/>
        <button type="button" className={admButton('default', { tall: true })} disabled={uploading} onClick={() => picker.current?.click()}><Icon name="upload"/>{uploading ? 'Enviando…' : 'Enviar'}</button>
        <input ref={picker} type="file" accept={IMAGE_TYPES} hidden onChange={upload}/>
      </div>
      {hint && <small id={id + '-hint'} className={admHint}>{hint}</small>}
      {error && <small className="text-12 leading-[1.5] text-adm-danger" role="alert">{error}</small>}
      {url && valid && <img className={cx('block max-h-[180px] max-w-full rounded-lg border border-adm-border object-contain', checkerboard)} src={url} alt="Pré-visualização da imagem"/>}
    </div>
  );
}

type DropdownProps = {
  /** Accessible name of the trigger button. */
  label: string;
  trigger: React.ReactNode;
  className?: string;
  panelClassName?: string;
  children: (close: () => void) => React.ReactNode;
};

/** Button that opens a panel below it. A click outside, Esc or leaving it with Tab closes the panel. */
export function Dropdown({ label, trigger, className, panelClassName, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={root} onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <button ref={button} type="button" className={className} aria-label={label} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>{trigger}</button>
      {open && (
        <div id={panelId} className={cx('absolute top-[calc(100%+10px)] right-0 z-30 min-w-[200px] animate-pop rounded-xl border border-adm-border-strong bg-adm-surface p-1.5 shadow-adm-pop', panelClassName)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Item of a Dropdown panel (a button or, with `href`, a link). */
export const menuItem = (danger = false) =>
  cx(
    'flex w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 py-[9px] text-left text-13 leading-none font-semibold [&_svg]:size-4',
    danger ? 'text-adm-danger hover:bg-adm-danger-bg [&_svg]:text-adm-danger' : 'text-adm-text hover:bg-adm-raised hover:text-adm-strong [&_svg]:text-adm-muted',
  );

type DrawerProps = {
  title: string;
  description?: string;
  wide?: boolean;
  /** Label of the submit button; without it the drawer is read-only and only closes. */
  submitLabel?: string;
  busy?: boolean;
  error?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onInput?: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  /** The <form>, for code that reads the fields outside an event (e.g. the article draft on pagehide). */
  formRef?: React.Ref<HTMLFormElement>;
  children: React.ReactNode;
};

/** Form in a modal panel that slides in from the right. Esc, the X and Cancelar close it. */
export function Drawer({ title, description, wide, submitLabel, busy, error, onSubmit, onInput, onClose, formRef, children }: DrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialog.current?.showModal();
    // React's autoFocus runs before the dialog opens; showModal() would focus the X. The first field marked for it wins.
    dialog.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className={cx(
        'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh max-w-[100vw] border-0 border-l border-adm-border bg-adm-surface p-0 text-adm-text shadow-adm-drawer',
        'open:animate-drawer-in backdrop:bg-[rgb(8_8_12/0.55)] backdrop:backdrop-blur-[2px]',
        wide ? 'w-[min(760px,100vw)]' : 'w-[min(540px,100vw)]',
      )}
      onClose={onClose}
      aria-labelledby={titleId}
    >
      <form ref={formRef} className="flex h-full flex-col" onSubmit={onSubmit} onInput={onInput}>
        <header className="flex items-start justify-between gap-4 border-b border-adm-border px-6 py-5 max-sm:px-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-19 tracking-[-0.01em] text-adm-strong">{title}</h2>
            {description && <p className="mt-1 truncate text-13 text-adm-muted">{description}</p>}
          </div>
          <button type="button" className={admIconButton()} aria-label="Fechar" onClick={close}><Icon name="close"/></button>
        </header>
        <div className="grid flex-1 content-start gap-[18px] overflow-y-auto px-6 pt-[22px] pb-7 max-sm:px-4">{children}</div>
        <footer className="flex flex-wrap items-center justify-end gap-2.5 border-t border-adm-border bg-adm-surface px-6 py-3.5 max-sm:px-4">
          {error && (
            <p className="flex flex-[1_1_100%] items-start gap-2 rounded-lg border border-adm-danger-border bg-adm-danger-bg px-3 py-2.5 text-13 leading-[1.45] text-adm-danger [&_svg]:mt-px [&_svg]:size-4" role="alert">
              <Icon name="alert"/>
              {error}
            </p>
          )}
          <button type="button" className={admButton()} onClick={close}>{submitLabel ? 'Cancelar' : 'Fechar'}</button>
          {submitLabel && <button className={admButton('primary')} disabled={busy}>{busy ? 'Salvando…' : submitLabel}</button>}
        </footer>
      </form>
    </dialog>
  );
}
