import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { FOLLOW_UP_MIN_DAYS, getAttendanceReport } from "@/lib/reports";
import { BarList, ChartCard, StackedColumnChart, StatTile } from "../charts";
import { dateFromString, fullDateFormatter, hourLabel, percent, shortDateFormatter } from "../format";
import { capitalizeName } from "@/lib/format";

export default async function AttendanceReportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const report = await getAttendanceReport();
  const { totals } = report;
  const latest = totals.latestSunday;
  const peak = report.newVsReturning.reduce<(typeof report.newVsReturning)[number] | undefined>(
    (best, d) => (!best || d.firstTime + d.returning > best.firstTime + best.returning ? d : best),
    undefined
  );
  const busiestHour = report.sundayHours.reduce<(typeof report.sundayHours)[number] | undefined>(
    (best, h) => (!best || h.checkIns > best.checkIns ? h : best),
    undefined
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          value={latest?.firstTime ?? 0}
          label="First-timers last Sunday"
          hint={latest ? shortDateFormatter.format(dateFromString(latest.date)) : undefined}
          textClass="text-kids-green"
        />
        <StatTile
          value={latest?.returning ?? 0}
          label="Returning kids last Sunday"
          hint={latest ? shortDateFormatter.format(dateFromString(latest.date)) : undefined}
          textClass="text-kids-navy"
        />
        <StatTile
          value={`${percent(totals.otherServiceCheckIns, totals.checkIns)}%`}
          label="Check-ins at another service"
          hint={`${totals.otherServiceCheckIns} of ${totals.checkIns}`}
          textClass="text-kids-magenta"
        />
        <StatTile
          value={totals.neverCheckedOut}
          label="Never checked out"
          hint="Check-ins still open, any day"
          textClass="text-kids-yellow"
        />
      </div>

      <ChartCard title="First-time vs returning kids" subtitle="Unique kids each Sunday, split by whether it was their first check-in ever.">
        {report.newVsReturning.length === 0 ? (
          <p className="text-sm text-gray-400">No Sunday check-ins yet.</p>
        ) : (
          <StackedColumnChart
            aLabel="Returning"
            bLabel="First time"
            data={report.newVsReturning.map((d) => ({
              key: d.date,
              label: shortDateFormatter.format(dateFromString(d.date)),
              a: d.returning,
              b: d.firstTime,
              showValue: d.date === peak?.date || d.date === latest?.date,
              tooltip: (
                <>
                  <span className="block font-semibold">{fullDateFormatter.format(dateFromString(d.date))}</span>
                  <span className="block">Returning: {d.returning}</span>
                  <span className="block">First time: {d.firstTime}</span>
                </>
              ),
            }))}
          />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Sunday check-ins by hour"
          subtitle={busiestHour ? `Busiest: ${hourLabel(busiestHour.hour)} hour, ${busiestHour.checkIns} check-ins all time.` : undefined}
        >
          <BarList
            data={report.sundayHours.map((h) => ({
              key: String(h.hour),
              label: `${hourLabel(h.hour)}`,
              value: h.checkIns,
              tooltip: `${hourLabel(h.hour)}–${hourLabel((h.hour + 1) % 24)}: ${h.checkIns} check-ins`,
            }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Kids from other services</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Check-ins</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Registered elsewhere</th>
                </tr>
              </thead>
              <tbody>
                {report.crossService.map((s) => (
                  <tr key={s.service} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.service}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{s.checkIns}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {s.fromOtherServices}{" "}
                      <span className="text-gray-400">({percent(s.fromOtherServices, s.checkIns)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            Check-ins by kids whose registered service is different — a high share may mean their registration needs updating.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
            Kids to follow up ({report.followUp.length})
          </h3>
          <p className="text-xs text-gray-500">
            {report.followUpSundays.length > 0
              ? `Came at least ${FOLLOW_UP_MIN_DAYS} times but missed all of the last ${report.followUpSundays.length} Sundays (since ${shortDateFormatter.format(dateFromString(report.followUpSundays[0]))}).`
              : "Not enough Sundays recorded yet."}
          </p>
        </div>
        {report.followUp.length === 0 ? (
          <p className="text-sm text-gray-400">No one to follow up right now. 🎉</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kid</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Registered service</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Days attended</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Last attended</th>
                </tr>
              </thead>
              <tbody>
                {report.followUp.map((kid) => (
                  <tr key={kid.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/kids?q=${encodeURIComponent(`${kid.firstName} ${kid.lastName}`)}`}
                        className="font-medium text-kids-navy hover:underline"
                      >
                        {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
                      </Link>
                      {kid.nickname && <span className="text-gray-400"> ({capitalizeName(kid.nickname)})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{kid.service}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{kid.daysAttended}</td>
                    <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                      {shortDateFormatter.format(dateFromString(kid.lastAttended))}
                    </td>
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
