'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category, Me, Media, Sponsor, UserRole } from '@/lib/api';
import { adminFetch, type AdminTheme, errorMessage, failure, IMAGE_TYPES, SESSION_EXPIRED_PATH, THEME_COOKIE, uploadImage } from '@/lib/admin-client';
import { Resource, roleNames, tabsByRole } from '@/lib/permissions';
import Icon, { type IconName } from './admin/Icon';
import { Drawer, Dropdown, Field, ImageField, Select, slugify, Switch, TextArea } from './admin/ui';

type Row = { id: string; title?: string; name?: string; status?: string; active?: boolean; email?: string; role?: UserRole; interest?: string; message?: string; createdAt?: string; pending?: boolean; inviteExpiresAt?: string | null; inviteSent?: boolean; [key: string]: unknown };

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

const dateInput = (v: unknown) => (typeof v === 'string' ? new Date(v).toISOString().slice(0, 16) : '');
const dateLabel = (v: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(v));
/** Campaign dates are entered in UTC (see the form), so the list shows them in UTC too. */
const dayLabel = (v: unknown) => (typeof v === 'string' ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(new Date(v)) : '—');
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
const Pill = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => <span className={'adm-pill ' + tone}>{children}</span>;

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
  return <button type="button" className={'adm-icon-btn' + (danger ? ' danger' : '')} aria-label={label} title={label} {...button}><Icon name={icon}/></button>;
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
      <p className="adm-callout">Todas as sessões abertas deste usuário serão encerradas. Ele precisará entrar de novo com a nova senha.{self ? ' Como é a sua conta, você também sairá do painel.' : ''}</p>
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
  /** Open form: the row being edited, or null for a new record. */
  const [form, setForm] = useState<{ row: Row | null } | null>(null);
  const [formError, setFormError] = useState('');
  const [resetting, setResetting] = useState<Row | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error'; id: number } | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
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

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    if (resource === 'campaigns') data = { name: d.get('name'), sponsorId: d.get('sponsorId'), slot: d.get('slot'), imageUrl: d.get('imageUrl'), targetUrl: d.get('targetUrl'), startsAt: new Date(String(d.get('startsAt')) + ':00Z').toISOString(), endsAt: new Date(String(d.get('endsAt')) + ':00Z').toISOString(), active: d.get('active') === 'on' };
    try {
      const saved = await send<Row>('/api/admin/' + resource + (edit ? '/' + edit.id : ''), edit ? 'PATCH' : 'POST', data);
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
    if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return;
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
    if (user.active && !confirm(`Desativar ${user.name || user.email}? As sessões abertas serão encerradas na hora.`)) return;
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

  function openForm(row: Row | null) {
    setFormError('');
    setForm({ row });
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
    if (target === slug) slug.dataset.edited = '1';
    // An existing slug is the public address: it only changes when typed on purpose.
    else if (!edit && (target.name === 'title' || target.name === 'name') && !slug.dataset.edited) slug.value = slugify(target.value);
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

  async function logout() {
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

  type Column = { label: string; cell: (row: Row) => React.ReactNode; className?: string };
  const columns: Partial<Record<Resource, Column[]>> = {
    articles: [
      { label: 'Notícia', className: 'wide', cell: (r) => (
        <div className="adm-cell-media">
          {r.imageUrl ? <img className="adm-thumb" src={String(r.imageUrl)} alt="" loading="lazy"/> : <span className="adm-thumb empty"><Icon name="articles"/></span>}
          <div><b className="adm-cell-title">{r.title}</b><small className="adm-cell-sub">/noticias/{String(r.slug)}</small></div>
        </div>
      ) },
      { label: 'Editoria', cell: (r) => categoryName.get(String(r.categoryId)) ?? '—' },
      { label: 'Autoria', cell: (r) => String(r.author || '—') },
      { label: 'Status', cell: (r) => (
        <div className="adm-pills">
          {r.status === 'published' ? <Pill tone="ok">Publicada</Pill> : <Pill tone="warn">Rascunho</Pill>}
          {!!r.featured && <Pill tone="info">Destaque</Pill>}
        </div>
      ) },
      { label: 'Data', cell: (r) => (
        <>
          {typeof r.publishedAt === 'string' ? dateLabel(r.publishedAt) : r.createdAt ? dateLabel(r.createdAt) : '—'}
          <small className="adm-cell-sub">{typeof r.publishedAt === 'string' ? 'publicada' : 'criada'}</small>
        </>
      ) },
    ],
    categories: [
      { label: 'Posição', className: 'narrow', cell: (r) => <span className="adm-position">{String(r.position)}</span> },
      { label: 'Editoria', className: 'wide', cell: (r) => <><b className="adm-cell-title">{r.name}</b><small className="adm-cell-sub">/editoria/{String(r.slug)}</small></> },
    ],
    sponsors: [
      { label: 'Patrocinador', className: 'wide', cell: (r) => (
        <div className="adm-cell-media">
          {r.logoUrl ? <img className="adm-thumb logo" src={String(r.logoUrl)} alt="" loading="lazy"/> : <span className="adm-thumb logo empty"><Icon name="sponsors"/></span>}
          <b className="adm-cell-title">{r.name}</b>
        </div>
      ) },
      { label: 'Site', cell: (r) => (r.websiteUrl ? <a className="adm-link" href={String(r.websiteUrl)} target="_blank" rel="noopener noreferrer">{hostname(r.websiteUrl)}<Icon name="external"/></a> : '—') },
      { label: 'Status', cell: (r) => (r.active ? <Pill tone="ok">Ativo</Pill> : <Pill tone="off">Inativo</Pill>) },
    ],
    campaigns: [
      { label: 'Campanha', className: 'wide', cell: (r) => (
        <div className="adm-cell-media">
          {r.imageUrl ? <img className="adm-thumb banner" src={String(r.imageUrl)} alt="" loading="lazy"/> : <span className="adm-thumb banner empty"><Icon name="campaigns"/></span>}
          <div><b className="adm-cell-title">{r.name}</b><small className="adm-cell-sub">{sponsorName(r)}</small></div>
        </div>
      ) },
      { label: 'Posição', cell: (r) => slots[String(r.slot)] ?? String(r.slot) },
      { label: 'Vigência (UTC)', cell: (r) => <>{dayLabel(r.startsAt)} <span className="adm-faint">→</span> {dayLabel(r.endsAt)}</> },
      { label: 'Status', cell: (r) => { const [label, tone] = campaignState(r); return <Pill tone={tone}>{label}</Pill>; } },
    ],
    leads: [
      { label: 'Contato', cell: (r) => <><b className="adm-cell-title">{r.name}</b><small className="adm-cell-sub">{r.email}</small></> },
      { label: 'Interesse', cell: (r) => <Pill tone="info">{r.interest}</Pill> },
      { label: 'Mensagem', className: 'wide', cell: (r) => <p className="adm-cell-text">{r.message}</p> },
      { label: 'Recebido em', cell: (r) => (r.createdAt ? dateLabel(r.createdAt) : '—') },
    ],
    users: [
      { label: 'Usuário', className: 'wide', cell: (u) => (
        <div className="adm-cell-media">
          <span className="adm-avatar small" aria-hidden="true">{initials(u.name || u.email || '?')}</span>
          <div>
            <b className="adm-cell-title">{u.name || '—'}{u.id === me.id && <span className="adm-you">você</span>}</b>
            <small className="adm-cell-sub">{u.email}</small>
          </div>
        </div>
      ) },
      { label: 'Perfil', cell: (u) => (u.role ? roleNames[u.role] : '—') },
      { label: 'Status', cell: (u) => {
        if (!u.active) return <Pill tone="off">Inativo</Pill>;
        if (!u.pending) return <Pill tone="ok">Ativo</Pill>;
        if (!u.inviteExpiresAt || Date.parse(u.inviteExpiresAt) < Date.now()) return <Pill tone="off">Convite expirado</Pill>;
        return <><Pill tone="warn">Convite pendente</Pill><small className="adm-cell-sub">vale até {dateLabel(u.inviteExpiresAt)}</small></>;
      } },
      { label: 'Criado em', cell: (u) => (u.createdAt ? dateLabel(u.createdAt) : '—') },
    ],
  };

  const rowActions = (row: Row) => {
    if (resource === 'leads')
      return (
        <>
          <a className="adm-icon-btn" href={'mailto:' + row.email} aria-label={'Responder ' + row.email} title="Responder por e-mail"><Icon name="mail"/></a>
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
  const skeleton = (
    <div className="adm-skeleton" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2, 3, 4].map((i) => <div key={i}><span/><span/><span/></div>)}
    </div>
  );

  let body: React.ReactNode;
  if (loading) body = skeleton;
  else if (rows.length === 0)
    body = (
      <div className="adm-empty">
        <span><Icon name={tab.icon}/></span>
        <b>Nada por aqui ainda</b>
        <p>{resource === 'media' ? 'Arraste imagens para cá ou use “Enviar imagens”.' : resource === 'leads' ? 'Os pedidos do formulário “Anuncie” aparecerão aqui.' : `Nenhum registro em ${tab.title.toLowerCase()}.`}</p>
        {tab.create && <button type="button" className="adm-btn primary" onClick={() => openForm(null)}><Icon name="plus"/>{tab.create}</button>}
      </div>
    );
  else if (visible.length === 0)
    body = (
      <div className="adm-empty">
        <span><Icon name="search"/></span>
        <b>Nenhum resultado</b>
        <p>Nada encontrado com esses filtros.</p>
        <button type="button" className="adm-btn" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Limpar filtros</button>
      </div>
    );
  else if (resource === 'media')
    body = (
      <div className="adm-media-grid">
        {(visible as unknown as Media[]).map((m) => (
          <figure className="adm-media" key={m.id}>
            <a href={m.url} target="_blank" rel="noopener" aria-label={'Abrir ' + m.originalName}><img src={m.url} alt="" loading="lazy"/></a>
            <figcaption>
              <b title={m.originalName}>{m.originalName}</b>
              <small>{sizeLabel(m.size)} · {dateLabel(m.createdAt)}</small>
              <div className="adm-row-actions">
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
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              {cols.map((c) => <th key={c.label} scope="col" className={c.className}>{c.label}</th>)}
              <th scope="col" className="actions"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className={resource === 'users' && !row.active ? 'muted' : undefined}>
                {cols.map((c) => <td key={c.label} className={c.className}>{c.cell(row)}</td>)}
                <td className="actions"><div className="adm-row-actions">{rowActions(row)}</div></td>
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

  return (
    <div className={'adm' + (collapsed ? ' collapsed' : '') + (menuOpen ? ' menu-open' : '')} data-theme={theme}>
      <aside className="adm-sidebar" id="adm-sidebar">
        <div className="adm-brand">
          {/* White lettering on dark themes, the original logo on light ones; CSS shows one of them. */}
          <Link href="/" aria-label="Itajubá News: abrir o portal">
            <img className="adm-logo-dark" src="/logo-dark.png" alt="" width={400} height={220}/>
            <img className="adm-logo-light" src="/logo.png" alt="" width={225} height={225}/>
          </Link>
          <span>Redação</span>
        </div>
        <nav className="adm-nav" aria-label="Seções do painel">
          {groups.map((g) => {
            const items = g.items.filter((r) => allowed.includes(r));
            if (!items.length) return null;
            return (
              <div className="adm-nav-group" key={g.title}>
                <p className="adm-nav-title">{g.title}</p>
                <ul>
                  {items.map((r) => (
                    <li key={r}>
                      <a
                        href={tabHref(r)}
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
                        <span>{tabs[r].title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="adm-sidebar-foot">
          <a href="/" target="_blank" rel="noopener" title={collapsed ? 'Ver portal' : undefined}><Icon name="external"/><span>Ver portal</span></a>
        </div>
      </aside>
      {menuOpen && <div className="adm-scrim" aria-hidden="true" onClick={() => setMenuOpen(false)}/>}

      <div className="adm-main">
        <header className="adm-topbar">
          <IconButton icon="sidebar" label="Mostrar ou ocultar o menu" aria-controls="adm-sidebar" onClick={toggleNav}/>
          <p className="adm-crumb">Redação <span aria-hidden="true">/</span> <b>{tab.title}</b></p>
          <div className="adm-topbar-actions">
            <Dropdown label={'Tema: ' + themes.find((t) => t.value === theme)?.label} className="adm-icon-btn" panelClassName="adm-theme-menu" trigger={<Icon name={themes.find((t) => t.value === theme)?.icon ?? 'moon'}/>}>
              {(close) => <>
                <p className="adm-menu-title">Tema</p>
                {themes.map((t) => (
                  <button type="button" key={t.value} className="adm-menu-item" aria-pressed={theme === t.value} onClick={() => { chooseTheme(t.value); close(); }}>
                    <span className="adm-menu-dot" aria-hidden="true"/>
                    <Icon name={t.icon}/>
                    {t.label}
                  </button>
                ))}
              </>}
            </Dropdown>
            <Dropdown
              label={'Conta de ' + (me.name || me.email)}
              className="adm-user-btn"
              panelClassName="adm-account"
              trigger={<>
                <span className="adm-avatar" aria-hidden="true">{initials(me.name || me.email)}</span>
                <span className="adm-user-text">
                  <b>{me.name || me.email}</b>
                  <small>{me.name ? me.email : roleNames[me.role]}</small>
                </span>
              </>}
            >
              {() => <>
                <div className="adm-profile">
                  <span className="adm-avatar large" aria-hidden="true">{initials(me.name || me.email)}</span>
                  <div>
                    <b>{me.name || 'Sem nome'}</b>
                    <small>{me.email}</small>
                  </div>
                </div>
                <dl className="adm-facts">
                  <div><dt><Icon name="idCard"/>ID do usuário</dt><dd title={me.id}>#{me.id.slice(0, 8)}</dd></div>
                  <div><dt><Icon name="shield"/>Perfil</dt><dd>{roleNames[me.role].replace(/ \(.*\)$/, '')} <span className="adm-fact-tag">{accessTags[me.role]}</span></dd></div>
                  <div><dt><Icon name="globe"/>Portal</dt><dd>Itajubá News</dd></div>
                  <div><dt><Icon name="grid"/>Áreas liberadas</dt><dd>{allowed.length === Object.keys(tabs).length ? 'todas' : `${allowed.length} de ${Object.keys(tabs).length}`}</dd></div>
                </dl>
                <div className="adm-menu-sep"/>
                <a className="adm-menu-item" href="/" target="_blank" rel="noopener"><Icon name="external"/>Ver portal</a>
                <button type="button" className="adm-menu-item danger" onClick={logout}><Icon name="logout"/>Sair</button>
              </>}
            </Dropdown>
          </div>
        </header>

        <main className="adm-content">
          <div className="adm-page-head">
            <div>
              <h1>{tab.title}</h1>
              <p>{reporter && resource === 'articles' ? 'Suas matérias. Escreva como rascunho; um editor revisa e publica.' : tab.description}</p>
            </div>
            {tab.create && <button type="button" className="adm-btn primary" onClick={() => openForm(null)}><Icon name="plus"/>{tab.create}</button>}
            {resource === 'media' && (
              <>
                <button type="button" className="adm-btn primary" disabled={busy} onClick={() => picker.current?.click()}><Icon name="upload"/>{busy ? 'Enviando…' : 'Enviar imagens'}</button>
                <input ref={picker} type="file" accept={IMAGE_TYPES} multiple hidden onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); e.target.value = ''; }}/>
              </>
            )}
          </div>

          {cards && (
            <div className="adm-stats">
              {cards.map((s) => (
                <div className="adm-stat" key={s.label}>
                  <span className="adm-stat-label"><Icon name={s.icon}/>{s.label}</span>
                  <b className="adm-stat-value">{loading ? '–' : s.value}</b>
                  {s.hint && <small className="adm-stat-hint">{s.hint}</small>}
                </div>
              ))}
            </div>
          )}

          <section className={'adm-card' + (dragging ? ' dragging' : '')} aria-label={tab.title} {...dropProps}>
            <div className="adm-toolbar">
              <label className="adm-search">
                <Icon name="search"/>
                <span className="sr-only">Buscar</span>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={'Buscar em ' + tab.title.toLowerCase()}/>
              </label>
              {resource === 'articles' && (
                <div className="adm-segmented" role="group" aria-label="Filtrar por status">
                  {([['all', 'Todas'], ['published', 'Publicadas'], ['draft', 'Rascunhos']] as const).map(([value, label]) => (
                    <button type="button" key={value} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>{label}</button>
                  ))}
                </div>
              )}
              <span className="adm-count">{loading ? 'Carregando…' : visible.length === rows.length ? `${rows.length} registro(s)` : `${visible.length} de ${rows.length}`}</span>
            </div>
            {body}
            {dragging && <div className="adm-dropzone" aria-hidden="true"><Icon name="upload"/>Solte para enviar</div>}
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
          onInput={syncSlug}
          onClose={() => setForm(null)}
        >
          {readOnly && <p className="adm-callout info">Somente leitura: a matéria já foi publicada. Para alterá-la, fale com um editor.</p>}
          <fieldset className="adm-fieldset" disabled={readOnly}>
            {resource === 'articles' && <>
              <div className="adm-form-section">
                <h3>Conteúdo</h3>
                <Field name="title" label="Título" value={edit?.title} maxLength={200} autoFocus={!edit}/>
                <Field name="slug" label="Slug" value={edit?.slug} maxLength={220} hint={edit ? 'Endereço público da matéria. Mudar quebra links já compartilhados.' : 'Preenchido a partir do título. Forma o endereço /noticias/slug.'}/>
                <TextArea name="excerpt" label="Resumo" value={edit?.excerpt} rows={3} minLength={10} maxLength={500} hint="Aparece na home e quando a matéria é compartilhada."/>
                <TextArea name="content" label="Texto da matéria" value={edit?.content} rows={12} minLength={20} maxLength={100000} hint="Texto simples. Cada linha vira um parágrafo."/>
              </div>
              <div className="adm-form-section">
                <h3>Imagem</h3>
                <ImageField name="imageUrl" label="Imagem de capa (opcional)" value={edit?.imageUrl}/>
              </div>
              <div className="adm-form-section">
                <h3>Publicação</h3>
                <div className="adm-grid-2">
                  <Select name="categoryId" label="Editoria" value={edit?.categoryId || categories[0]?.id || ''} required>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Field name="author" label="Autoria" value={edit?.author || 'Redação Itajubá News'} maxLength={100}/>
                </div>
                {reporter ? (
                  !readOnly && <p className="adm-callout info">A notícia fica como rascunho. Um editor revisa e publica.</p>
                ) : <>
                  <Select name="status" label="Status" value={edit?.status || 'draft'}>
                    <option value="draft">Rascunho: só no painel</option>
                    <option value="published">Publicada: visível no portal</option>
                  </Select>
                  <Switch name="featured" label="Destaque na página inicial" description="Entra no bloco de destaques do topo da home." checked={!!edit?.featured}/>
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
              <div className="adm-grid-2">
                <Select name="sponsorId" label="Patrocinador" value={edit?.sponsorId || ''} required>
                  <option value="">Selecione</option>
                  {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Select name="slot" label="Posição" value={edit?.slot || 'leaderboard'}>
                  <option value="leaderboard">Banner premium</option>
                  <option value="sidebar">Banner lateral</option>
                </Select>
              </div>
              <ImageField name="imageUrl" label="Imagem do banner" value={edit?.imageUrl} required/>
              <Field name="targetUrl" label="URL de destino" value={edit?.targetUrl} type="url" placeholder="https://"/>
              <div className="adm-grid-2">
                <Field name="startsAt" label="Início (UTC)" value={dateInput(edit?.startsAt)} type="datetime-local"/>
                <Field name="endsAt" label="Fim (UTC)" value={dateInput(edit?.endsAt)} type="datetime-local"/>
              </div>
              <Switch name="active" label="Campanha ativa" description="Cada posição exibe a campanha ativa mais recente." checked={edit ? !!edit.active : true}/>
            </>}

            {resource === 'users' && <>
              <Field name="name" label="Nome" value={edit?.name} minLength={2} maxLength={100} autoFocus={!edit}/>
              <Field name="email" label="E-mail de acesso" value={edit?.email} type="email" maxLength={200} autoComplete="off"/>
              <fieldset className="adm-field adm-choices" disabled={self}>
                <legend>Perfil</legend>
                {(Object.keys(roleNames) as UserRole[]).map((r) => (
                  <label className="adm-choice" key={r}>
                    <input type="radio" name="role" value={r} defaultChecked={(edit?.role || 'reporter') === r}/>
                    <span><b>{roleNames[r]}</b><small>{roleHelp[r]}</small></span>
                  </label>
                ))}
                {self && <small className="adm-hint">Você não pode mudar o próprio perfil nem desativar a própria conta.</small>}
              </fieldset>
              {edit ? <>
                <Switch name="active" label="Acesso ativo" description="Desativar encerra as sessões abertas na hora." checked={!!edit.active} disabled={self}/>
                {edit.pending
                  ? <p className="adm-callout info">Convite pendente: a pessoa ainda não criou a senha. Se você corrigir o e-mail, o link antigo deixa de valer e um convite novo vai para o endereço novo.</p>
                  : <p className="adm-hint">A senha é trocada pelo botão “Redefinir senha” da lista.</p>}
              </> : (
                <p className="adm-callout info">A pessoa recebe um convite por e-mail e cria a própria senha pelo link, que vale 7 dias. Se o e-mail não chegar, use “Reenviar convite” na lista.</p>
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

      {toast && (
        <div key={toast.id} className={'adm-toast ' + toast.tone} role={toast.tone === 'error' ? 'alert' : 'status'}>
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'}/>
          <p>{toast.text}</p>
          <button type="button" className="adm-icon-btn" aria-label="Fechar aviso" onClick={() => setToast(null)}><Icon name="close"/></button>
        </div>
      )}
    </div>
  );
}
