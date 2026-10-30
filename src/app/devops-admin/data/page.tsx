import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { DEVOPS_TABLES, DEVOPS_TABLE_GROUPS } from "@/lib/devopsTables";

// One round trip for every table's row count (UNION ALL) instead of a query per table.
async function getCounts(): Promise<Record<string, number>> {
  const result = await db.execute<{ key: string; c: number }>(
    sql.join(
      DEVOPS_TABLES.map((t) => sql`SELECT ${t.key} AS key, count(*)::int AS c FROM ${t.table}`),
      sql` UNION ALL `
    )
  );
  return Object.fromEntries(result.rows.map((r) => [r.key, r.c]));
}

export default async function DevopsDataPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const counts = await getCounts();

  return (
    <div className="rounded-2xl border-2 border-kids-navy/20 bg-white overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Export CSV</h3>
        <p className="text-sm text-gray-500">
          Downloads every row of a table, current at the time of download. Password hashes and registration link
          tokens are left out.
        </p>
      </div>
      {DEVOPS_TABLE_GROUPS.map(({ area, tables }) => (
        <div key={area}>
          <p className="px-6 py-2 bg-kids-yellow/10 border-y border-gray-100 text-xs font-bold text-kids-navy/70 uppercase tracking-wide">
            {area}
          </p>
          <ul className="divide-y divide-gray-100">
            {tables.map(({ key, label }) => (
              <li key={key} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {key} · {(counts[key] ?? 0).toLocaleString()} rows
                  </p>
                </div>
                <a
                  href={`/api/devops-admin/export?table=${key}`}
                  download
                  className="shrink-0 bg-kids-green hover:bg-kids-green/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
                >
                  Download CSV
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
