import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServiceTeamReport } from "@/lib/reports";
import { ChartCard, SplitBarList, StatTile } from "../charts";
import { percent } from "../format";

export default async function ServiceTeamReportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const report = await getServiceTeamReport();
  const { totals } = report;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile value={totals.members} label="Service team members" textClass="text-kids-navy" />
        <StatTile
          value={`${totals.female} / ${totals.male}`}
          label="Female / male"
          hint={totals.unknownGender ? `${totals.unknownGender} not set` : undefined}
          textClass="text-kids-magenta"
        />
        <StatTile
          value={`${percent(totals.withPhoto, totals.members)}%`}
          label="Have a photo"
          hint={`${totals.withPhoto} of ${totals.members}`}
          textClass="text-kids-green"
        />
        <StatTile value={report.birthdaysThisMonth} label="Birthdays this month" textClass="text-kids-yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Age groups"
          subtitle={
            report.invalidBirthdays
              ? report.invalidBirthdays === 1
                ? "1 member has a birthday that looks mistyped (under 8 years old) and isn't counted."
                : `${report.invalidBirthdays} members have birthdays that look mistyped (under 8 years old) and aren't counted.`
              : undefined
          }
        >
          <SplitBarList
            aLabel="Male"
            bLabel="Female"
            data={report.ageGroups.map((g) => ({ key: g.label, label: g.label, a: g.male, b: g.female }))}
          />
        </ChartCard>

        <ChartCard title="Members by service">
          <SplitBarList
            aLabel="Male"
            bLabel="Female"
            wideLabels
            data={report.byService.map((s) => ({ key: s.service, label: s.service, a: s.male, b: s.female }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
