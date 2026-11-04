import { undoCheckIn, undoCheckOut, undoTeamCheckIn, undoTeamCheckOut } from "./actions";
import type { CheckInPersonKind } from "@/lib/checkIn";
import { UndoForm } from "./UndoForm";
import { QuickCheckOutForm } from "./QuickCheckOutForm";

interface Row {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  // Null for service team members — the Age column is hidden for kind="team".
  age: number | null;
  serviceAttending: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  remarks: string | null;
}

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" });

export function RosterTable({ rows, kind = "kid" }: { rows: Row[]; kind?: CheckInPersonKind }) {
  const showAge = kind === "kid";
  const undoIn = kind === "team" ? undoTeamCheckIn : undoCheckIn;
  const undoOut = kind === "team" ? undoTeamCheckOut : undoCheckOut;

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No check-ins yet today.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
            {showAge && <th className="px-4 py-3 text-left font-semibold text-gray-600">Age</th>}
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Checked in</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Remarks</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">
                  {row.firstName} {row.lastName}
                </div>
                {row.nickname && <div className="text-xs text-gray-400">&quot;{row.nickname}&quot;</div>}
              </td>
              {showAge && <td className="px-4 py-3">{row.age}</td>}
              <td className="px-4 py-3 text-gray-500">{timeFormatter.format(row.checkedInAt)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {row.checkedOutAt ? (
                  <span className="text-xs text-gray-500">Checked out {timeFormatter.format(row.checkedOutAt)}</span>
                ) : (
                  <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1">
                    Checked in
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.remarks}</td>
              <td className="px-4 py-3 text-right">
                {!row.checkedOutAt ? (
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <QuickCheckOutForm kind={kind} checkInId={row.id} service={row.serviceAttending} />
                    <UndoForm
                      action={undoIn.bind(null, row.id)}
                      confirmText={`Undo check-in for ${row.firstName} ${row.lastName}? This removes today's check-in record.`}
                      label="Undo check-in"
                      pendingLabel="…"
                      className="text-xs font-semibold text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <UndoForm
                    action={undoOut.bind(null, row.id)}
                    confirmText={`Undo check-out for ${row.firstName} ${row.lastName}? They'll show as checked in again.`}
                    label="Undo check-out"
                    pendingLabel="…"
                    className="text-xs font-semibold text-kids-navy hover:underline disabled:opacity-50"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
