/**
 * Unsaved article text kept in this browser's localStorage, so an expired session (the 401 on
 * "Salvar" sends the panel to the login), a reload, a closed tab or Esc does not lose what was
 * typed. One draft per user and article: `itajuba-news:rascunho:<user id>:<article id | "nova">`.
 * Nothing here is sent anywhere. Without localStorage (private window, full quota, blocked site
 * data) every function quietly does nothing and the panel works as before, without drafts.
 */

export type DraftFields = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  categoryId: string;
  author: string;
  status: string;
  featured: boolean;
};

export type ArticleDraft = {
  fields: DraftFields;
  /** `updatedAt` of the article when the edit started; null for a new article. */
  baseUpdatedAt: string | null;
  /** When the draft was written (ISO). */
  savedAt: string;
};

/** A stored draft with the article it belongs to (null: a new article). */
export type StoredDraft = ArticleDraft & { articleId: string | null };

const PREFIX = 'itajuba-news:rascunho:';
const NEW = 'nova';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const TEXT_FIELDS = ['title', 'slug', 'excerpt', 'content', 'imageUrl', 'categoryId', 'author', 'status'] as const;

const keyFor = (userId: string, articleId: string | null) => `${PREFIX}${userId}:${articleId ?? NEW}`;

/** Textareas may hand back CRLF or LF for the same text; drafts compare and store LF. */
const lines = (v: unknown) => String(v ?? '').replace(/\r\n?/g, '\n');

/** The article fields of the form, as the panel sends them (FormData). */
export function readFields(form: HTMLFormElement): DraftFields {
  const d = new FormData(form);
  const fields = Object.fromEntries(TEXT_FIELDS.map((name) => [name, lines(d.get(name))])) as Omit<DraftFields, 'featured'>;
  return { ...fields, featured: d.get('featured') === 'on' };
}

export const sameFields = (a: DraftFields, b: DraftFields) =>
  TEXT_FIELDS.every((name) => lines(a[name]) === lines(b[name])) && a.featured === b.featured;

function parse(raw: string | null): ArticleDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as ArticleDraft;
    if (!draft?.fields || typeof draft.savedAt !== 'string') return null;
    return draft;
  } catch {
    return null;
  }
}

const expired = (draft: ArticleDraft) => !(Date.now() - Date.parse(draft.savedAt) < MAX_AGE_MS);

export function saveDraft(userId: string, articleId: string | null, fields: DraftFields, baseUpdatedAt: string | null) {
  try {
    const draft: ArticleDraft = { fields, baseUpdatedAt, savedAt: new Date().toISOString() };
    localStorage.setItem(keyFor(userId, articleId), JSON.stringify(draft));
  } catch {
    // No localStorage or no room left: the panel keeps working without a draft.
  }
}

export function readDraft(userId: string, articleId: string | null): ArticleDraft | null {
  try {
    const draft = parse(localStorage.getItem(keyFor(userId, articleId)));
    return draft && !expired(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function deleteDraft(userId: string, articleId: string | null) {
  try {
    localStorage.removeItem(keyFor(userId, articleId));
  } catch {
    // Nothing to clean up without localStorage.
  }
}

/** The user's drafts, newest first. Drafts older than 7 days and unreadable ones are deleted here. */
export function listDrafts(userId: string): StoredDraft[] {
  const prefix = `${PREFIX}${userId}:`;
  const drafts: StoredDraft[] = [];
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => !!k?.startsWith(prefix));
    for (const key of keys) {
      const draft = parse(localStorage.getItem(key));
      if (!draft || expired(draft)) {
        localStorage.removeItem(key);
        continue;
      }
      const id = key.slice(prefix.length);
      drafts.push({ ...draft, articleId: id === NEW ? null : id });
    }
  } catch {
    return [];
  }
  return drafts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function deleteAllDrafts(userId: string) {
  for (const draft of listDrafts(userId)) deleteDraft(userId, draft.articleId);
}

/** "12/10 às 14:32", in Brasília time. */
export function draftTimeLabel(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month} às ${parts.hour}:${parts.minute}`;
}
