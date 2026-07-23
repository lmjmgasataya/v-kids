import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAttendanceByService, getManilaDayBoundsForDateString, manilaDateString } from "@/lib/checkIn";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AttendanceDateNav } from "./AttendanceDateNav";

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
  const requestedDate = typeof sp.date === "string" ? sp.date : undefined;
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : manilaDateString();

  const { start, end } = getManilaDayBoundsForDateString(date);
  const rows = await getAttendanceByService(start, end);

  const totals = rows.reduce(
    (acc, row) => ({
      checkedIn: acc.checkedIn + row.checkedIn,
      checkedOut: acc.checkedOut + row.checkedOut,
      total: acc.total + row.total,
    }),
    { checkedIn: 0, checkedOut: 0, total: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Attendance" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Attendance</h2>

      <AttendanceDateNav date={date} today={manilaDateString()}>
        <p className="text-sm text-gray-500 mb-6">{dateHeadingFormatter.format(start)}</p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Checked in</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Checked out</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.service} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.service}</td>
                  <td className="px-4 py-3 text-right">
                    {row.checkedIn > 0 ? (
                      <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1">
                        {row.checkedIn}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{row.checkedOut}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-gray-900">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{totals.checkedIn}</td>
                <td className="px-4 py-3 text-right">{totals.checkedOut}</td>
                <td className="px-4 py-3 text-right">{totals.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </AttendanceDateNav>
    </div>
  );
}
