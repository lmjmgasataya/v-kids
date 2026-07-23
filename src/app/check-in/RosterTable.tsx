import { checkOutKidForm, undoCheckIn, undoCheckOut } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { UndoForm } from "./UndoForm";
import { inputCls } from "@/components/form";

interface Row {
  id: number;
  kidFirstName: string;
  kidLastName: string;
  kidNickname: string | null;
  serviceAttending: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  remarks: string | null;
}

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });

export function RosterTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No check-ins yet today.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Checked in</th>
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
                  {row.kidFirstName} {row.kidLastName}
                </div>
                {row.kidNickname && <div className="text-xs text-gray-400">&quot;{row.kidNickname}&quot;</div>}
              </td>
              <td className="px-4 py-3">{row.serviceAttending}</td>
              <td className="px-4 py-3 text-gray-500">{timeFormatter.format(row.checkedInAt)}</td>
              <td className="px-4 py-3">
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
                    <form action={checkOutKidForm.bind(null, row.id)} className="flex items-center gap-2">
                      <input type="hidden" name="service" value={row.serviceAttending} />
                      <input
                        name="remarks"
                        placeholder="Remarks (optional)"
                        maxLength={500}
                        className={`${inputCls} w-40 py-1.5`}
                      />
                      <SubmitButton
                        label="Check out"
                        pendingLabel="…"
                        icon="👋"
                        className="bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
                      />
                    </form>
                    <UndoForm
                      action={undoCheckIn.bind(null, row.id)}
                      confirmText={`Undo check-in for ${row.kidFirstName} ${row.kidLastName}? This removes today's check-in record.`}
                      label="Undo check-in"
                      pendingLabel="…"
                      className="text-xs font-semibold text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <UndoForm
                    action={undoCheckOut.bind(null, row.id)}
                    confirmText={`Undo check-out for ${row.kidFirstName} ${row.kidLastName}? They'll show as checked in again.`}
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
