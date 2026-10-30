import { redirect } from "next/navigation";
import { getTableName, sql } from "drizzle-orm";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { FLAG_GROUPS, flagEnabled, isKnownFlag } from "@/lib/featureFlags";
import { DEVOPS_TABLE_GROUPS } from "@/lib/devopsTables";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { toggleFlag } from "./actions";
import { DeleteFlagButton } from "./DeleteFlagButton";

// pg table name → area, for grouping the Database size list.
const AREA_BY_TABLE = new Map(
  DEVOPS_TABLE_GROUPS.flatMap(({ area, tables }) => tables.map((t) => [getTableName(t.table), area] as const))
);

// Should stay empty — a table landing here is missing from src/lib/devopsTables.ts.
const UNREGISTERED = "Not in the registry";

function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  return (
    <form action={toggleFlag.bind(null, flagKey)} className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{enabled ? "On" : "Off"}</span>
      <ToggleSwitch enabled={enabled} />
    </form>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 py-2 bg-kids-yellow/10 border-y border-gray-100 text-xs font-bold text-kids-navy/70 uppercase tracking-wide">
      {children}
    </p>
  );
}

async function getDbStats() {
  const [sizeResult, tableResult] = await Promise.all([
    db.execute<{ db_size: string }>(sql`SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`),
    db.execute<{ table: string; total_size: string }>(sql`
      SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS total_size
      FROM pg_catalog.pg_statio_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(relid) DESC
    `),
  ]);
  return { dbSize: sizeResult.rows[0].db_size, tables: tableResult.rows };
}

export default async function DevopsAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [{ dbSize, tables }, flags] = await Promise.all([
    getDbStats(),
    db.select().from(featureFlags).orderBy(featureFlags.key),
  ]);
  const otherFlags = flags.filter((f) => !isKnownFlag(f.key));

  return (
    <div className="flex flex-col gap-6">
      {/* Feature Flags */}
      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Feature flags</h3>
          <p className="text-sm text-gray-500">
            Apply for everyone, on the next page load. A flag with no row yet shows its default.
          </p>
        </div>
        {FLAG_GROUPS.map(({ area, flags: groupFlags }) => (
          <div key={area}>
            <GroupHeading>{area}</GroupHeading>
            <ul className="divide-y divide-gray-100">
              {groupFlags.map(({ key, label }) => (
                <li key={key} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{key}</p>
                  </div>
                  <FlagToggle flagKey={key} enabled={flagEnabled(key, flags.find((f) => f.key === key))} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {otherFlags.length > 0 && (
          <div>
            <GroupHeading>Other (not read by the code)</GroupHeading>
            <ul className="divide-y divide-gray-100">
              {otherFlags.map((flag) => (
                <li key={flag.key} className="flex items-center justify-between gap-4 px-6 py-4">
                  <p className="font-semibold text-gray-900 font-mono">{flag.key}</p>
                  <div className="flex items-center gap-4">
                    <FlagToggle flagKey={flag.key} enabled={flag.enabled} />
                    <DeleteFlagButton flagKey={flag.key} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Database */}
      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Database</h3>
          <span className="text-sm font-bold text-kids-magenta">{dbSize}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="px-6 py-2 text-left font-semibold text-gray-600">Table</th>
              <th className="px-6 py-2 text-right font-semibold text-gray-600">Size</th>
            </tr>
          </thead>
          {[...DEVOPS_TABLE_GROUPS.map((g) => g.area), UNREGISTERED].map((area) => {
            const rows = tables.filter((t) => (AREA_BY_TABLE.get(t.table) ?? UNREGISTERED) === area);
            if (rows.length === 0) return null;
            return (
              <tbody key={area} className="divide-y divide-gray-100">
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-2 bg-kids-yellow/10 border-y border-gray-100 text-xs font-bold text-kids-navy/70 uppercase tracking-wide"
                  >
                    {area}
                  </td>
                </tr>
                {rows.map((t) => (
                  <tr key={t.table} className="hover:bg-kids-yellow/5">
                    <td className="px-6 py-2.5 font-mono text-gray-700">{t.table}</td>
                    <td className="px-6 py-2.5 text-right text-gray-500">{t.total_size}</td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
