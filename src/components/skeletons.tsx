import type { ReactNode } from "react";

const ROW_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-5/6", "w-1/4"];

export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

export function SkeletonToolbar({ filterCount = 0 }: { filterCount?: number }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <SkeletonBar className="h-9 w-full max-w-xs" />
      {Array.from({ length: filterCount }).map((_, i) => (
        <SkeletonBar key={i} className="h-9 w-36" />
      ))}
    </div>
  );
}

export function SkeletonTable({
  columns,
  rows = 8,
  leading,
}: {
  columns: number;
  rows?: number;
  leading?: "avatar" | "checkbox";
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {leading && <th className="px-4 py-3 w-14" />}
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <SkeletonBar className="h-3 w-16" />
              </th>
            ))}
            <th className="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-100 last:border-0">
              {leading && (
                <td className="px-4 py-3">
                  {leading === "avatar" ? (
                    <SkeletonCircle className="h-9 w-9" />
                  ) : (
                    <SkeletonBar className="h-4 w-4 rounded" />
                  )}
                </td>
              )}
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <SkeletonBar className={`h-3.5 ${ROW_WIDTHS[(r + c) % ROW_WIDTHS.length]}`} />
                </td>
              ))}
              <td className="px-4 py-3">
                <SkeletonBar className="h-3.5 w-14 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPagination() {
  return (
    <div className="flex items-center justify-between text-sm">
      <SkeletonBar className="h-3.5 w-32" />
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-8 w-20 rounded-lg" />
        <SkeletonBar className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonField({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <SkeletonBar className="h-3 w-20 mb-2" />
      <SkeletonBar className="h-[38px] w-full rounded-lg" />
    </div>
  );
}

const FIELDSET_ACCENTS = {
  navy: "border-kids-navy/30 bg-kids-navy/5",
  green: "border-kids-green/30 bg-kids-green/5",
  magenta: "border-kids-magenta/30 bg-kids-magenta/5",
} as const;

/** Each row is 1 (full-width field) or 2 (two fields side by side). */
export function SkeletonFieldset({
  rows,
  accent = "navy",
  children,
}: {
  rows: (1 | 2)[];
  accent?: keyof typeof FIELDSET_ACCENTS;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 ${FIELDSET_ACCENTS[accent]} p-6 flex flex-col gap-4`}>
      {rows.map((cols, i) =>
        cols === 2 ? (
          <div key={i} className="grid grid-cols-2 gap-4">
            <SkeletonField />
            <SkeletonField />
          </div>
        ) : (
          <SkeletonField key={i} />
        )
      )}
      {children}
    </div>
  );
}

const DETAIL_ACCENTS = {
  yellow: "border-kids-yellow/40 bg-kids-yellow/5",
  green: "border-kids-green/30 bg-kids-green/5",
  navy: "border-kids-navy/30 bg-kids-navy/5",
  magenta: "border-kids-magenta/30 bg-kids-magenta/5",
} as const;

/** Themed card matching the kid-detail panels on the KC Bucks sub-pages (name + age header, then content). */
export function SkeletonDetailCard({
  accent = "navy",
  children,
}: {
  accent?: keyof typeof DETAIL_ACCENTS;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 ${DETAIL_ACCENTS[accent]} p-6 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <SkeletonBar className="h-5 w-40" />
          <SkeletonBar className="h-3 w-16" />
        </div>
        <SkeletonBar className="h-3.5 w-24" />
      </div>
      {children}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex flex-col gap-1.5">
            <SkeletonBar className="h-3.5 w-32" />
            <SkeletonBar className="h-3 w-20" />
          </div>
          <SkeletonBar className="h-3.5 w-10" />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonIdCard() {
  return <div className="w-[85.6mm] h-[53.98mm] rounded-2xl skeleton-shimmer" />;
}

export function SkeletonToggleRow() {
  return (
    <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-2">
        <SkeletonBar className="h-4 w-40" />
        <SkeletonBar className="h-3 w-64" />
      </div>
      <SkeletonBar className="h-6 w-11 rounded-full shrink-0" />
    </div>
  );
}
