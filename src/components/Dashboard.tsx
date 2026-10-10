'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Category, Me, Media, Sponsor, UserRole } from '@/lib/api';
import { adminFetch, errorMessage, SESSION_EXPIRED_PATH, SessionExpired } from '@/lib/admin-client';
import { Resource, roleNames, tabsByRole } from '@/lib/permissions';

type Row = { id: string; title?: string; name?: string; status?: string; active?: boolean; email?: string; role?: UserRole; interest?: string; message?: string; createdAt?: string; [key: string]: unknown };

const names: Record<Resource, string> = { articles: 'Notícias', categories: 'Editorias', sponsors: 'Patrocinadores', campaigns: 'Campanhas', media: 'Mídia', leads: 'Pedidos comerciais', users: 'Usuários' };

const roleHelp: Record<UserRole, string> = {
  admin: 'Acesso total, incluindo usuários, patrocinadores, campanhas e pedidos comerciais.',
  editor: 'Cria, edita e publica qualquer notícia; gerencia editorias e imagens.',
  reporter: 'Escreve as próprias notícias como rascunho e envia imagens. Um editor publica.',
};

/** Same limit as the API and /api/admin/media. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

/** What the API accepts in image fields: an uploaded image or an absolute http(s) URL. */
const isImageUrl = (v: string) => /^(\/media\/|https?:\/\/)/.test(v);

const dateInput = (v: unknown) => (typeof v === 'string' ? new Date(v).toISOString().slice(0, 16) : '');
const dateLabel = (v: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(v));
const sizeLabel = (bytes: number) => Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR') + ' KB';

/** JSON request to an admin intermediate route; throws with the API message when it fails. */
async function send<T = unknown>(url: string, method: string, data?: unknown, fallback = 'Não foi possível salvar'): Promise<T> {
  const r = await adminFetch(url, { method, headers: data === undefined ? undefined : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(errorMessage(body, fallback));
  return body as T;
}

/** Message to show for a failed action; empty after a 401, when the page is already going to the login. */
const failure = (e: unknown) => (e instanceof SessionExpired ? '' : (e as Error).message);

async function uploadImage(file: File): Promise<Media> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" tem mais de 5 MB. Reduza a imagem e envie de novo.`);
  const form = new FormData();
  form.append('file', file);
  const r = await adminFetch('/api/admin/media', { method: 'POST', body: form });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(errorMessage(body, 'Não foi possível enviar a imagem'));
  return body as Media;
}

type FieldProps = { name: string; label: string; value?: unknown } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'defaultValue'>;

function Field({ label, value, required = true, ...input }: FieldProps) {
  return <label>{label}<input {...input} required={required} defaultValue={typeof value === 'string' || typeof value === 'number' ? value : ''}/></label>;
}

/**
 * Image field filled by hand or by uploading a file. A text input, since type="url" would make the
 * browser reject the relative `/media/...` path.
 */
function ImageField({ name, label, value, required = false }: { name: string; label: string; value?: unknown; required?: boolean }) {
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
    <div className="image-field">
      <label htmlFor={id}>{label}</label>
      <div className="image-field-row">
        <input ref={input} id={id} name={name} type="text" inputMode="url" required={required} value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="/media/... ou https://..."/>
        <button type="button" className="btn light" disabled={uploading} onClick={() => picker.current?.click()}>{uploading ? 'Enviando…' : 'Enviar imagem'}</button>
        <input ref={picker} type="file" accept={IMAGE_TYPES} hidden onChange={upload}/>
      </div>
      {error && <small className="field-error" role="alert">{error}</small>}
      {url && valid && <img className="image-preview" src={url} alt="Pré-visualização da imagem"/>}
    </div>
  );
}

/** Modal where an admin sets a new password for a user; the API then ends that user's sessions. */
function PasswordDialog({ user, self, onClose, onDone }: { user: Row; self: boolean; onClose: () => void; onDone: (message: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

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
    <dialog ref={dialog} className="admin-dialog" onClose={onClose} aria-labelledby="password-dialog-title">
      <form className="editor-form" onSubmit={submit}>
        <h2 id="password-dialog-title">Redefinir senha</h2>
        <p className="subtitle"><b>{user.name || user.email}</b> ({user.email})</p>
        <p className="notice">Todas as sessões abertas deste usuário serão encerradas. Ele precisará entrar de novo com a nova senha.{self ? ' Como é a sua conta, você também sairá do painel.' : ''}</p>
        <label>Nova senha (mínimo 12 caracteres)<input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" autoFocus/></label>
        <label>Repita a nova senha<input name="confirm" type="password" required minLength={12} maxLength={200} autoComplete="new-password"/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Redefinir senha'}</button>
          <button type="button" className="btn light" onClick={() => dialog.current?.close()}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}

export default function Dashboard({ categories, me, initialTab }: { categories: Category[]; me: Me; initialTab: Resource }) {
  const router = useRouter();
  const reporter = me.role === 'reporter';
  const [resource, setResource] = useState<Resource>(initialTab);
  const [formError, setFormError] = useState('');
  const [resetting, setResetting] = useState<Row | null>(null);
  const formBox = useRef<HTMLElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // The campaign form lists the sponsors, which only admins can read.
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
      setStatus(failure(e));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
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
      if (!edit) data.password = d.get('password');
    }
    if (resource === 'categories') data = { name: d.get('name'), slug: d.get('slug'), position: Number(d.get('position')) };
    if (resource === 'sponsors') {
      data = { name: d.get('name'), websiteUrl: d.get('websiteUrl'), active: d.get('active') === 'on' };
      if (d.get('logoUrl')) data.logoUrl = d.get('logoUrl');
    }
    if (resource === 'campaigns') data = { name: d.get('name'), sponsorId: d.get('sponsorId'), slot: d.get('slot'), imageUrl: d.get('imageUrl'), targetUrl: d.get('targetUrl'), startsAt: new Date(String(d.get('startsAt')) + ':00Z').toISOString(), endsAt: new Date(String(d.get('endsAt')) + ':00Z').toISOString(), active: d.get('active') === 'on' };
    try {
      await send('/api/admin/' + resource + (edit ? '/' + edit.id : ''), edit ? 'PATCH' : 'POST', data);
      setEdit(null);
      setNonce((v) => v + 1);
      await load();
      setStatus('Salvo com sucesso.');
      // Reloads the server props too, e.g. the category select after an Editorias change.
      router.refresh();
    } catch (e) {
      setFormError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return;
    setBusy(true);
    try {
      await send('/api/admin/' + resource + '/' + id, 'DELETE', undefined, 'Não foi possível excluir');
      if (edit?.id === id) setEdit(null);
      await load();
      setStatus('Registro excluído.');
      router.refresh();
    } catch (e) {
      setStatus(failure(e));
    } finally {
      setBusy(false);
    }
  }

  /** Users are never deleted: deactivating ends their sessions right away and can be undone. */
  async function toggleActive(user: Row) {
    const action = user.active ? 'Desativar' : 'Reativar';
    if (user.active && !confirm(`Desativar ${user.name || user.email}? As sessões abertas serão encerradas na hora.`)) return;
    setBusy(true);
    setStatus('');
    try {
      await send('/api/admin/users/' + user.id, 'PATCH', { active: !user.active }, `Não foi possível ${action.toLowerCase()} o usuário`);
      if (edit?.id === user.id) setEdit(null);
      await load();
      setStatus(`${user.name || user.email} ${user.active ? 'desativado' : 'reativado'}.`);
    } catch (e) {
      setStatus(failure(e));
    } finally {
      setBusy(false);
    }
  }

  function openTab(r: Resource) {
    setResource(r);
    setEdit(null);
    setStatus('');
    setFormError('');
    // Keeps the tab in the address, so reloading or sharing the link opens it again.
    window.history.replaceState(null, '', r === 'articles' ? '/admin' : '/admin?aba=' + r);
  }

  function startEdit(row: Row | null) {
    setEdit(row);
    setStatus('');
    setFormError('');
    // In the Users tab the form sits below the table.
    if (resource === 'users') requestAnimationFrame(() => formBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function uploadToLibrary(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      const media = await uploadImage(file);
      await load();
      setStatus('Imagem enviada: ' + media.url);
    } catch (err) {
      setStatus(failure(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('URL copiada: ' + url);
    } catch {
      setStatus('Não foi possível copiar. Copie manualmente: ' + url);
    }
  }

  const nextPosition = Math.min(1000, Math.max(0, ...rows.map((r) => Number(r.position) || 0)) + 1);

  function meta(row: Row) {
    const badge = (on: boolean, label: string) => <span className={'badge' + (on ? ' on' : '')}>{label}</span>;
    if (resource === 'articles') return badge(row.status === 'published', row.status === 'published' ? 'Publicado' : 'Rascunho');
    if (resource === 'categories') return '/' + row.slug + ' · posição ' + row.position;
    if (resource === 'leads') return row.email;
    return badge(!!row.active, row.active ? 'Ativo' : 'Inativo');
  }

  /** Reporters see their published articles read-only; the API refuses changes to them. */
  const lockedForReporter = (row: Row | null) => reporter && resource === 'articles' && row?.status === 'published';
  const readOnly = lockedForReporter(edit);
  const canDelete = (row: Row) => !lockedForReporter(row) && !(reporter && resource === 'media');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <>
      <div className="admin-bar">
        <div className="wrap">
          <Link href="/" className="wordmark">Itajubá <span>NEWS</span></Link>
          <span className="admin-bar-label">Redação</span>
          <div className="admin-bar-actions">
            <span className="admin-bar-user">{me.name || me.email} · {roleNames[me.role]}</span>
            <a href="/" target="_blank" rel="noopener">Ver portal ↗</a>
            <button type="button" onClick={logout}>Sair</button>
          </div>
        </div>
      </div>
      <main className="wrap admin">
        <div className="admin-heading">
          <span className="eyebrow">Painel editorial</span>
          <h1>O portal nas suas mãos.</h1>
        </div>
        <div className="admin-tabs">
          {tabsByRole[me.role].map((r) => (
            <button type="button" aria-pressed={r === resource} key={r} onClick={() => openTab(r)}>{names[r]}</button>
          ))}
        </div>
        {status && <div className="notice" role="status">{status}</div>}
        <div className={'admin-grid' + (resource === 'users' ? ' stacked' : '')}>
          <section>
            <div className="section-heading">
              <h2>{names[resource]}</h2>
              {resource === 'users'
                ? <button type="button" className="btn light small" onClick={() => startEdit(null)}>Novo usuário</button>
                : <span className="eyebrow">{rows.length} registro(s)</span>}
            </div>
            <div className="admin-list">
              {loading ? (
                <div className="empty">Carregando…</div>
              ) : rows.length === 0 ? (
                <div className="empty">Nenhum registro cadastrado.</div>
              ) : resource === 'users' ? (
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Status</th><th scope="col">Criado em</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
                    <tbody>
                      {rows.map((u) => {
                        const self = u.id === me.id;
                        return (
                          <tr key={u.id} className={u.active ? '' : 'inactive'}>
                            <td><b>{u.name || '—'}</b>{self && <small> (você)</small>}</td>
                            <td>{u.email}</td>
                            <td>{u.role ? roleNames[u.role] : '—'}</td>
                            <td><span className={'badge' + (u.active ? ' on' : '')}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                            <td>{u.createdAt ? dateLabel(u.createdAt) : '—'}</td>
                            <td>
                              <div className="admin-actions">
                                <button type="button" className="btn light small" disabled={busy} onClick={() => startEdit(u)}>Editar</button>
                                <button type="button" className="btn light small" disabled={busy} onClick={() => setResetting(u)}>Redefinir senha</button>
                                <button type="button" className="btn light small" disabled={busy || self} title={self ? 'Você não pode desativar a própria conta' : undefined} onClick={() => toggleActive(u)}>{u.active ? 'Desativar' : 'Reativar'}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : resource === 'media' ? (
                <div className="media-grid">
                  {(rows as unknown as Media[]).map((m) => (
                    <div className="media-item" key={m.id}>
                      <a href={m.url} target="_blank" rel="noopener" aria-label={'Abrir ' + m.originalName}><img src={m.url} alt="" loading="lazy"/></a>
                      <div className="media-info">
                        <h3 title={m.originalName}>{m.originalName}</h3>
                        <div className="meta">{sizeLabel(m.size)} · {dateLabel(m.createdAt)}</div>
                        <div className="admin-actions">
                          <button type="button" className="btn light small" onClick={() => copy(m.url)}>Copiar URL</button>
                          {!reporter && <button type="button" className="btn light small" disabled={busy} onClick={() => remove(m.id)}>Excluir</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                rows.map((row) => (
                  <div className="admin-item" key={row.id}>
                    <h3>{row.title || row.name}</h3>
                    <div className="meta">{meta(row)}</div>
                    {resource === 'leads' && <p><b>{row.interest}</b><br/>{row.message}</p>}
                    <div className="admin-actions">
                      {resource !== 'leads' && <button className="btn light small" disabled={busy} onClick={() => startEdit(row)}>{lockedForReporter(row) ? 'Ver' : 'Editar'}</button>}
                      {canDelete(row) && <button className="btn light small" disabled={busy} onClick={() => remove(row.id)}>Excluir</button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          {resource === 'media' && (
            <section className="admin-form-box">
              <h2>Enviar imagem</h2>
              <div className="editor-form">
                <label>Arquivo (JPG, PNG, WebP ou GIF, até 5 MB)<input type="file" accept={IMAGE_TYPES} disabled={busy} onChange={uploadToLibrary}/></label>
                <p className="subtitle">Depois do envio, use “Copiar URL” e cole o endereço no campo de imagem da notícia, do patrocinador ou da campanha. Os formulários também têm o botão “Enviar imagem”. Imagens em uso não podem ser excluídas.</p>
              </div>
            </section>
          )}
          {resource !== 'leads' && resource !== 'media' && (
            <section className="admin-form-box" ref={formBox}>
              <h2>{resource === 'users' ? (edit ? 'Editar usuário' : 'Novo usuário') : readOnly ? 'Matéria publicada' : (edit ? 'Editar' : 'Novo registro') + ' · ' + names[resource]}</h2>
              {readOnly && <p className="notice">Somente leitura: a matéria já foi publicada. Para alterá-la, fale com um editor.</p>}
              <form className="editor-form" key={resource + '-' + (edit?.id || 'new') + '-' + nonce} onSubmit={save}>
                <fieldset className="form-fieldset" disabled={readOnly}>
                {resource === 'articles' && <>
                  <Field name="title" label="Título" value={edit?.title} maxLength={200}/>
                  <Field name="slug" label="Slug (ex.: nova-noticia)" value={edit?.slug} maxLength={220}/>
                  <label>Editoria<select name="categoryId" defaultValue={String(edit?.categoryId || categories[0]?.id || '')} required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                  <label>Resumo<textarea name="excerpt" rows={3} required minLength={10} maxLength={500} defaultValue={String(edit?.excerpt || '')}/></label>
                  <label>Texto da matéria (texto simples)<textarea name="content" rows={10} required minLength={20} maxLength={100000} defaultValue={String(edit?.content || '')}/></label>
                  <ImageField name="imageUrl" label="Imagem (opcional)" value={edit?.imageUrl}/>
                  <Field name="author" label="Autoria" value={edit?.author || 'Redação Itajubá News'} maxLength={100}/>
                  {reporter ? (
                    !readOnly && <p className="subtitle">A notícia fica como rascunho. Um editor revisa e publica.</p>
                  ) : <>
                    <label>Publicação<select name="status" defaultValue={String(edit?.status || 'draft')}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
                    <label className="consent"><input type="checkbox" name="featured" defaultChecked={!!edit?.featured}/>Destaque na página inicial</label>
                  </>}
                </>}
                {resource === 'users' && <>
                  <Field name="name" label="Nome" value={edit?.name} minLength={2} maxLength={100}/>
                  <Field name="email" label="E-mail de acesso" value={edit?.email} type="email" maxLength={200} autoComplete="off"/>
                  <label>Perfil<select name="role" defaultValue={edit?.role || 'reporter'} disabled={edit?.id === me.id}>{(Object.keys(roleNames) as UserRole[]).map((r) => <option key={r} value={r}>{roleNames[r]}</option>)}</select></label>
                  <ul className="subtitle role-help">{(Object.keys(roleHelp) as UserRole[]).map((r) => <li key={r}><b>{roleNames[r]}:</b> {roleHelp[r]}</li>)}</ul>
                  {!edit && <>
                    <Field name="password" label="Senha inicial" type="password" minLength={12} maxLength={200} autoComplete="new-password" aria-describedby="password-hint"/>
                    <small id="password-hint" className="field-hint">Mínimo de 12 caracteres. Repasse a senha ao usuário por um canal seguro.</small>
                  </>}
                  {edit && <label className="consent"><input type="checkbox" name="active" defaultChecked={!!edit.active} disabled={edit.id === me.id}/>Acesso ativo (desativar encerra as sessões na hora)</label>}
                  {edit?.id === me.id && <p className="subtitle">Você não pode mudar o próprio perfil nem desativar a própria conta.</p>}
                  {edit && <p className="subtitle">A senha é trocada pelo botão “Redefinir senha” na lista.</p>}
                </>}
                {resource === 'categories' && <>
                  <Field name="name" label="Nome" value={edit?.name} minLength={2} maxLength={80}/>
                  <Field name="slug" label="Slug (ex.: meio-ambiente)" value={edit?.slug} minLength={2} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Letras minúsculas sem acento, números e hífens entre palavras"/>
                  {/* Keyed so the suggestion follows the list once it loads (defaultValue is read on mount only). */}
                <Field key={edit ? 'position-' + edit.id : 'position-' + nextPosition} name="position" label="Posição no menu" value={edit ? edit.position : nextPosition} type="number" min={0} max={1000} step={1}/>
                  <p className="subtitle">O menu do portal mostra as editorias da menor para a maior posição. O slug forma o endereço da editoria (/?editoria=slug).</p>
                </>}
                {resource === 'sponsors' && <>
                  <Field name="name" label="Nome da empresa" value={edit?.name} maxLength={120}/>
                  <ImageField name="logoUrl" label="Logo (opcional)" value={edit?.logoUrl}/>
                  <Field name="websiteUrl" label="Site ou link de contato" value={edit?.websiteUrl} type="url"/>
                  <label className="consent"><input type="checkbox" name="active" defaultChecked={edit ? !!edit.active : true}/>Patrocinador ativo</label>
                </>}
                {resource === 'campaigns' && <>
                  <Field name="name" label="Nome da campanha" value={edit?.name} maxLength={120}/>
                  <label>Patrocinador<select name="sponsorId" defaultValue={String(edit?.sponsorId || '')} required><option value="">Selecione</option>{sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                  <label>Posição<select name="slot" defaultValue={String(edit?.slot || 'leaderboard')}><option value="leaderboard">Banner premium</option><option value="sidebar">Banner lateral</option></select></label>
                  <ImageField name="imageUrl" label="Imagem do banner" value={edit?.imageUrl} required/>
                  <Field name="targetUrl" label="URL de destino" value={edit?.targetUrl} type="url"/>
                  <Field name="startsAt" label="Início (horário UTC)" value={dateInput(edit?.startsAt)} type="datetime-local"/>
                  <Field name="endsAt" label="Fim (horário UTC)" value={dateInput(edit?.endsAt)} type="datetime-local"/>
                  <label className="consent"><input type="checkbox" name="active" defaultChecked={edit ? !!edit.active : true}/>Campanha ativa</label>
                  <p className="subtitle">As datas são exibidas em UTC. O banner público exibe a campanha ativa mais recente nesta posição.</p>
                </>}
                </fieldset>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="form-actions">
                  {!readOnly && <button className="btn" disabled={busy || loading}>{busy ? 'Salvando…' : edit ? 'Salvar alterações' : 'Cadastrar'}</button>}
                  {edit && <button type="button" className="btn light" onClick={() => startEdit(null)}>{readOnly ? 'Fechar' : 'Cancelar'}</button>}
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
      {resetting && (
        <PasswordDialog
          key={resetting.id}
          user={resetting}
          self={resetting.id === me.id}
          onClose={() => setResetting(null)}
          onDone={(message) => {
            setResetting(null);
            setStatus(message);
          }}
        />
      )}
    </>
  );
}
