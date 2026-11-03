'use client';
import { useState } from 'react';
import { formLabel, formPasswordInput } from '@/lib/styles';

type Props = {
  id: string;
  label: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  autoFocus?: boolean;
  /** Shown right below the input, e.g. the forgot-password link. */
  children?: React.ReactNode;
};

/** Password input with a show/hide eye toggle. Same 12-character minimum as the API. */
export default function PasswordField({ id, label, name, autoComplete, autoFocus, children }: Props) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? 'Ocultar senha' : 'Mostrar senha';
  return (
    <div>
      <label htmlFor={id} className={formLabel}>{label}</label>
      <span className="relative block">
        <input id={id} type={visible ? 'text' : 'password'} name={name} autoComplete={autoComplete} required minLength={12} autoFocus={autoFocus} className={formPasswordInput}/>
        <button type="button" className="absolute right-1.5 bottom-1.5 flex size-[34px] items-center justify-center rounded-sm text-muted hover:text-ink" onClick={() => setVisible((v) => !v)} aria-label={toggleLabel} title={toggleLabel}>
          <svg className="size-[18px]" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {visible ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <path d="M1 1l22 22"/>
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </>
            )}
          </svg>
        </button>
      </span>
      {children}
    </div>
  );
}
