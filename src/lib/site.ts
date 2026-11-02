/**
 * Details of the publication, shown on /expediente, /contato, /privacidade and /termos. A field
 * still reading "[PREENCHER: ...]" appears like that on those pages until someone fills it in, and
 * the production build lists it (next.config.ts).
 */
export const SITE = {
  name: 'Itajubá News',
  legalName: '[PREENCHER: razão social]',
  cnpj: '[PREENCHER: CNPJ]',
  address: '[PREENCHER: endereço ou cidade/UF]',
  responsibleJournalist: { name: '[PREENCHER: nome]', registration: '[PREENCHER: registro profissional (MTb)]' },
  emails: {
    newsroom: '[PREENCHER: e-mail da redação]',
    commercial: '[PREENCHER: e-mail comercial]',
    privacy: '[PREENCHER: e-mail do encarregado / privacidade]',
  },
  /** Provedores que recebem dados pessoais (hospedagem, banco, e-mail transacional), com o país. */
  processors: [
    'Railway (EUA) — hospedagem do site, da API, do banco de dados e das imagens',
    'Cloudflare (EUA) — DNS, proteção contra ataques e cache do site; recebe o endereço IP de quem acessa',
    'Resend (EUA) — e-mails do painel e avisos de pedidos comerciais à equipe',
  ],
  forum: 'Itajubá/MG',
  privacyUpdatedAt: '2026-11-02',
  termsUpdatedAt: '2026-10-11',
};

const PENDING = '[PREENCHER';

/** True while the value is still a "[PREENCHER: ...]" placeholder. */
export const isPending = (value: string) => value.includes(PENDING);

/** Keys of SITE still waiting for a real value, such as `cnpj` or `emails.privacy`. */
export function missingSiteInfo(): string[] {
  const missing: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === 'string') {
      if (isPending(value)) missing.push(path);
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) walk(child, path ? path + '.' + key : key);
    }
  };
  walk(SITE, '');
  return missing;
}

/** "11 de outubro de 2026" for a `YYYY-MM-DD` day. UTC, the zone the string is parsed in, keeps the day. */
export const dayLabel = (day: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(day));
