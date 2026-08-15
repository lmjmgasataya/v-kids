import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getAttendanceByService,
  getAttendanceDatesInMonth,
  getManilaDayBoundsForDateString,
  getManilaMonthBoundsForMonthString,
  manilaMonthString,
} from "@/lib/checkIn";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AttendanceMonthNav } from "./AttendanceMonthNav";
import { ServiceRow } from "./ServiceRow";
import { ExportExcelButton } from "./ExportExcelButton";

const dateHeadingFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "full",
  timeZone: "Asia/Manila",
});

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const requestedMonth = typeof sp.month === "string" ? sp.month : undefined;
  const month = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : manilaMonthString();

  const { start: monthStart, end: monthEnd } = getManilaMonthBoundsForMonthString(month);
  const monthDates = await getAttendanceDatesInMonth(monthStart, monthEnd);

  const requestedDate = typeof sp.date === "string" ? sp.date : undefined;
  const date = monthDates.some((d) => d.date === requestedDate) ? requestedDate : monthDates.at(-1)?.date;

  let rows: Awaited<ReturnType<typeof getAttendanceByService>> = [];
  let dayStart: Date | undefined;
  if (date) {
    const { start, end } = getManilaDayBoundsForDateString(date);
    dayStart = start;
    rows = await getAttendanceByService(start, end);
  }

  const totals = rows.reduce(
    (acc, row) => ({
      checkedIn: acc.checkedIn + row.checkedIn,
      checkedOut: acc.checkedOut + row.checkedOut,
      stillPresent: acc.stillPresent + row.stillPresent,
    }),
    { checkedIn: 0, checkedOut: 0, stillPresent: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Attendance" }]} />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Attendance</h2>
        {date && <ExportExcelButton date={date} />}
      </div>

      <AttendanceMonthNav month={month} currentMonth={manilaMonthString()} dates={monthDates} selectedDate={date}>
        {date && dayStart && (
          <>
            <p className="text-sm text-gray-500">{dateHeadingFormatter.format(dayStart)}</p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Checked in</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Checked out</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Still present</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ServiceRow key={row.service} row={row} date={date} />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold text-gray-900">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{totals.checkedIn}</td>
                    <td className="px-4 py-3 text-right">{totals.checkedOut}</td>
                    <td className="px-4 py-3 text-right">{totals.stillPresent}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </AttendanceMonthNav>
    </div>
  );
}
