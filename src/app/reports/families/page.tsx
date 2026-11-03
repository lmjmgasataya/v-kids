import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SHARED_NUMBER_MIN_KIDS, getFamiliesReport } from "@/lib/reports";
import { BarList, ChartCard, ProgressMeter, StatTile } from "../charts";
import { percent } from "../format";
import { canManageKids } from "@/app/kids/permissions";
import { capitalizeName } from "@/lib/format";
import { KidLink } from "../KidLink";
import { ExportListButton } from "../ExportListButton";

export default async function FamiliesReportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [report, canEdit] = await Promise.all([getFamiliesReport(), canManageKids(session)]);
  const { totals, guardianGender } = report;
  const guardianTotal = guardianGender.male + guardianGender.female;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-500">
        Each registration creates its own guardian record, so families are grouped by the guardian&apos;s contact number.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile value={totals.families} label="Families" hint={`From ${totals.guardianRecords} registrations`} textClass="text-kids-navy" />
        <StatTile
          value={totals.familiesWithSiblings}
          label="Families with 2+ kids"
          hint={`${percent(totals.familiesWithSiblings, totals.families)}% of families`}
          textClass="text-kids-green"
        />
        <StatTile
          value={report.siblingsSplitAcrossServices}
          label="Siblings in different services"
          hint="Families whose kids are registered to more than one service"
          textClass="text-kids-magenta"
        />
        <StatTile
          value={totals.sharedNumbers}
          label="Shared contact numbers"
          hint={`${totals.kidsOnSharedNumbers} kids on numbers with ${SHARED_NUMBER_MIN_KIDS}+ kids`}
          textClass="text-kids-yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Kids per family"
          subtitle={`Excludes the ${totals.sharedNumbers} shared number${totals.sharedNumbers === 1 ? "" : "s"} with ${SHARED_NUMBER_MIN_KIDS}+ kids — those are likely a staff or placeholder number, not one family.`}
        >
          <BarList
            data={report.kidsPerFamily.map((row) => ({
              key: row.label,
              label: row.label,
              value: row.count,
              tooltip: `${row.count} ${row.count === 1 ? "family" : "families"} · ${percent(row.count, totals.families)}%`,
            }))}
          />
        </ChartCard>

        <ChartCard title="Who registered the kids" subtitle="Gender of the guardian on each registration.">
          <div className="flex flex-col gap-4">
            <ProgressMeter label="Female guardians" value={guardianGender.female} total={guardianTotal} />
            <ProgressMeter label="Male guardians" value={guardianGender.male} total={guardianTotal} />
          </div>
        </ChartCard>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
              Shared contact numbers ({totals.kidsOnSharedNumbers} kids)
            </h3>
            <p className="text-xs text-gray-500">
              Numbers used for {SHARED_NUMBER_MIN_KIDS}+ kids. Update each kid&apos;s guardian with their real number so families can be reached.
            </p>
          </div>
          {report.sharedNumberGroups.length > 0 && <ExportListButton kind="shared-numbers" />}
        </div>
        {report.sharedNumberGroups.length === 0 ? (
          <p className="text-sm text-gray-400">No shared numbers. 🎉</p>
        ) : (
          report.sharedNumberGroups.map((group) => (
            <details key={group.contactNumber} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900">
                {group.contactNumber} <span className="font-normal text-gray-500">· {group.kids.length} kids</span>
              </summary>
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Kid</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Service</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Guardian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.kids.map((kid) => (
                      <tr key={kid.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                        <td className="px-4 py-2">
                          <KidLink kid={kid} canEdit={canEdit} />
                        </td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{kid.service}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {capitalizeName(kid.guardianFirstName)} {capitalizeName(kid.guardianLastName)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
