import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getKcBucksGrantsByReason,
  getKcBucksGrantsByStaff,
  getKcBucksRedemptionsByReason,
  getKcBucksSummaryTotals,
} from "@/lib/kcBucks";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const STAT_TILES = [
  { key: "checkinCredits", label: "Check-in credits", textClass: "text-kids-green" },
  { key: "grantedCredits", label: "Manual grants", textClass: "text-kids-yellow" },
  { key: "redeemedCredits", label: "Redeemed", textClass: "text-kids-magenta" },
  { key: "netOutstanding", label: "Net outstanding", textClass: "text-kids-navy" },
] as const;

function ReasonTable({ title, rows }: { title: string; rows: { reason: string; count: number; amount: number }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Count</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">KC Bucks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.reason} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{row.reason}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{row.count}</td>
                  <td className="px-4 py-3 text-right font-bold text-kids-navy">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function KcBucksSummaryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [totals, grantsByReason, redemptionsByReason, grantsByStaff] = await Promise.all([
    getKcBucksSummaryTotals(),
    getKcBucksGrantsByReason(),
    getKcBucksRedemptionsByReason(),
    getKcBucksGrantsByStaff(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "Summary" }]} />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">KC Bucks Summary</h2>
          <p className="text-sm text-gray-500">Totals and breakdowns across every kid, all time.</p>
        </div>
        <Link
          href="/kc-bucks/summary/transactions"
          className="rounded-full bg-kids-navy px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          View all transactions →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_TILES.map((tile) => (
          <div key={tile.key} className="rounded-2xl border-2 border-kids-navy/20 bg-white p-4 flex flex-col gap-1">
            <span className={`text-2xl font-bold ${tile.textClass}`}>{totals[tile.key]}</span>
            <span className="text-xs font-semibold text-gray-500">{tile.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReasonTable title="Top grant reasons" rows={grantsByReason} />
        <ReasonTable title="Top redemption reasons" rows={redemptionsByReason} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Top staff by grants</h3>
        {grantsByStaff.length === 0 ? (
          <p className="text-sm text-gray-400">No manual grants yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Staff</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Grants</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">KC Bucks</th>
                </tr>
              </thead>
              <tbody>
                {grantsByStaff.map((row) => (
                  <tr key={row.userId ?? row.name} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-kids-navy">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
