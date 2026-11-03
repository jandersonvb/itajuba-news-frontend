'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { admButton, cx } from '@/lib/styles';
import Icon from './Icon';

export type ConfirmOptions = {
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button and warning icon, for actions that delete or cut access. */
  danger?: boolean;
};

type Request = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * The panel's replacement for window.confirm(): `const [confirm, confirmDialog] = useConfirm()`,
 * render `confirmDialog`, then `if (!(await confirm({...}))) return;`. Esc and "Cancelar" answer no.
 */
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })), []);
  const dialog = request && (
    <ConfirmDialog
      key={request.title}
      {...request}
      onAnswer={(ok) => {
        request.resolve(ok);
        setRequest(null);
      }}
    />
  );
  return [confirm, dialog] as const;
}

function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancelar', danger, onAnswer }: ConfirmOptions & { onAnswer: (ok: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const answered = useRef(false);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    dialog.current?.showModal();
    // The safe choice has the focus: Enter right away does not delete anything.
    cancel.current?.focus();
  }, []);

  function answer(ok: boolean) {
    if (answered.current) return;
    answered.current = true;
    dialog.current?.close();
    onAnswer(ok);
  }

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      className="m-auto w-[min(440px,calc(100vw-32px))] max-w-none rounded-2xl border border-adm-border-strong bg-adm-surface p-0 text-adm-text shadow-adm-toast open:animate-pop backdrop:bg-[rgb(8_8_12/0.55)] backdrop:backdrop-blur-[2px]"
      onCancel={(e) => {
        e.preventDefault();
        answer(false);
      }}
      onClose={() => answer(false)}
    >
      <div className="flex gap-3.5 px-6 pt-6 pb-5">
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', danger ? 'bg-adm-danger-bg text-adm-danger' : 'bg-adm-raised text-adm-muted')}>
          <Icon name={danger ? 'warning' : 'info'} className="size-5"/>
        </span>
        <div className="min-w-0 pt-1.5">
          <h2 id={titleId} className="text-17 text-adm-strong">{title}</h2>
          {message && <p id={messageId} className="mt-1.5 text-14 leading-[1.55] text-adm-muted">{message}</p>}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5 border-t border-adm-border bg-adm-raised px-6 py-3.5">
        <button ref={cancel} type="button" className={admButton()} onClick={() => answer(false)}>{cancelLabel}</button>
        <button type="button" className={admButton('primary')} onClick={() => answer(true)}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
