import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  totalCount,
  q,
  sort,
  dir,
  service,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  q: string;
  sort: string;
  dir: "asc" | "desc";
  service: string;
}) {
  if (totalCount === 0) return null;

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (service) params.set("service", service);
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("page", String(target));
    return `/kc-bucks/balances?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>
        {totalCount} kid{totalCount === 1 ? "" : "s"} · Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-kids-navy hover:border-kids-navy/40"
          >
            ← Prev
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">← Prev</span>
        )}
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-kids-navy hover:border-kids-navy/40"
          >
            Next →
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">Next →</span>
        )}
      </div>
    </div>
  );
}
