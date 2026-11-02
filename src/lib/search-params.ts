/** `searchParams` of a page. A repeated parameter (`?a=1&a=2`) arrives as an array. */
export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First value of a query parameter, or ''. */
export const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

/** `?pagina=` as a page number from 1 to 1000 (the API limit). */
export const pageParam = (value: string | string[] | undefined) =>
  Math.min(1000, Math.max(1, Math.floor(Number(param(value))) || 1));
