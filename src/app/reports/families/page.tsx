import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SHARED_NUMBER_MIN_KIDS, getFamiliesReport } from "@/lib/reports";
import { BarList, ChartCard, ProgressMeter, StatTile } from "../charts";
import { percent } from "../format";

export default async function FamiliesReportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const report = await getFamiliesReport();
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
    </div>
  );
}
