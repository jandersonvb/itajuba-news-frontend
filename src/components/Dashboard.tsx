'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category, Me, Media, Sponsor, UserRole } from '@/lib/api';
import { adminFetch, type AdminTheme, errorMessage, failure, IMAGE_TYPES, SESSION_EXPIRED_PATH, THEME_COOKIE, uploadImage } from '@/lib/admin-client';
import { Resource, roleNames, tabsByRole } from '@/lib/permissions';
import { admButton, admCallout, admHint, admIconButton, admLabel, cx } from '@/lib/styles';
import { useConfirm } from './admin/ConfirmDialog';
import DateTimeField from './admin/DateTimeField';
import Icon, { type IconName } from './admin/Icon';
import { checkerboard, Drawer, Dropdown, Field, ImageField, menuItem, Select, slugify, Switch, TextArea } from './admin/ui';
import {
  type ArticleDraft,
  deleteAllDrafts,
  deleteDraft,
  type DraftFields,
  draftTimeLabel,
  listDrafts,
  readDraft,
  readFields,
  sameFields,
  saveDraft,
  type StoredDraft,
} from '@/lib/article-drafts';

type Row = { id: string; title?: string; name?: string; status?: string; active?: boolean; email?: string; role?: UserRole; interest?: string; message?: string; createdAt?: string; pending?: boolean; inviteExpiresAt?: string | null; inviteSent?: boolean; [key: string]: unknown };

/** Open form: the row being edited (null for a new record) and, for articles, the local draft. */
type OpenForm = {
  row: Row | null;
  /** Article id of the draft key: the row's, or that of a deleted article whose draft opened a new form. */
  draftId: string | null;
  /** Draft values the article fields were (re)mounted with, by "Restaurar" or by "Abrir" in the list. */
  restored?: DraftFields;
  /** Stored draft that differs from the article, offered with "Restaurar" and "Descartar". */
  offer?: ArticleDraft;
  /** Bumped by "Restaurar": the uncontrolled fields remount with the draft values. */
  version: number;
};

type Tab = { title: string; icon: IconName; description: string; singular?: string; create?: string };

const tabs: Record<Resource, Tab> = {
  articles: { title: 'Notícias', icon: 'articles', description: 'Matérias do portal. Rascunhos ficam só no painel; as publicadas aparecem na home.', singular: 'notícia', create: 'Nova notícia' },
  categories: { title: 'Editorias', icon: 'categories', description: 'Seções do menu do portal, da menor para a maior posição.', singular: 'editoria', create: 'Nova editoria' },
  sponsors: { title: 'Patrocinadores', icon: 'sponsors', description: 'Empresas que apoiam o portal. As ativas aparecem em “Quem apoia”.', singular: 'patrocinador', create: 'Novo patrocinador' },
  campaigns: { title: 'Campanhas', icon: 'campaigns', description: 'Banners da home. Cada posição exibe a campanha ativa mais recente.', singular: 'campanha', create: 'Nova campanha' },
  media: { title: 'Mídia', icon: 'media', description: 'Imagens para notícias, patrocinadores e campanhas. Arraste arquivos para esta página ou use “Enviar imagens”. Imagens em uso não podem ser excluídas.' },
  leads: { title: 'Pedidos comerciais', icon: 'leads', description: 'Contatos enviados pelo formulário “Anuncie” do portal.' },
  users: { title: 'Usuários', icon: 'users', description: 'Contas da redação. Quem você convida recebe um e-mail e cria a própria senha; ninguém precisa repassar senhas.', singular: 'usuário', create: 'Convidar usuário' },
};

/** Sidebar sections; each role only sees the tabs it can open. */
const groups: { title: string; items: Resource[] }[] = [
  { title: 'Conteúdo', items: ['articles', 'categories', 'media'] },
  { title: 'Comercial', items: ['sponsors', 'campaigns', 'leads'] },
  { title: 'Administração', items: ['users'] },
];

const roleHelp: Record<UserRole, string> = {
  admin: 'Acesso total, incluindo usuários, patrocinadores, campanhas e pedidos comerciais.',
  editor: 'Cria, edita e publica qualquer notícia; gerencia editorias e imagens.',
  reporter: 'Escreve as próprias notícias como rascunho e envia imagens. Um editor publica.',
};

const slots: Record<string, string> = { leaderboard: 'Banner premium', sidebar: 'Banner lateral' };

const themes: { value: AdminTheme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'moon' },
  { value: 'system', label: 'Automático', icon: 'monitor' },
];

/** Short label next to the role in the account menu. */
const accessTags: Record<UserRole, string> = { admin: 'acesso total', editor: 'editorial', reporter: 'rascunhos' };

/** Campaigns are scheduled in Brasília time. Brazil has had no daylight saving time since 2019, so the offset is fixed. */
const BRASILIA_OFFSET = '-03:00';
const brasiliaParts = (v: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' })
      .formatToParts(new Date(v))
      .map((p) => [p.type, p.value]),
  );
/** Value of a datetime-local input (`YYYY-MM-DDTHH:mm`), in Brasília time. */
const dateInput = (v: unknown) => {
  if (typeof v !== 'string') return '';
  const p = brasiliaParts(v);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
const dateLabel = (v: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(v));
/** Campaign start or end, in Brasília time like the form: "12/10/2026 08:00". */
const dayLabel = (v: unknown) => {
  if (typeof v !== 'string') return '—';
  const p = brasiliaParts(v);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
};
const sizeLabel = (bytes: number) => (bytes === 0 ? '0 KB' : bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR') + ' KB');
const plain = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const initials = (v: string) => v.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const hostname = (v: unknown) => {
  try {
    return new URL(String(v)).hostname.replace(/^www\./, '');
  } catch {
    return String(v ?? '');
  }
};
const tabHref = (r: Resource) => (r === 'articles' ? '/admin' : '/admin?aba=' + r);

type Tone = 'ok' | 'warn' | 'off' | 'info';
const pillTones: Record<Tone, string> = {
  ok: 'bg-adm-ok-bg text-adm-ok',
  warn: 'bg-adm-warn-bg text-adm-warn',
  off: 'bg-adm-chip text-adm-muted',
  info: 'bg-adm-info-bg text-adm-info',
};
/** Status tag with a dot in the text color. */
const Pill = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className={cx("inline-flex items-center gap-1.5 rounded-full px-[9px] py-1 text-12 leading-none font-bold whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current before:content-['']", pillTones[tone])}>{children}</span>
);

/** Round avatar with the initials. */
const avatar = (size: 'sm' | 'md' | 'lg' = 'md') =>
  cx(
    'grid shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#ff4d55,var(--color-red)_55%,#9b0b12)] leading-none font-extrabold tracking-[0.02em] text-white',
    { sm: 'size-8 text-12', md: 'size-9 text-13', lg: 'size-12 text-16' }[size],
  );

/** Small image (or icon placeholder) at the start of a table row. */
const thumb = (kind: 'photo' | 'logo' | 'banner', empty: boolean) =>
  cx(
    'grid h-11 shrink-0 place-items-center overflow-hidden rounded-md border border-adm-border text-adm-faint',
    kind === 'logo' ? 'w-11 p-1' : kind === 'banner' ? 'w-24' : 'w-16',
    empty ? 'bg-adm-raised' : kind === 'logo' ? 'bg-white object-contain' : 'bg-adm-raised object-cover',
  );

const cellTitle = 'block leading-[1.35] font-bold text-adm-strong';
const cellSub = 'mt-[3px] block overflow-hidden text-12 text-ellipsis text-adm-faint';
const cellMedia = 'flex min-w-0 items-center gap-3';

/** Width of the table columns: `wide` takes the free space and wraps, `narrow` fits its content. */
const columnWidth = { wide: 'w-full min-w-[260px] whitespace-normal', narrow: 'w-[1%] whitespace-nowrap', auto: 'whitespace-nowrap' };

function campaignState(c: Row): [string, Tone] {
  if (!c.active) return ['Inativa', 'off'];
  const now = Date.now();
  if (Date.parse(String(c.startsAt)) > now) return ['Agendada', 'warn'];
  if (Date.parse(String(c.endsAt)) < now) return ['Encerrada', 'off'];
  return ['No ar', 'ok'];
}

type Stat = { label: string; value: number | string; icon: IconName; hint?: string };

/** Summary cards above the list, computed from the loaded rows. */
function stats(resource: Resource, rows: Row[]): Stat[] | null {
  const count = (test: (r: Row) => boolean) => rows.filter(test).length;
  switch (resource) {
    case 'articles':
      return [
        { label: 'Notícias', value: rows.length, icon: 'articles' },
        { label: 'Publicadas', value: count((r) => r.status === 'published'), icon: 'check', hint: 'visíveis no portal' },
        { label: 'Rascunhos', value: count((r) => r.status !== 'published'), icon: 'edit', hint: 'só no painel' },
        { label: 'Em destaque', value: count((r) => !!r.featured), icon: 'star', hint: 'na página inicial' },
      ];
    case 'sponsors':
      return [
        { label: 'Patrocinadores', value: rows.length, icon: 'sponsors' },
        { label: 'Ativos', value: count((r) => !!r.active), icon: 'check', hint: 'em “Quem apoia”' },
        { label: 'Inativos', value: count((r) => !r.active), icon: 'userOff' },
      ];
    case 'campaigns':
      return [
        { label: 'No ar', value: count((r) => campaignState(r)[0] === 'No ar'), icon: 'campaigns', hint: 'ativas e dentro da vigência' },
        { label: 'Agendadas', value: count((r) => campaignState(r)[0] === 'Agendada'), icon: 'clock' },
        { label: 'Encerradas ou inativas', value: count((r) => campaignState(r)[1] === 'off'), icon: 'userOff' },
      ];
    case 'media':
      return [
        { label: 'Imagens', value: rows.length, icon: 'media' },
        { label: 'Espaço usado', value: sizeLabel(rows.reduce((sum, r) => sum + (Number(r.size) || 0), 0)), icon: 'hardDrive', hint: 'até 4 MB por imagem' },
      ];
    case 'leads': {
      const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return [
        { label: 'Pedidos', value: rows.length, icon: 'leads' },
        { label: 'Últimos 7 dias', value: count((r) => Date.parse(String(r.createdAt)) >= week), icon: 'clock' },
      ];
    }
    case 'users':
      return [
        { label: 'Contas ativas', value: count((r) => !!r.active && !r.pending), icon: 'users' },
        { label: 'Convites pendentes', value: count((r) => !!r.active && !!r.pending), icon: 'mail', hint: 'aguardando a senha' },
        { label: 'Administradores', value: count((r) => r.role === 'admin'), icon: 'key' },
        { label: 'Editores', value: count((r) => r.role === 'editor'), icon: 'edit' },
        { label: 'Repórteres', value: count((r) => r.role === 'reporter'), icon: 'articles' },
      ];
    default:
      return null;
  }
}

/** JSON request to an admin intermediate route; throws with the API message when it fails. */
async function send<T = unknown>(url: string, method: string, data?: unknown, fallback = 'Não foi possível salvar'): Promise<T> {
  const r = await adminFetch(url, { method, headers: data === undefined ? undefined : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(errorMessage(body, fallback));
  return body as T;
}

function IconButton({ icon, label, danger, ...button }: { icon: IconName; label: string; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={admIconButton({ danger })} aria-label={label} title={label} {...button}><Icon name={icon}/></button>;
}

/** Panel where an admin sets a new password for a user; the API then ends that user's sessions. */
function PasswordDialog({ user, self, onClose, onDone }: { user: Row; self: boolean; onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (d.get('password') !== d.get('confirm')) return setError('As senhas não conferem.');
    setBusy(true);
    setError('');
    try {
      await send('/api/admin/users/' + user.id + '/password', 'PATCH', { password: d.get('password') }, 'Não foi possível redefinir a senha');
      // Resetting their own password ends the admin's session too.
      if (self) return window.location.assign(SESSION_EXPIRED_PATH);
      onDone('Senha de ' + (user.name || user.email) + ' redefinida. As sessões abertas desse usuário foram encerradas.');
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer title="Redefinir senha" description={user.name ? `${user.name} · ${user.email}` : user.email} submitLabel="Redefinir senha" busy={busy} error={error} onSubmit={submit} onClose={onClose}>
      <p className={admCallout()}>Todas as sessões abertas deste usuário serão encerradas. Ele precisará entrar de novo com a nova senha.{self ? ' Como é a sua conta, você também sairá do painel.' : ''}</p>
      <Field name="password" label="Nova senha" type="password" minLength={12} maxLength={200} autoComplete="new-password" autoFocus hint="Mínimo de 12 caracteres."/>
      <Field name="confirm" label="Repita a nova senha" type="password" minLength={12} maxLength={200} autoComplete="new-password"/>
    </Drawer>
  );
}

export default function Dashboard({ categories, me, initialTab, initialTheme }: { categories: Category[]; me: Me; initialTab: Resource; initialTheme: AdminTheme }) {
  const router = useRouter();
  const reporter = me.role === 'reporter';
  const allowed = tabsByRole[me.role];
  const [theme, setTheme] = useState(initialTheme);
  const [resource, setResource] = useState<Resource>(initialTab);
  const [rows, setRows] = useState<Row[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<OpenForm | null>(null);
  /** This user's unsaved article texts in this browser, listed on the Notícias tab. */
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [formError, setFormError] = useState('');
  const [resetting, setResetting] = useState<Row | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error'; id: number } | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const [ask, confirmDialog] = useConfirm();
  const tab = tabs[resource];
  const edit = form?.row ?? null;

  const notify = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    if (text) setToast({ text, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.tone === 'error' ? 8000 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // The campaign list and form show the sponsors, which only admins can read.
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        adminFetch('/api/admin/' + resource, { signal }),
        resource === 'campaigns' ? adminFetch('/api/admin/sponsors', { signal }) : null,
      ]);
      for (const r of [a, b]) if (r && !r.ok) throw new Error(errorMessage(await r.json().catch(() => null), 'Não foi possível carregar os registros'));
      setRows(await a.json());
      if (b) setSponsors(await b.json());
    } catch (e) {
      // A tab switch aborts the previous load, which must not overwrite the new tab's rows.
      if (signal?.aborted) return;
      setRows([]);
      notify(failure(e), 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [resource, notify]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (resource === 'articles') setDrafts(listDrafts(me.id));
  }, [resource, me.id]);

  /** Values the article form opens with: the same defaults as the fields below. */
  const articleDefaults = (row: Row | null): DraftFields => ({
    title: String(row?.title ?? ''),
    slug: String(row?.slug ?? ''),
    excerpt: String(row?.excerpt ?? ''),
    content: String(row?.content ?? ''),
    imageUrl: String(row?.imageUrl ?? ''),
    categoryId: String(row?.categoryId || categories[0]?.id || ''),
    author: String(row?.author || 'Redação Itajubá News'),
    // Reporters have neither field: FormData has no status and no featured for them.
    status: reporter ? '' : String(row?.status || 'draft'),
    featured: !reporter && !!row?.featured,
  });
  const updatedAtOf = (row: Row | null) => (typeof row?.updatedAt === 'string' ? row.updatedAt : null);

  /**
   * Writes the open article form to its local draft, or deletes the draft when the fields are back
   * to what the article has. While a stored draft waits for "Restaurar"/"Descartar" it is left alone,
   * unless `force` (Salvar, which must keep what is being sent in case the session expired).
   */
  function storeDraft(force = false) {
    clearTimeout(draftTimer.current);
    draftTimer.current = undefined;
    const el = formRef.current;
    if (!form || !el || resource !== 'articles' || readOnly || (form.offer && !force)) return;
    const fields = readFields(el);
    if (sameFields(fields, articleDefaults(form.row))) deleteDraft(me.id, form.draftId);
    else saveDraft(me.id, form.draftId, fields, updatedAtOf(form.row));
  }
  // The debounce timer and the pagehide listener run outside a render, so they call the latest version.
  const storeDraftRef = useRef(storeDraft);
  useEffect(() => {
    storeDraftRef.current = storeDraft;
  });

  const articleFormOpen = resource === 'articles' && !!form;
  useEffect(() => {
    if (!articleFormOpen) return;
    const flush = () => storeDraftRef.current();
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [articleFormOpen]);

  function onFormInput(e: React.FormEvent<HTMLFormElement>) {
    syncSlug(e);
    if (resource !== 'articles' || readOnly) return;
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => storeDraftRef.current(), 800);
  }

  /** Esc, X and Cancelar: the draft stays (a pending debounce is written now); only a save removes it. */
  function closeForm() {
    if (draftTimer.current) storeDraft();
    setForm(null);
    if (resource === 'articles') setDrafts(listDrafts(me.id));
  }

  function restoreDraft() {
    if (form?.offer) setForm({ ...form, restored: form.offer.fields, offer: undefined, version: form.version + 1 });
  }

  function discardOffer() {
    if (!form) return;
    deleteDraft(me.id, form.draftId);
    setDrafts(listDrafts(me.id));
    setForm({ ...form, offer: undefined });
  }

  /** "Abrir" in the list: the article (or, if it was deleted, a new one) with the draft already in the fields. */
  function openDraft(draft: StoredDraft) {
    openForm(draft.articleId ? rows.find((r) => r.id === draft.articleId) ?? null : null, draft);
  }

  async function discardStoredDraft(draft: StoredDraft) {
    if (!(await ask({ title: 'Descartar este texto não salvo?', message: 'Ele não poderá ser recuperado.', confirmLabel: 'Descartar', danger: true }))) return;
    deleteDraft(me.id, draft.articleId);
    setDrafts(listDrafts(me.id));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Written before sending: if the session expired, the 401 goes to the login and the text stays here.
    if (resource === 'articles') storeDraft(true);
    setBusy(true);
    setFormError('');
    const d = new FormData(e.currentTarget);
    let data: Record<string, unknown> = {};
    if (resource === 'articles') {
      data = { title: d.get('title'), slug: d.get('slug'), excerpt: d.get('excerpt'), content: d.get('content'), categoryId: d.get('categoryId'), author: d.get('author'), status: reporter ? 'draft' : d.get('status'), featured: !reporter && d.get('featured') === 'on' };
      if (d.get('imageUrl')) data.imageUrl = d.get('imageUrl');
    }
    if (resource === 'users') {
      data = { name: d.get('name'), email: d.get('email') };
      // An admin cannot change their own role or deactivate themselves; those fields are disabled.
      if (edit?.id !== me.id) Object.assign(data, { role: d.get('role'), active: edit ? d.get('active') === 'on' : true });
    }
    if (resource === 'categories') data = { name: d.get('name'), slug: d.get('slug'), position: Number(d.get('position')) };
    if (resource === 'sponsors') {
      data = { name: d.get('name'), websiteUrl: d.get('websiteUrl'), active: d.get('active') === 'on' };
      if (d.get('logoUrl')) data.logoUrl = d.get('logoUrl');
    }
    if (resource === 'campaigns') data = { name: d.get('name'), sponsorId: d.get('sponsorId'), slot: d.get('slot'), imageUrl: d.get('imageUrl'), targetUrl: d.get('targetUrl'), startsAt: new Date(String(d.get('startsAt')) + ':00' + BRASILIA_OFFSET).toISOString(), endsAt: new Date(String(d.get('endsAt')) + ':00' + BRASILIA_OFFSET).toISOString(), active: d.get('active') === 'on' };
    try {
      const saved = await send<Row>('/api/admin/' + resource + (edit ? '/' + edit.id : ''), edit ? 'PATCH' : 'POST', data);
      if (resource === 'articles' && form) {
        clearTimeout(draftTimer.current);
        deleteDraft(me.id, form.draftId);
        setDrafts(listDrafts(me.id));
      }
      setForm(null);
      await load();
      // New users (and a corrected e-mail of someone invited) get an invitation by e-mail.
      if (typeof saved?.inviteSent === 'boolean')
        notify(saved.inviteSent ? `Convite enviado para ${saved.email}.` : 'Conta criada, mas o e-mail não saiu. Confira a configuração de e-mail do servidor e use “Reenviar convite”.', saved.inviteSent ? 'ok' : 'error');
      else notify(edit ? 'Alterações salvas.' : 'Cadastro concluído.');
      // Reloads the server props too, e.g. the category select after an Editorias change.
      router.refresh();
    } catch (err) {
      setFormError(failure(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!(await ask({ title: 'Excluir este registro?', message: 'Esta ação não pode ser desfeita.', confirmLabel: 'Excluir', danger: true }))) return;
    setBusy(true);
    try {
      await send('/api/admin/' + resource + '/' + id, 'DELETE', undefined, 'Não foi possível excluir');
      await load();
      notify('Registro excluído.');
      router.refresh();
    } catch (e) {
      notify(failure(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  /** Users are never deleted: deactivating ends their sessions right away and can be undone. */
  async function toggleActive(user: Row) {
    const action = user.active ? 'Desativar' : 'Reativar';
    if (user.active && !(await ask({ title: `Desativar ${user.name || user.email}?`, message: 'As sessões abertas serão encerradas na hora. Você pode reativar a conta depois.', confirmLabel: 'Desativar', danger: true }))) return;
    setBusy(true);
    try {
      await send('/api/admin/users/' + user.id, 'PATCH', { active: !user.active }, `Não foi possível ${action.toLowerCase()} o usuário`);
      await load();
      notify(`${user.name || user.email} ${user.active ? 'desativado' : 'reativado'}.`);
    } catch (e) {
      notify(failure(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  /** A new invitation link replaces the previous one. */
  async function resendInvite(user: Row) {
    setBusy(true);
    try {
      await send('/api/admin/users/' + user.id + '/invite', 'POST', undefined, 'Não foi possível reenviar o convite');
      await load();
      notify(`Convite reenviado para ${user.email}. O link anterior deixou de valer.`);
    } catch (e) {
      notify(failure(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  function openTab(r: Resource) {
    setMenuOpen(false);
    if (r === resource) return;
    setResource(r);
    // Rows of the previous tab must not render with this tab's columns while it loads.
    setRows([]);
    setLoading(true);
    setForm(null);
    setQuery('');
    setStatusFilter('all');
    // Keeps the tab in the address, so reloading or sharing the link opens it again.
    window.history.replaceState(null, '', tabHref(r));
  }

  /**
   * Opens the form. An article with a local draft that differs from it shows "Restaurar" and
   * "Descartar"; `opened` (from the list) fills the fields with the draft right away.
   */
  function openForm(row: Row | null, opened?: StoredDraft) {
    setFormError('');
    if (resource !== 'articles') return setForm({ row, draftId: null, version: 0 });
    const draftId = opened ? opened.articleId : row?.id ?? null;
    if (opened) return setForm({ row, draftId, restored: opened.fields, version: 0 });
    const draft = readDraft(me.id, draftId);
    if (draft && sameFields(draft.fields, articleDefaults(row))) {
      // Nothing left to recover: the article already has this text.
      deleteDraft(me.id, draftId);
      setDrafts(listDrafts(me.id));
    }
    const offer = draft && !sameFields(draft.fields, articleDefaults(row)) && !lockedForReporter(row) ? draft : undefined;
    setForm({ row, draftId, offer, version: 0 });
  }

  function toggleNav() {
    if (window.matchMedia('(max-width: 960px)').matches) setMenuOpen((v) => !v);
    else setCollapsed((v) => !v);
  }

  /** New records get the slug from the title until the slug itself is typed in. */
  function syncSlug(e: React.FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement;
    const slug = e.currentTarget.elements.namedItem('slug');
    if (!(slug instanceof HTMLInputElement)) return;
    // A restored slug that was typed by hand (it differs from the title's) is kept as well.
    const restored = form?.restored;
    const restoredByHand = !!restored && restored.slug !== slugify(restored.title);
    if (target === slug) slug.dataset.edited = '1';
    // An existing slug is the public address: it only changes when typed on purpose.
    else if (!edit && (target.name === 'title' || target.name === 'name') && !slug.dataset.edited && !restoredByHand) slug.value = slugify(target.value);
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => IMAGE_TYPES.split(',').includes(f.type));
    if (!list.length) return notify('Envie imagens JPG, PNG, WebP ou GIF.', 'error');
    setBusy(true);
    let sent = 0;
    try {
      for (const file of list) {
        await uploadImage(file);
        sent++;
      }
      notify(sent === 1 ? 'Imagem enviada.' : `${sent} imagens enviadas.`);
    } catch (err) {
      notify((sent ? `${sent} enviada(s). ` : '') + failure(err), 'error');
    } finally {
      setBusy(false);
      await load();
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      notify('URL copiada: ' + url);
    } catch {
      notify('Não foi possível copiar. Copie manualmente: ' + url, 'error');
    }
  }

  function chooseTheme(value: AdminTheme) {
    setTheme(value);
    document.cookie = `${THEME_COOKIE}=${value}; path=/admin; max-age=31536000; samesite=lax`;
  }

  /** Leaving on purpose deletes the drafts (after asking); an expired session (401) never does. */
  async function logout() {
    if (listDrafts(me.id).length) {
      const ok = await ask({
        title: 'Sair e apagar os textos não salvos?',
        message: 'Você tem textos não salvos neste navegador. Ao sair, eles serão apagados.',
        confirmLabel: 'Sair e apagar',
        cancelLabel: 'Continuar no painel',
        danger: true,
      });
      if (!ok) return;
      deleteAllDrafts(me.id);
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const sponsorName = (row: Row) => sponsors.find((s) => s.id === row.sponsorId)?.name ?? (row.sponsor as Sponsor | undefined)?.name ?? '—';
  const nextPosition = Math.min(1000, Math.max(0, ...rows.map((r) => Number(r.position) || 0)) + 1);

  const visible = useMemo(() => {
    let list = rows;
    if (resource === 'articles' && statusFilter !== 'all') list = list.filter((r) => (statusFilter === 'published') === (r.status === 'published'));
    if (resource === 'categories') list = [...list].sort((a, b) => Number(a.position) - Number(b.position));
    const q = plain(query.trim());
    if (!q) return list;
    return list.filter((r) => [r.title, r.name, r.slug, r.email, r.author, r.interest, r.message, r.originalName].some((v) => plain(v).includes(q)));
  }, [rows, resource, statusFilter, query]);

  /** Reporters see their published articles read-only; the API refuses changes to them. */
  const lockedForReporter = (row: Row | null) => reporter && resource === 'articles' && row?.status === 'published';
  const readOnly = lockedForReporter(edit);
  const canDelete = (row: Row) => !lockedForReporter(row) && !(reporter && resource === 'media');

  const editActions = (row: Row) => (
    <>
      <IconButton icon={lockedForReporter(row) ? 'view' : 'edit'} label={lockedForReporter(row) ? 'Ver' : 'Editar'} disabled={busy} onClick={() => openForm(row)}/>
      {canDelete(row) && <IconButton icon="trash" label="Excluir" danger disabled={busy} onClick={() => remove(row.id)}/>}
    </>
  );

  type Column = { label: string; cell: (row: Row) => React.ReactNode; width?: keyof typeof columnWidth };
  const columns: Partial<Record<Resource, Column[]>> = {
    articles: [
      { label: 'Notícia', width: 'wide', cell: (r) => (
        <div className={cellMedia}>
          {r.imageUrl ? <img className={thumb('photo', false)} src={String(r.imageUrl)} alt="" loading="lazy"/> : <span className={thumb('photo', true)}><Icon name="articles"/></span>}
          <div className="min-w-0"><b className={cellTitle}>{r.title}</b><small className={cellSub}>/noticias/{String(r.slug)}</small></div>
        </div>
      ) },
      { label: 'Editoria', cell: (r) => categoryName.get(String(r.categoryId)) ?? '—' },
      { label: 'Autoria', cell: (r) => String(r.author || '—') },
      { label: 'Status', cell: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.status === 'published' ? <Pill tone="ok">Publicada</Pill> : <Pill tone="warn">Rascunho</Pill>}
          {!!r.featured && <Pill tone="info">Destaque</Pill>}
        </div>
      ) },
      { label: 'Data', cell: (r) => (
        <>
          {typeof r.publishedAt === 'string' ? dateLabel(r.publishedAt) : r.createdAt ? dateLabel(r.createdAt) : '—'}
          <small className={cellSub}>{typeof r.publishedAt === 'string' ? 'publicada' : 'criada'}</small>
        </>
      ) },
    ],
    categories: [
      { label: 'Posição', width: 'narrow', cell: (r) => <span className="inline-grid h-[26px] min-w-[30px] place-items-center rounded-md border border-adm-border-strong px-2 font-extrabold text-adm-strong tabular-nums">{String(r.position)}</span> },
      { label: 'Editoria', width: 'wide', cell: (r) => <><b className={cellTitle}>{r.name}</b><small className={cellSub}>/editoria/{String(r.slug)}</small></> },
    ],
    sponsors: [
      { label: 'Patrocinador', width: 'wide', cell: (r) => (
        <div className={cellMedia}>
          {r.logoUrl ? <img className={thumb('logo', false)} src={String(r.logoUrl)} alt="" loading="lazy"/> : <span className={thumb('logo', true)}><Icon name="sponsors"/></span>}
          <b className={cellTitle}>{r.name}</b>
        </div>
      ) },
      { label: 'Site', cell: (r) => (r.websiteUrl ? (
        <a className="inline-flex items-center gap-1.5 font-semibold text-adm-text hover:text-adm-strong hover:underline [&_svg]:size-[13px] [&_svg]:text-adm-faint" href={String(r.websiteUrl)} target="_blank" rel="noopener noreferrer">
          {hostname(r.websiteUrl)}<Icon name="external"/>
        </a>
      ) : '—') },
      { label: 'Status', cell: (r) => (r.active ? <Pill tone="ok">Ativo</Pill> : <Pill tone="off">Inativo</Pill>) },
    ],
    campaigns: [
      { label: 'Campanha', width: 'wide', cell: (r) => (
        <div className={cellMedia}>
          {r.imageUrl ? <img className={thumb('banner', false)} src={String(r.imageUrl)} alt="" loading="lazy"/> : <span className={thumb('banner', true)}><Icon name="campaigns"/></span>}
          <div className="min-w-0"><b className={cellTitle}>{r.name}</b><small className={cellSub}>{sponsorName(r)}</small></div>
        </div>
      ) },
      { label: 'Posição', cell: (r) => slots[String(r.slot)] ?? String(r.slot) },
      { label: 'Vigência', cell: (r) => <>{dayLabel(r.startsAt)} <span className="text-adm-faint">→</span> {dayLabel(r.endsAt)}</> },
      { label: 'Status', cell: (r) => { const [label, tone] = campaignState(r); return <Pill tone={tone}>{label}</Pill>; } },
    ],
    leads: [
      { label: 'Contato', cell: (r) => <><b className={cellTitle}>{r.name}</b><small className={cellSub}>{r.email}</small></> },
      { label: 'Interesse', cell: (r) => <Pill tone="info">{r.interest}</Pill> },
      { label: 'Mensagem', width: 'wide', cell: (r) => <p className="max-w-[60ch] leading-[1.5] whitespace-pre-line text-adm-cell [overflow-wrap:anywhere]">{r.message}</p> },
      { label: 'Recebido em', cell: (r) => (r.createdAt ? dateLabel(r.createdAt) : '—') },
    ],
    users: [
      { label: 'Usuário', width: 'wide', cell: (u) => (
        <div className={cellMedia}>
          <span className={avatar('sm')} aria-hidden="true">{initials(u.name || u.email || '?')}</span>
          <div className="min-w-0">
            <b className={cellTitle}>
              {u.name || '—'}
              {u.id === me.id && <span className="ml-2 rounded-full bg-adm-chip px-[7px] py-0.5 align-[1px] text-11 font-bold text-adm-muted">você</span>}
            </b>
            <small className={cellSub}>{u.email}</small>
          </div>
        </div>
      ) },
      { label: 'Perfil', cell: (u) => (u.role ? roleNames[u.role] : '—') },
      { label: 'Status', cell: (u) => {
        if (!u.active) return <Pill tone="off">Inativo</Pill>;
        if (!u.pending) return <Pill tone="ok">Ativo</Pill>;
        if (!u.inviteExpiresAt || Date.parse(u.inviteExpiresAt) < Date.now()) return <Pill tone="off">Convite expirado</Pill>;
        return <><Pill tone="warn">Convite pendente</Pill><small className={cellSub}>vale até {dateLabel(u.inviteExpiresAt)}</small></>;
      } },
      { label: 'Criado em', cell: (u) => (u.createdAt ? dateLabel(u.createdAt) : '—') },
    ],
  };

  const rowActions = (row: Row) => {
    if (resource === 'leads')
      return (
        <>
          <a className={admIconButton()} href={'mailto:' + row.email} aria-label={'Responder ' + row.email} title="Responder por e-mail"><Icon name="mail"/></a>
          <IconButton icon="trash" label="Excluir" danger disabled={busy} onClick={() => remove(row.id)}/>
        </>
      );
    if (resource === 'users') {
      const self = row.id === me.id;
      return (
        <>
          <IconButton icon="edit" label="Editar" disabled={busy} onClick={() => openForm(row)}/>
          {row.pending && row.active && <IconButton icon="mail" label="Reenviar convite" disabled={busy} onClick={() => resendInvite(row)}/>}
          <IconButton icon="key" label={row.pending ? 'Definir senha manualmente' : 'Redefinir senha'} disabled={busy} onClick={() => setResetting(row)}/>
          <IconButton icon={row.active ? 'userOff' : 'userOn'} label={self ? 'Você não pode desativar a própria conta' : row.active ? 'Desativar' : 'Reativar'} danger={!!row.active} disabled={busy || self} onClick={() => toggleActive(row)}/>
        </>
      );
    }
    return editActions(row);
  };

  const cards = stats(resource, rows);
  const shimmer = 'h-3 animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-adm-skeleton-a)_25%,var(--color-adm-skeleton-b)_50%,var(--color-adm-skeleton-a)_75%)] bg-[length:200%_100%]';
  const skeleton = (
    <div aria-busy="true" aria-label="Carregando">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-adm-border p-4">
          <span className={cx(shimmer, 'h-10 flex-[0_0_64px]')}/>
          <span className={cx(shimmer, 'flex-1')}/>
          <span className={cx(shimmer, 'flex-[0_0_120px]')}/>
        </div>
      ))}
    </div>
  );
  const emptyBox = 'grid justify-items-center gap-2 px-5 py-14 text-center text-adm-muted';
  const emptyIcon = 'mb-1.5 grid size-[52px] place-items-center rounded-[14px] border border-adm-border-strong bg-adm-raised text-adm-text [&_svg]:size-[22px]';

  let body: React.ReactNode;
  if (loading) body = skeleton;
  else if (rows.length === 0)
    body = (
      <div className={emptyBox}>
        <span className={emptyIcon}><Icon name={tab.icon}/></span>
        <b className="text-16 text-adm-strong">Nada por aqui ainda</b>
        <p className="mb-2 max-w-[44ch] leading-[1.5]">{resource === 'media' ? 'Arraste imagens para cá ou use “Enviar imagens”.' : resource === 'leads' ? 'Os pedidos do formulário “Anuncie” aparecerão aqui.' : `Nenhum registro em ${tab.title.toLowerCase()}.`}</p>
        {tab.create && <button type="button" className={admButton('primary')} onClick={() => openForm(null)}><Icon name="plus"/>{tab.create}</button>}
      </div>
    );
  else if (visible.length === 0)
    body = (
      <div className={emptyBox}>
        <span className={emptyIcon}><Icon name="search"/></span>
        <b className="text-16 text-adm-strong">Nenhum resultado</b>
        <p className="mb-2 max-w-[44ch] leading-[1.5]">Nada encontrado com esses filtros.</p>
        <button type="button" className={admButton()} onClick={() => { setQuery(''); setStatusFilter('all'); }}>Limpar filtros</button>
      </div>
    );
  else if (resource === 'media')
    body = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5 p-4">
        {(visible as unknown as Media[]).map((m) => (
          <figure className="m-0 flex flex-col overflow-hidden rounded-[10px] border border-adm-border bg-adm-raised transition-colors duration-150 hover:border-adm-border-strong" key={m.id}>
            <a href={m.url} target="_blank" rel="noopener" aria-label={'Abrir ' + m.originalName}><img className={cx('block aspect-[4/3] w-full object-contain', checkerboard)} src={m.url} alt="" loading="lazy"/></a>
            <figcaption className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 py-2.5 pr-2 pl-3">
              <b className="truncate text-13 text-adm-strong" title={m.originalName}>{m.originalName}</b>
              <small className="col-start-1 text-12 text-adm-faint">{sizeLabel(m.size)} · {dateLabel(m.createdAt)}</small>
              <div className="col-start-2 row-span-2 row-start-1 flex justify-end gap-0.5">
                <IconButton icon="copy" label="Copiar URL" onClick={() => copy(m.url)}/>
                {!reporter && <IconButton icon="trash" label="Excluir" danger disabled={busy} onClick={() => remove(m.id)}/>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  else {
    const cols = columns[resource] ?? [];
    body = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} scope="col" className={cx('border-b border-adm-border bg-adm-raised px-4 py-2.5 text-left text-11 leading-[1.2] font-bold tracking-[0.08em] text-adm-faint uppercase', columnWidth[c.width ?? 'auto'])}>
                  {c.label}
                </th>
              ))}
              <th scope="col" className={cx('border-b border-adm-border bg-adm-raised px-4 py-2.5', columnWidth.narrow)}><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className={cx('transition-colors duration-100 hover:bg-adm-hover [&:last-child>td]:border-b-0', resource === 'users' && !row.active && '[&>td]:opacity-55')}>
                {cols.map((c) => <td key={c.label} className={cx('border-b border-adm-border px-4 py-3 align-middle text-adm-cell', columnWidth[c.width ?? 'auto'])}>{c.cell(row)}</td>)}
                <td className={cx('border-b border-adm-border px-4 py-3 align-middle', columnWidth.narrow)}><div className="flex justify-end gap-0.5">{rowActions(row)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const dropProps = resource === 'media' && !loading
    ? {
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true); },
        onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); },
        onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); void uploadFiles(e.dataTransfer.files); },
      }
    : {};

  const self = edit?.id === me.id;
  const formTitle = readOnly ? 'Matéria publicada' : edit ? 'Editar ' + tab.singular : tab.create ?? '';
  /** Article fields: the restored draft or the article (defaults for a new one). */
  const values = form?.restored ?? articleDefaults(edit);

  const draftList = resource === 'articles' && !loading && drafts.length > 0 && (
    <section className={cx(admCallout(), 'mb-5 grid gap-2.5')} aria-label="Textos não salvos">
      <p><b>{drafts.length === 1 ? 'Você tem 1 texto não salvo neste navegador.' : `Você tem ${drafts.length} textos não salvos neste navegador.`}</b></p>
      <ul className="grid gap-2">
        {drafts.map((d) => (
          <li key={d.articleId ?? 'nova'} className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="grid min-w-0 flex-[1_1_220px]">
              <b className="truncate">{d.fields.title.trim() || 'Sem título'}</b>
              <small>{d.articleId ? 'Edição' : 'Nova notícia'} · {draftTimeLabel(d.savedAt)}</small>
            </span>
            <button type="button" className={admButton()} disabled={busy} onClick={() => openDraft(d)}>Abrir</button>
            <button type="button" className={admButton('ghost')} onClick={() => discardStoredDraft(d)}>Descartar</button>
          </li>
        ))}
      </ul>
    </section>
  );

  const navLink = (current: boolean) =>
    cx(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold whitespace-nowrap transition-colors duration-150 group-data-collapsed/adm:justify-center',
      current ? 'bg-red text-white shadow-adm-nav' : 'text-adm-nav hover:bg-adm-raised hover:text-adm-strong',
    );
  const hiddenCollapsed = 'group-data-collapsed/adm:hidden';
  const sectionTitle = 'text-11 leading-none font-bold tracking-[0.12em] text-adm-faint uppercase';

  return (
    <div
      className={cx(
        // `adm` marks the panel for the page background in globals.css; `group/adm` carries its state.
        'adm group/adm grid min-h-dvh bg-adm-bg text-14 text-adm-text transition-[grid-template-columns] duration-200 ease-soft',
        '[color-scheme:dark] data-[theme=light]:[color-scheme:light] data-[theme=system]:[color-scheme:light_dark]',
        '[--focus-offset:2px] [--focus-ring:2px_solid_var(--color-adm-focus)]',
        collapsed ? 'grid-cols-[72px_minmax(0,1fr)]' : 'grid-cols-[248px_minmax(0,1fr)]',
        'max-lg:grid-cols-[minmax(0,1fr)]',
      )}
      data-theme={theme}
      data-collapsed={collapsed || undefined}
      data-menu={menuOpen || undefined}
    >
      <aside
        id="adm-sidebar"
        className={cx(
          'sticky top-0 flex h-dvh flex-col overflow-x-hidden overflow-y-auto border-r border-adm-border bg-adm-surface',
          // Tablets and phones: an off-canvas menu.
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[272px] max-lg:-translate-x-full max-lg:transition-transform max-lg:duration-200 max-lg:ease-soft',
          'max-lg:group-data-menu/adm:translate-x-0 max-lg:group-data-menu/adm:shadow-adm-menu',
        )}
      >
        <div className="flex min-h-[76px] items-center gap-3 border-b border-adm-border px-5 py-3.5 group-data-collapsed/adm:justify-center group-data-collapsed/adm:px-2.5">
          {/* White lettering on dark themes, the original logo on light ones. */}
          <Link href="/" aria-label="Itajubá News: abrir o portal">
            <img
              className="block h-auto w-[92px] group-data-collapsed/adm:w-12 group-data-[theme=light]/adm:hidden os-light:group-data-[theme=system]/adm:hidden"
              src="/logo-dark.png"
              alt=""
              width={400}
              height={220}
            />
            {/* logo.png is a square with wide white margins; cover crops it like the portal header does. */}
            <img
              className="hidden h-[53px] w-[92px] object-cover group-data-collapsed/adm:h-7 group-data-collapsed/adm:w-12 group-data-[theme=light]/adm:block os-light:group-data-[theme=system]/adm:block"
              src="/logo.png"
              alt=""
              width={225}
              height={225}
            />
          </Link>
          <span className={cx('border-l border-adm-border-strong pl-3 text-11 leading-none font-bold tracking-[0.14em] text-adm-muted uppercase', hiddenCollapsed)}>Redação</span>
        </div>
        <nav className="flex-1 px-3 py-4" aria-label="Seções do painel">
          {groups.map((g) => {
            const items = g.items.filter((r) => allowed.includes(r));
            if (!items.length) return null;
            return (
              <div
                className="mt-5 first:mt-0 group-data-collapsed/adm:not-first:mt-3 group-data-collapsed/adm:not-first:border-t group-data-collapsed/adm:not-first:border-adm-border group-data-collapsed/adm:not-first:pt-3"
                key={g.title}
              >
                <p className={cx('mb-2 px-3 whitespace-nowrap', sectionTitle, hiddenCollapsed)}>{g.title}</p>
                <ul>
                  {items.map((r) => (
                    <li key={r} className="not-first:mt-0.5">
                      <a
                        href={tabHref(r)}
                        className={navLink(r === resource)}
                        aria-current={r === resource ? 'page' : undefined}
                        title={collapsed ? tabs[r].title : undefined}
                        onClick={(e) => {
                          // Ctrl/Cmd-click still opens the tab in a new browser tab.
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                          e.preventDefault();
                          openTab(r);
                        }}
                      >
                        <Icon name={tabs[r].icon}/>
                        <span className={hiddenCollapsed}>{tabs[r].title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-adm-border p-3">
          <a href="/" target="_blank" rel="noopener" className={navLink(false)} title={collapsed ? 'Ver portal' : undefined}><Icon name="external"/><span className={hiddenCollapsed}>Ver portal</span></a>
        </div>
      </aside>
      {menuOpen && <div className="fixed inset-0 z-30 bg-[rgb(8_8_12/0.5)] lg:hidden" aria-hidden="true" onClick={() => setMenuOpen(false)}/>}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-adm-border bg-[color-mix(in_srgb,var(--color-adm-bg)_86%,transparent)] px-7 backdrop-blur-[12px] max-lg:px-4">
          <IconButton icon="sidebar" label="Mostrar ou ocultar o menu" aria-controls="adm-sidebar" onClick={toggleNav}/>
          <p className="truncate font-semibold text-adm-faint max-sm:hidden">Redação <span className="mx-1" aria-hidden="true">/</span> <b className="text-adm-text">{tab.title}</b></p>
          <div className="ml-auto flex items-center gap-1.5">
            <Dropdown
              label={'Tema: ' + themes.find((t) => t.value === theme)?.label}
              className={cx(admIconButton(), 'aria-expanded:border-adm-border-strong aria-expanded:bg-adm-raised aria-expanded:text-adm-strong')}
              trigger={<Icon name={themes.find((t) => t.value === theme)?.icon ?? 'moon'}/>}
            >
              {(close) => <>
                <p className="px-2.5 pt-2 pb-1.5 text-13 font-extrabold text-adm-strong">Tema</p>
                {themes.map((t) => (
                  <button type="button" key={t.value} className={cx(menuItem(), theme === t.value && 'text-adm-strong')} aria-pressed={theme === t.value} onClick={() => { chooseTheme(t.value); close(); }}>
                    <span className={cx('size-1.5 shrink-0 rounded-full', theme === t.value && 'bg-adm-strong')} aria-hidden="true"/>
                    <Icon name={t.icon}/>
                    {t.label}
                  </button>
                ))}
              </>}
            </Dropdown>
            <Dropdown
              label={'Conta de ' + (me.name || me.email)}
              className="flex max-w-[300px] items-center gap-2.5 rounded-xl border border-transparent bg-transparent py-1 pr-2.5 pl-1 text-left transition-[background-color,border-color] duration-150 hover:border-adm-border hover:bg-adm-raised aria-expanded:border-adm-border aria-expanded:bg-adm-raised max-lg:pr-1"
              panelClassName="w-[300px] pt-0 max-sm:w-[min(300px,calc(100vw-32px))]"
              trigger={<>
                <span className={avatar()} aria-hidden="true">{initials(me.name || me.email)}</span>
                <span className="grid min-w-0 gap-[3px] leading-[1.2] max-lg:hidden">
                  <b className="truncate text-13 text-adm-strong">{me.name || me.email}</b>
                  <small className="truncate text-12 text-adm-muted">{me.name ? me.email : roleNames[me.role]}</small>
                </span>
              </>}
            >
              {() => <>
                <div className="-mx-1.5 mb-1.5 flex items-center gap-3 border-b border-adm-border px-4 pt-4 pb-3.5">
                  <span className={avatar('lg')} aria-hidden="true">{initials(me.name || me.email)}</span>
                  <div className="grid min-w-0 gap-[3px]">
                    <b className="truncate text-15 text-adm-strong">{me.name || 'Sem nome'}</b>
                    <small className="truncate text-13 text-adm-muted">{me.email}</small>
                  </div>
                </div>
                <dl className="m-0 grid gap-0.5 px-1 pt-0.5 pb-1">
                  {[
                    ['idCard', 'ID do usuário', <span key="id" title={me.id}>#{me.id.slice(0, 8)}</span>],
                    ['shield', 'Perfil', <>{roleNames[me.role].replace(/ \(.*\)$/, '')} <span className="ml-1 text-adm-ok">{accessTags[me.role]}</span></>],
                    ['globe', 'Portal', 'Itajubá News'],
                    ['grid', 'Áreas liberadas', allowed.length === Object.keys(tabs).length ? 'todas' : `${allowed.length} de ${Object.keys(tabs).length}`],
                  ].map(([icon, label, value]) => (
                    <div key={label as string} className="flex items-center justify-between gap-3 p-1.5">
                      <dt className="flex items-center gap-2.5 text-13 text-adm-muted [&_svg]:size-4"><Icon name={icon as IconName}/>{label}</dt>
                      <dd className="m-0 text-right text-13 font-extrabold whitespace-nowrap text-adm-strong">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="-mx-1.5 my-1.5 h-px bg-adm-border"/>
                <a className={menuItem()} href="/" target="_blank" rel="noopener"><Icon name="external"/>Ver portal</a>
                <button type="button" className={menuItem(true)} onClick={logout}><Icon name="logout"/>Sair</button>
              </>}
            </Dropdown>
          </div>
        </header>

        <main className="w-full max-w-[1480px] px-7 pt-7 pb-16 max-lg:px-4 max-sm:pt-5">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-[1_1_420px]">
              <h1 className="text-26 tracking-[-0.02em] text-adm-strong">{tab.title}</h1>
              <p className="mt-1.5 max-w-[72ch] leading-[1.55] text-adm-muted">{reporter && resource === 'articles' ? 'Suas matérias. Escreva como rascunho; um editor revisa e publica.' : tab.description}</p>
            </div>
            {tab.create && <button type="button" className={cx(admButton('primary'), 'max-sm:w-full')} onClick={() => openForm(null)}><Icon name="plus"/>{tab.create}</button>}
            {resource === 'media' && (
              <>
                <button type="button" className={cx(admButton('primary'), 'max-sm:w-full')} disabled={busy} onClick={() => picker.current?.click()}><Icon name="upload"/>{busy ? 'Enviando…' : 'Enviar imagens'}</button>
                <input ref={picker} type="file" accept={IMAGE_TYPES} multiple hidden onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); e.target.value = ''; }}/>
              </>
            )}
          </div>

          {cards && (
            <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5 max-sm:grid-cols-2 max-sm:gap-2.5">
              {cards.map((s) => (
                <div className="grid content-start gap-2 rounded-xl border border-adm-border bg-adm-surface px-[18px] py-4 max-sm:p-3.5" key={s.label}>
                  <span className="flex items-center gap-2 text-13 font-semibold text-adm-muted [&_svg]:size-[15px]"><Icon name={s.icon}/>{s.label}</span>
                  <b className="text-28 leading-none font-extrabold tracking-[-0.02em] text-adm-strong tabular-nums max-sm:text-24">{loading ? '–' : s.value}</b>
                  {s.hint && <small className="text-12 text-adm-faint">{s.hint}</small>}
                </div>
              ))}
            </div>
          )}

          {draftList}

          <section className={cx('relative overflow-hidden rounded-xl border bg-adm-surface', dragging ? 'border-red' : 'border-adm-border')} aria-label={tab.title} {...dropProps}>
            <div className="flex flex-wrap items-center gap-2.5 border-b border-adm-border px-4 py-3.5">
              <label className="relative block max-w-[360px] flex-[1_1_260px] max-sm:max-w-none">
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-adm-faint"/>
                <span className="sr-only">Buscar</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={'Buscar em ' + tab.title.toLowerCase()}
                  className="min-h-[38px] w-full rounded-lg border border-adm-border-strong bg-adm-input py-0 pr-3 pl-[38px] text-13 leading-none font-medium text-adm-text placeholder:text-adm-faint focus:border-adm-border-hover focus:shadow-[0_0_0_3px_rgb(227_20_29/0.2)] focus:outline-none"
                />
              </label>
              {resource === 'articles' && (
                <div className="inline-flex gap-0.5 rounded-[9px] border border-adm-border-strong bg-adm-input p-[3px]" role="group" aria-label="Filtrar por status">
                  {([['all', 'Todas'], ['published', 'Publicadas'], ['draft', 'Rascunhos']] as const).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={statusFilter === value}
                      className={cx('min-h-[30px] rounded-md border-0 px-3 text-12 leading-none font-bold', statusFilter === value ? 'bg-adm-strong text-adm-surface' : 'bg-transparent text-adm-muted hover:text-adm-strong')}
                      onClick={() => setStatusFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <span className="ml-auto text-11 leading-none font-bold tracking-[0.1em] whitespace-nowrap text-adm-faint uppercase max-sm:ml-0 max-sm:w-full">
                {loading ? 'Carregando…' : visible.length === rows.length ? `${rows.length} registro(s)` : `${visible.length} de ${rows.length}`}
              </span>
            </div>
            {body}
            {dragging && (
              <div className="pointer-events-none absolute inset-2 z-[2] flex flex-col items-center justify-center gap-2.5 rounded-[10px] border-2 border-dashed border-red bg-[color-mix(in_srgb,var(--color-adm-surface)_90%,transparent)] text-16 font-bold text-adm-strong [&_svg]:size-7 [&_svg]:text-red" aria-hidden="true">
                <Icon name="upload"/>Solte para enviar
              </div>
            )}
          </section>
        </main>
      </div>

      {form && (
        <Drawer
          title={formTitle}
          description={edit ? String(edit.title || edit.name || edit.email || '') : undefined}
          wide={resource === 'articles'}
          submitLabel={readOnly ? undefined : edit ? 'Salvar alterações' : resource === 'users' ? 'Enviar convite' : 'Cadastrar'}
          busy={busy}
          error={formError}
          onSubmit={save}
          onInput={onFormInput}
          onClose={closeForm}
          formRef={formRef}
        >
          {form.offer && (
            <div className={cx(admCallout(), 'mb-4 grid gap-2.5')} role="status">
              <p>
                Há um texto não salvo neste navegador, de {draftTimeLabel(form.offer.savedAt)}.
                {form.offer.baseUpdatedAt !== updatedAtOf(form.row) && ' A matéria foi alterada no painel depois disso. Restaurar substitui essas alterações.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={admButton('primary')} onClick={restoreDraft}>Restaurar</button>
                <button type="button" className={admButton()} onClick={discardOffer}>Descartar</button>
              </div>
            </div>
          )}
          {readOnly && <p className={admCallout('info')}>Somente leitura: a matéria já foi publicada. Para alterá-la, fale com um editor.</p>}
          <fieldset className="contents" disabled={readOnly} key={form.version}>
            {resource === 'articles' && <>
              <div className="grid gap-4 not-first:border-t not-first:border-adm-border not-first:pt-5">
                <h3 className={sectionTitle}>Conteúdo</h3>
                <Field name="title" label="Título" value={values.title} maxLength={200} autoFocus={!edit}/>
                <Field name="slug" label="Slug" value={values.slug} maxLength={220} hint={edit ? 'Endereço público da matéria. Mudar quebra links já compartilhados.' : 'Preenchido a partir do título. Forma o endereço /noticias/slug.'}/>
                <TextArea name="excerpt" label="Resumo" value={values.excerpt} rows={3} minLength={10} maxLength={500} hint="Aparece na home e quando a matéria é compartilhada."/>
                <TextArea name="content" label="Texto da matéria" value={values.content} rows={12} minLength={20} maxLength={100000} hint="Texto simples. Cada linha vira um parágrafo."/>
              </div>
              <div className="grid gap-4 not-first:border-t not-first:border-adm-border not-first:pt-5">
                <h3 className={sectionTitle}>Imagem</h3>
                <ImageField name="imageUrl" label="Imagem de capa (opcional)" value={values.imageUrl}/>
              </div>
              <div className="grid gap-4 not-first:border-t not-first:border-adm-border not-first:pt-5">
                <h3 className={sectionTitle}>Publicação</h3>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Select name="categoryId" label="Editoria" value={values.categoryId} required options={categories.map((c) => ({ value: c.id, label: c.name }))}/>
                  <Field name="author" label="Autoria" value={values.author} maxLength={100}/>
                </div>
                {reporter ? (
                  !readOnly && <p className={admCallout('info')}>A notícia fica como rascunho. Um editor revisa e publica.</p>
                ) : <>
                  <Select
                    name="status"
                    label="Status"
                    value={values.status || 'draft'}
                    options={[
                      { value: 'draft', label: 'Rascunho: só no painel' },
                      { value: 'published', label: 'Publicada: visível no portal' },
                    ]}
                  />
                  <Switch name="featured" label="Destaque na página inicial" description="Entra no bloco de destaques do topo da home." checked={values.featured}/>
                </>}
              </div>
            </>}

            {resource === 'categories' && <>
              <Field name="name" label="Nome" value={edit?.name} minLength={2} maxLength={80} autoFocus={!edit}/>
              <Field name="slug" label="Slug" value={edit?.slug} minLength={2} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Letras minúsculas sem acento, números e hífens entre palavras" hint="Forma o endereço da editoria: /editoria/slug."/>
              <Field name="position" label="Posição no menu" value={edit ? edit.position : nextPosition} type="number" min={0} max={1000} step={1} hint="O menu mostra as editorias da menor para a maior posição."/>
            </>}

            {resource === 'sponsors' && <>
              <Field name="name" label="Nome da empresa" value={edit?.name} maxLength={120} autoFocus={!edit}/>
              <ImageField name="logoUrl" label="Logo (opcional)" value={edit?.logoUrl} hint="De preferência com fundo transparente."/>
              <Field name="websiteUrl" label="Site ou link de contato" value={edit?.websiteUrl} type="url" placeholder="https://"/>
              <Switch name="active" label="Patrocinador ativo" description="Aparece na seção “Quem apoia” do portal." checked={edit ? !!edit.active : true}/>
            </>}

            {resource === 'campaigns' && <>
              <Field name="name" label="Nome da campanha" value={edit?.name} maxLength={120} autoFocus={!edit}/>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Select name="sponsorId" label="Patrocinador" value={edit?.sponsorId || ''} required options={[{ value: '', label: 'Selecione' }, ...sponsors.map((s) => ({ value: s.id, label: s.name }))]}/>
                <Select
                  name="slot"
                  label="Posição"
                  value={edit?.slot || 'leaderboard'}
                  options={[
                    { value: 'leaderboard', label: 'Banner premium' },
                    { value: 'sidebar', label: 'Banner lateral' },
                  ]}
                />
              </div>
              <ImageField name="imageUrl" label="Imagem do banner" value={edit?.imageUrl} required/>
              <Field name="targetUrl" label="URL de destino" value={edit?.targetUrl} type="url" placeholder="https://"/>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <DateTimeField name="startsAt" label="Início (horário de Brasília)" defaultValue={dateInput(edit?.startsAt)}/>
                <DateTimeField name="endsAt" label="Fim (horário de Brasília)" defaultValue={dateInput(edit?.endsAt)}/>
              </div>
              <Switch name="active" label="Campanha ativa" description="Cada posição exibe a campanha ativa mais recente." checked={edit ? !!edit.active : true}/>
            </>}

            {resource === 'users' && <>
              <Field name="name" label="Nome" value={edit?.name} minLength={2} maxLength={100} autoFocus={!edit}/>
              <Field name="email" label="E-mail de acesso" value={edit?.email} type="email" maxLength={200} autoComplete="off"/>
              <fieldset className="group/choices m-0 grid min-w-0 gap-2 border-0 p-0" disabled={self}>
                <legend className={cx(admLabel, 'mb-[7px]')}>Perfil</legend>
                {(Object.keys(roleNames) as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-adm-border bg-adm-input px-3.5 py-3 transition-[border-color,background-color] duration-150 hover:border-adm-border-strong has-checked:border-red has-checked:bg-adm-info-bg has-checked:hover:border-red group-disabled/choices:cursor-not-allowed group-disabled/choices:opacity-60"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      defaultChecked={(edit?.role || 'reporter') === r}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-adm-border-strong bg-adm-input transition-[border-width,border-color] duration-150 checked:border-[5px] checked:border-red disabled:cursor-not-allowed"
                    />
                    <span>
                      <b className="block text-13 text-adm-strong">{roleNames[r]}</b>
                      <small className="mt-[3px] block text-12 leading-[1.45] text-adm-muted">{roleHelp[r]}</small>
                    </span>
                  </label>
                ))}
                {self && <small className={admHint}>Você não pode mudar o próprio perfil nem desativar a própria conta.</small>}
              </fieldset>
              {edit ? <>
                <Switch name="active" label="Acesso ativo" description="Desativar encerra as sessões abertas na hora." checked={!!edit.active} disabled={self}/>
                {edit.pending
                  ? <p className={admCallout('info')}>Convite pendente: a pessoa ainda não criou a senha. Se você corrigir o e-mail, o link antigo deixa de valer e um convite novo vai para o endereço novo.</p>
                  : <p className={admHint}>A senha é trocada pelo botão “Redefinir senha” da lista.</p>}
              </> : (
                <p className={admCallout('info')}>A pessoa recebe um convite por e-mail e cria a própria senha pelo link, que vale 7 dias. Se o e-mail não chegar, use “Reenviar convite” na lista.</p>
              )}
            </>}
          </fieldset>
        </Drawer>
      )}

      {resetting && (
        <PasswordDialog
          key={resetting.id}
          user={resetting}
          self={resetting.id === me.id}
          onClose={() => setResetting(null)}
          onDone={(message) => {
            setResetting(null);
            notify(message);
          }}
        />
      )}

      {confirmDialog}

      {toast && (
        <div
          key={toast.id}
          className="fixed right-6 bottom-6 z-60 flex max-w-[min(440px,calc(100vw-32px))] animate-toast-in items-start gap-2.5 rounded-[10px] border border-adm-border-strong bg-adm-surface py-3 pr-2 pl-3.5 text-adm-strong shadow-adm-toast max-sm:right-4 max-sm:bottom-4"
          role={toast.tone === 'error' ? 'alert' : 'status'}
          data-toast={toast.tone}
        >
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} className={cx('mt-px size-[18px]', toast.tone === 'error' ? 'text-adm-danger' : 'text-adm-ok')}/>
          <p className="flex-1 pt-px text-13 leading-[1.5] [overflow-wrap:anywhere]">{toast.text}</p>
          <button type="button" className={admIconButton({ small: true })} aria-label="Fechar aviso" onClick={() => setToast(null)}><Icon name="close"/></button>
        </div>
      )}
    </div>
  );
}
