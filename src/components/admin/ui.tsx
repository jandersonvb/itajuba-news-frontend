'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { failure, IMAGE_TYPES, uploadImage } from '@/lib/admin-client';
import Icon from './Icon';

/** Address-friendly version of a title: lowercase, no accents, words joined by hyphens. */
export const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100).replace(/-+$/, '');

/** What the API accepts in image fields: an uploaded image or an absolute http(s) URL. */
const isImageUrl = (v: string) => /^(\/media\/|https?:\/\/)/.test(v);

const initial = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? value : '');

type FieldProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'defaultValue'>;

export function Field({ label, value, hint, required = true, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <input {...input} id={id} required={required} defaultValue={initial(value)} aria-describedby={hint ? id + '-hint' : undefined}/>
      {hint && <small id={id + '-hint'} className="adm-hint">{hint}</small>}
    </div>
  );
}

type TextAreaProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'value' | 'defaultValue'>;

/** Textarea with a character counter when it has a maxLength. */
export function TextArea({ label, value, hint, required = true, maxLength, ...textarea }: TextAreaProps) {
  const id = useId();
  const [length, setLength] = useState(String(initial(value)).length);
  return (
    <div className="adm-field">
      <label htmlFor={id}>
        {label}
        {maxLength && <span className="adm-counter">{length.toLocaleString('pt-BR')}/{maxLength.toLocaleString('pt-BR')}</span>}
      </label>
      <textarea {...textarea} id={id} required={required} maxLength={maxLength} defaultValue={String(initial(value))} onInput={(e) => setLength(e.currentTarget.value.length)} aria-describedby={hint ? id + '-hint' : undefined}/>
      {hint && <small id={id + '-hint'} className="adm-hint">{hint}</small>}
    </div>
  );
}

type SelectProps = { name: string; label: string; value?: unknown; hint?: React.ReactNode; children: React.ReactNode } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'value' | 'defaultValue'>;

export function Select({ label, value, hint, children, ...select }: SelectProps) {
  const id = useId();
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <select {...select} id={id} defaultValue={String(initial(value))} aria-describedby={hint ? id + '-hint' : undefined}>{children}</select>
      {hint && <small id={id + '-hint'} className="adm-hint">{hint}</small>}
    </div>
  );
}

/** Checkbox drawn as an on/off switch, with a title and a one-line explanation. */
export function Switch({ name, label, description, checked, disabled }: { name: string; label: string; description?: string; checked: boolean; disabled?: boolean }) {
  return (
    <label className="adm-switch">
      <span>
        <b>{label}</b>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" role="switch" name={name} defaultChecked={checked} disabled={disabled}/>
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
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <div className="adm-image-row">
        <input ref={input} id={id} name={name} type="text" inputMode="url" required={required} value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="/media/... ou https://..." aria-describedby={hint ? id + '-hint' : undefined}/>
        <button type="button" className="adm-btn" disabled={uploading} onClick={() => picker.current?.click()}><Icon name="upload"/>{uploading ? 'Enviando…' : 'Enviar'}</button>
        <input ref={picker} type="file" accept={IMAGE_TYPES} hidden onChange={upload}/>
      </div>
      {hint && <small id={id + '-hint'} className="adm-hint">{hint}</small>}
      {error && <small className="adm-field-error" role="alert">{error}</small>}
      {url && valid && <img className="adm-image-preview" src={url} alt="Pré-visualização da imagem"/>}
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
    <div className="adm-menu" ref={root} onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <button ref={button} type="button" className={className} aria-label={label} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>{trigger}</button>
      {open && <div id={panelId} className={'adm-menu-panel' + (panelClassName ? ' ' + panelClassName : '')}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

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
  children: React.ReactNode;
};

/** Form in a modal panel that slides in from the right. Esc, the X and Cancelar close it. */
export function Drawer({ title, description, wide, submitLabel, busy, error, onSubmit, onInput, onClose, children }: DrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog ref={dialog} className={'adm-drawer' + (wide ? ' wide' : '')} onClose={onClose} aria-labelledby={titleId}>
      <form onSubmit={onSubmit} onInput={onInput}>
        <header className="adm-drawer-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="adm-icon-btn" aria-label="Fechar" onClick={close}><Icon name="close"/></button>
        </header>
        <div className="adm-drawer-body">{children}</div>
        <footer className="adm-drawer-foot">
          {error && <p className="adm-form-error" role="alert"><Icon name="alert"/>{error}</p>}
          <button type="button" className="adm-btn" onClick={close}>{submitLabel ? 'Cancelar' : 'Fechar'}</button>
          {submitLabel && <button className="adm-btn primary" disabled={busy}>{busy ? 'Salvando…' : submitLabel}</button>}
        </footer>
      </form>
    </dialog>
  );
}
