import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { getManilaDayBounds, getStaleOpenCheckIns } from "@/lib/checkIn";
import {
  FOLLOW_UP_MIN_DAYS,
  REPORT_RANGES,
  SERVICE_MISMATCH_MIN_CHECK_INS,
  getAttendanceReport,
  parseReportRange,
  reportRangeStart,
} from "@/lib/reports";
import { canManageKids } from "@/app/kids/permissions";
import { BarList, ChartCard, StackedColumnChart, StatTile } from "../charts";
import { dateFromString, fullDateFormatter, hourLabel, percent, shortDateFormatter } from "../format";
import { RangePicker } from "../RangePicker";
import { KidLink } from "../KidLink";
import { ExportListButton } from "../ExportListButton";
import { AgeTrend } from "../AgeTrend";

function ListSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Hidden for now: the "Registered to a different service", "Forgotten checkouts" and "Kids to
// follow up" lists (and the forgotten-checkouts stat tile). The data and Excel exports are
// still wired up — set this to true to show them again.
const SHOW_ACTION_LISTS = false;

const TABLE_WRAP = "overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm max-h-[32rem]";
const TH = "px-4 py-3 font-semibold text-gray-600";

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const range = parseReportRange((await searchParams).range);
  const rangeLabel = REPORT_RANGES.find((r) => r.key === range)!.label.toLowerCase();
  const [report, staleOpen, canEdit] = await Promise.all([
    getAttendanceReport(reportRangeStart(range)),
    SHOW_ACTION_LISTS ? getStaleOpenCheckIns(getManilaDayBounds().start) : [],
    SHOW_ACTION_LISTS ? canManageKids(session) : false,
  ]);
  const { totals } = report;
  const latest = totals.latestSunday;
  const staleTotal = staleOpen.reduce((sum, d) => sum + d.count, 0);
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
      <RangePicker basePath="/reports/attendance" range={range} />

      <div className={`grid grid-cols-2 gap-4 ${SHOW_ACTION_LISTS ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
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
        {SHOW_ACTION_LISTS && (
          <StatTile
            value={staleTotal}
            label="Forgotten checkouts"
            hint={`Still open from ${staleOpen.length} past day${staleOpen.length === 1 ? "" : "s"}`}
            textClass="text-kids-yellow"
          />
        )}
      </div>

      <ChartCard title="First-time vs returning kids" subtitle="Unique kids each Sunday, split by whether it was their first check-in ever.">
        {report.newVsReturning.length === 0 ? (
          <p className="text-sm text-gray-400">No Sunday check-ins in this period.</p>
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

      {report.sundayAges.length > 0 && (
        <ChartCard title="Age groups each Sunday" subtitle="Unique kids checked in each Sunday, by age group.">
          <AgeTrend sundays={report.sundayAges} />
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Sunday check-ins by hour"
          subtitle={busiestHour ? `Busiest: ${hourLabel(busiestHour.hour)} hour, ${busiestHour.checkIns} check-ins (${rangeLabel}).` : undefined}
        >
          <BarList
            data={report.sundayHours.map((h) => ({
              key: String(h.hour),
              label: hourLabel(h.hour),
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
                  <th className={`${TH} text-left`}>Service</th>
                  <th className={`${TH} text-right`}>Check-ins</th>
                  <th className={`${TH} text-right whitespace-nowrap`}>Registered elsewhere</th>
                </tr>
              </thead>
              <tbody>
                {report.crossService.map((s) => (
                  <tr key={s.service} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.service}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{s.checkIns}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {s.fromOtherServices} <span className="text-gray-400">({percent(s.fromOtherServices, s.checkIns)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            Check-ins by kids whose registered service is different.{SHOW_ACTION_LISTS && " The list below shows who to update."}
          </p>
        </div>
      </div>

      {SHOW_ACTION_LISTS && (
        <>
          <ListSection
            title={`Registered to a different service (${report.serviceMismatch.length})`}
            description={`Kids with ${SERVICE_MISMATCH_MIN_CHECK_INS}+ check-ins (${rangeLabel}) who were at their registered service less than half the time.`}
            action={report.serviceMismatch.length > 0 && <ExportListButton kind="service-mismatch" range={range} />}
          >
            {report.serviceMismatch.length === 0 ? (
              <p className="text-sm text-gray-400">Everyone mostly attends their registered service. 🎉</p>
            ) : (
              <div className={TABLE_WRAP}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className={`${TH} text-left`}>Kid</th>
                      <th className={`${TH} text-left`}>Registered</th>
                      <th className={`${TH} text-left whitespace-nowrap`}>Usually attends</th>
                      <th className={`${TH} text-right`}>Check-ins there</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.serviceMismatch.map((kid) => (
                      <tr key={kid.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                        <td className="px-4 py-3">
                          <KidLink kid={kid} canEdit={canEdit} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{kid.service}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{kid.usualService}</td>
                        <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                          {kid.usualCount} <span className="text-gray-400">of {kid.totalCheckIns}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ListSection>

          <ListSection
            title={`Forgotten checkouts (${staleTotal})`}
            description="Kids still checked in from a past day. An open check-in blocks that kid from checking in again, so close them out from that day's attendance."
          >
            {staleOpen.length === 0 ? (
              <p className="text-sm text-gray-400">No forgotten checkouts. 🎉</p>
            ) : (
              <div className={TABLE_WRAP}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className={`${TH} text-left`}>Day</th>
                      <th className={`${TH} text-right`}>Still checked in</th>
                      <th className={`${TH} text-right`} />
                    </tr>
                  </thead>
                  <tbody>
                    {[...staleOpen].reverse().map((d) => (
                      <tr key={d.date} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                        <td className="px-4 py-3 text-gray-900">{fullDateFormatter.format(dateFromString(d.date))}</td>
                        <td className="px-4 py-3 text-right font-bold text-kids-navy">{d.count}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/attendance?month=${d.date.slice(0, 7)}&date=${d.date}`}
                            className="text-sm font-semibold text-kids-navy hover:underline whitespace-nowrap"
                          >
                            Open attendance →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ListSection>

          <ListSection
            title={`Kids to follow up (${report.followUp.length})`}
            description={
              report.followUpSundays.length > 0
                ? `Came at least ${FOLLOW_UP_MIN_DAYS} times but missed all of the last ${report.followUpSundays.length} Sundays (since ${shortDateFormatter.format(dateFromString(report.followUpSundays[0]))}). Not affected by the date range.`
                : "Not enough Sundays recorded yet."
            }
            action={report.followUp.length > 0 && <ExportListButton kind="follow-up" />}
          >
            {report.followUp.length === 0 ? (
              <p className="text-sm text-gray-400">No one to follow up right now. 🎉</p>
            ) : (
              <div className={TABLE_WRAP}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className={`${TH} text-left`}>Kid</th>
                      <th className={`${TH} text-left`}>Registered service</th>
                      <th className={`${TH} text-right`}>Days attended</th>
                      <th className={`${TH} text-right`}>Last attended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.followUp.map((kid) => (
                      <tr key={kid.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                        <td className="px-4 py-3">
                          <KidLink kid={kid} canEdit={canEdit} />
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
          </ListSection>
        </>
      )}
    </div>
  );
}
