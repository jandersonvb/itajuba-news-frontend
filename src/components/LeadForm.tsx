'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { button, cx, form, formInput, formLabel, formTextarea } from '@/lib/styles';
import Select from './Select';

const SPACES = ['Banner premium', 'Banner lateral', 'Patrocínio de editoria'];

/** "Solicite uma proposta" of /anuncie: sends a commercial request (lead) to the newsroom. */
export default function LeadForm({ interest }: { interest: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const interestId = useId();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const formElement = e.currentTarget;
    const d = new FormData(formElement);
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: d.get('name'), email: d.get('email'), interest: d.get('interest'), message: d.get('message'), consent: d.get('consent') === 'on' }),
      });
      const result = await r.json();
      setMessage(r.ok ? 'Pedido recebido. A equipe poderá entrar em contato.' : Array.isArray(result.message) ? result.message.join(', ') : result.message || 'Não foi possível enviar.');
      if (r.ok) {
        formElement.reset();
        track('generate_lead', { interest: String(d.get('interest')) });
      }
    } catch {
      setMessage('Não foi possível enviar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={form} onSubmit={submit}>
      <label className={formLabel}>Nome ou empresa<input className={formInput} name="name" required minLength={2} maxLength={120}/></label>
      <label className={formLabel}>E-mail<input className={formInput} name="email" type="email" required maxLength={200}/></label>
      <div>
        <label className={formLabel} htmlFor={interestId}>Espaço de interesse</label>
        <Select id={interestId} variant="portal" className="mt-[7px]" name="interest" defaultValue={interest} options={SPACES.map((s) => ({ value: s, label: s }))}/>
      </div>
      <label className={formLabel}>Conte sobre sua empresa<textarea className={formTextarea} name="message" required minLength={10} maxLength={2000} rows={5}/></label>
      <label className="flex items-start gap-2.5 text-14 leading-[1.5] font-normal text-ink-soft">
        {/* Checkbox drawn by the portal: red when checked, with a white check mark. */}
        <span className="relative mt-px grid size-[18px] shrink-0 place-items-center">
          <input
            name="consent"
            type="checkbox"
            required
            className="peer size-[18px] cursor-pointer appearance-none rounded-sm border border-line-strong bg-white transition-colors duration-150 checked:border-red checked:bg-red user-invalid:border-red"
          />
          <svg className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </span>
        <span>
          Autorizo o uso destes dados para responder ao pedido comercial. Os dados serão armazenados no portal e poderão ser excluídos pela equipe a pedido. Veja a{' '}
          <Link href="/privacidade" className="text-red-text underline underline-offset-[0.15em]">Política de Privacidade</Link>.
        </span>
      </label>
      <button className={cx(button(), 'justify-self-start')} disabled={busy}>{busy ? 'Enviando…' : 'Solicitar proposta →'}</button>
      <p className="text-15 empty:hidden" role="status">{message}</p>
    </form>
  );
}
