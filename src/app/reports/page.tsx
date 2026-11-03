import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { REPORT_RANGES, getReportData, parseReportRange, reportRangeStart } from "@/lib/reports";
import { getKcBucksSummaryTotals } from "@/lib/kcBucks";
import { dateFromString, fullDateFormatter, monthFormatter, shortDateFormatter } from "./format";
import { RangePicker } from "./RangePicker";
import { BarList, ChartCard, ColumnChart, ProgressMeter, SplitBarList, StatTile } from "./charts";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const isAdmin = session.role === "admin";

  const range = parseReportRange((await searchParams).range);
  const rangeLabel = REPORT_RANGES.find((r) => r.key === range)!.label.toLowerCase();
  const [report, kcBucks] = await Promise.all([
    getReportData(reportRangeStart(range)),
    isAdmin ? getKcBucksSummaryTotals() : null,
  ]);
  const { totals } = report;

  const peakDay = report.serviceDays.reduce<(typeof report.serviceDays)[number] | undefined>(
    (best, d) => (!best || d.uniqueKids > best.uniqueKids ? d : best),
    undefined
  );
  const latestDay = report.serviceDays.at(-1);
  const attendedPct = totals.kids ? Math.round((totals.kidsAttended / totals.kids) * 100) : 0;
  const serviceTotals = report.services.reduce(
    (acc, s) => ({
      registeredKids: acc.registeredKids + s.registeredKids,
      serviceTeam: acc.serviceTeam + s.serviceTeam,
      checkIns: acc.checkIns + s.checkIns,
      avgPerSunday: acc.avgPerSunday + s.avgPerSunday,
    }),
    { registeredKids: 0, serviceTeam: 0, checkIns: 0, avgPerSunday: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <RangePicker basePath="/reports" range={range} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile value={totals.kids} label="Registered kids" textClass="text-kids-navy" />
        <StatTile value={totals.serviceTeam} label="Service team members" textClass="text-kids-magenta" />
        <StatTile
          value={totals.avgKidsPerSunday}
          label="Avg. kids per Sunday"
          hint={`Across ${totals.sundays} Sunday${totals.sundays === 1 ? "" : "s"}`}
          textClass="text-kids-green"
        />
        <StatTile
          value={`${attendedPct}%`}
          label={`Kids who attended (${rangeLabel})`}
          hint={`${totals.kidsAttended} of ${totals.kids}`}
          textClass="text-kids-navy"
        />
      </div>

      <ChartCard
        title="Kids per service day"
        subtitle={`Unique kids checked in each day · ${totals.checkIns} check-ins total. Faded columns are non-Sunday days.`}
      >
        {report.serviceDays.length === 0 ? (
          <p className="text-sm text-gray-400">No check-ins in this period.</p>
        ) : (
          <ColumnChart
            data={report.serviceDays.map((d) => ({
              key: d.date,
              label: shortDateFormatter.format(dateFromString(d.date)),
              value: d.uniqueKids,
              muted: !d.isSunday,
              showValue: d.date === peakDay?.date || d.date === latestDay?.date,
              tooltip: (
                <>
                  <span className="block font-semibold">{fullDateFormatter.format(dateFromString(d.date))}</span>
                  <span className="block">{d.uniqueKids} kids</span>
                  <span className="block">{d.checkIns} check-ins</span>
                </>
              ),
            }))}
          />
        )}
      </ChartCard>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">By service</h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Registered kids</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Avg. per Sunday</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total check-ins</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Service team</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Kids per server</th>
              </tr>
            </thead>
            <tbody>
              {report.services.map((s) => (
                <tr key={s.service} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.service}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{s.registeredKids}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{s.avgPerSunday}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.checkIns}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{s.serviceTeam}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {s.serviceTeam ? (s.avgPerSunday / s.serviceTeam).toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-gray-900">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{serviceTotals.registeredKids}</td>
                <td className="px-4 py-3 text-right">{Math.round(serviceTotals.avgPerSunday * 10) / 10}</td>
                <td className="px-4 py-3 text-right">{serviceTotals.checkIns}</td>
                <td className="px-4 py-3 text-right">{serviceTotals.serviceTeam}</td>
                <td className="px-4 py-3 text-right">
                  {serviceTotals.serviceTeam ? (serviceTotals.avgPerSunday / serviceTotals.serviceTeam).toFixed(1) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          &quot;Kids per server&quot; divides the average Sunday check-ins by registered service team members for that service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Registered kids by age" subtitle="Hover a row for the boys / girls split.">
          <SplitBarList
            aLabel="Boys"
            bLabel="Girls"
            data={report.ages.map((a) => ({ key: String(a.age), label: `${a.age} yrs`, a: a.male, b: a.female }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-6">
          <ChartCard title="How often kids come" subtitle="Registered kids by number of days they checked in.">
            <BarList
              data={report.attendanceFrequency.map((f) => ({
                key: f.label,
                label: f.label,
                value: f.count,
                tooltip: `${f.count} kids · ${totals.kids ? Math.round((f.count / totals.kids) * 100) : 0}%`,
              }))}
            />
          </ChartCard>

          <ChartCard title="New registrations by month" subtitle={range === "all" ? undefined : `Registered ${rangeLabel}.`}>
            {report.registrationsByMonth.length === 0 ? (
              <p className="text-sm text-gray-400">No new registrations in this period.</p>
            ) : (
              <BarList
                data={report.registrationsByMonth.map((m) => ({
                  key: m.label,
                  label: monthFormatter.format(dateFromString(`${m.label}-01`)),
                  value: m.count,
                }))}
              />
            )}
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="ID cards">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kids</p>
            <ProgressMeter label="Printed" value={report.kidIdCards.printed} total={report.kidIdCards.total} />
            <ProgressMeter label="Given" value={report.kidIdCards.given} total={report.kidIdCards.total} />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Service team</p>
            <ProgressMeter label="Printed" value={report.serviceTeamIdCards.printed} total={report.serviceTeamIdCards.total} />
            <ProgressMeter label="Given" value={report.serviceTeamIdCards.given} total={report.serviceTeamIdCards.total} />
          </div>
        </ChartCard>

        {kcBucks && (
          <ChartCard title="KC Bucks">
            <div className="grid grid-cols-2 gap-4">
              <StatTile value={kcBucks.checkinCredits} label="Check-in credits" textClass="text-kids-green" />
              <StatTile value={kcBucks.grantedCredits} label="Manual grants" textClass="text-kids-yellow" />
              <StatTile value={kcBucks.redeemedCredits} label="Redeemed" textClass="text-kids-magenta" />
              <StatTile value={kcBucks.netOutstanding} label="Net outstanding" textClass="text-kids-navy" />
            </div>
            <Link href="/kc-bucks/summary" className="text-sm font-semibold text-kids-navy hover:underline">
              Full KC Bucks summary →
            </Link>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
