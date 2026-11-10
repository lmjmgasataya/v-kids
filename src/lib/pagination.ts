/**
 * Runs a list page's count and row queries at the same time, instead of counting first to
 * clamp the page number. Only when the requested page turns out to be past the end (a stale
 * link after deletes) does it fetch again, for the last page.
 */
export async function fetchPage<T>({
  requestedPage,
  pageSize,
  count,
  rows,
}: {
  requestedPage: number;
  pageSize: number;
  count: () => Promise<number>;
  rows: (page: number) => Promise<T[]>;
}): Promise<{ count: number; totalPages: number; page: number; rows: T[] }> {
  const requested = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [total, pageRows] = await Promise.all([count(), rows(requested)]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (requested <= totalPages) return { count: total, totalPages, page: requested, rows: pageRows };
  return { count: total, totalPages, page: totalPages, rows: await rows(totalPages) };
}
