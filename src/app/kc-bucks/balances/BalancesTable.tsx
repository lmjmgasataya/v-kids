import Link from "next/link";
import { capitalizeName } from "@/lib/format";

interface Row {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  balance: number;
}

const COLUMNS: { key: string; label: string; align?: "right" }[] = [
  { key: "lastName", label: "Name" },
  { key: "age", label: "Age" },
  { key: "balance", label: "Balance", align: "right" },
];

export function BalancesTable({
  rows,
  sort,
  dir,
  q,
  service,
  canManage,
}: {
  rows: Row[];
  sort: string;
  dir: "asc" | "desc";
  q: string;
  service: string;
  canManage: boolean;
}) {
  function sortHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (service) params.set("service", service);
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    return `/kc-bucks/balances?${params.toString()}`;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No kids match your search.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold text-gray-600 ${col.align === "right" ? "text-right" : "text-left"}`}
              >
                <Link
                  href={sortHref(col.key)}
                  className={`flex items-center gap-1 hover:text-kids-navy ${col.align === "right" ? "justify-end" : ""}`}
                >
                  {col.label}
                  {sort === col.key && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                </Link>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">
                  {capitalizeName(row.firstName)} {capitalizeName(row.lastName)}
                </div>
                {row.nickname && <div className="text-xs text-gray-400">&quot;{capitalizeName(row.nickname)}&quot;</div>}
              </td>
              <td className="px-4 py-3">{row.age}</td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-kids-green">{row.balance}</span>
                <span className="text-xs text-gray-400"> KC Bucks</span>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {canManage && (
                  <Link
                    href={`/kc-bucks/balance/${row.id}#grants`}
                    className="text-kids-navy font-semibold hover:underline"
                  >
                    Edit
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
