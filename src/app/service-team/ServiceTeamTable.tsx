import Link from "next/link";
import { DeleteServiceTeamMemberButton } from "./DeleteServiceTeamMemberButton";
import { ServiceTeamPhoto } from "./ServiceTeamPhoto";

interface Row {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  serviceAttending: string;
  photoUrl: string | null;
  createdAt: Date;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: "lastName", label: "Name" },
  { key: "birthday", label: "Birthday" },
  { key: "serviceAttending", label: "Service" },
  { key: "createdAt", label: "Registered" },
];

const registeredFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
// Birthdays are plain dates with no time component — format in UTC so the calendar day never shifts.
const birthdayFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

export function ServiceTeamTable({
  rows,
  sort,
  dir,
  q,
  canManage,
}: {
  rows: Row[];
  sort: string;
  dir: "asc" | "desc";
  q: string;
  canManage: boolean;
}) {
  function sortHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    return `/service-team?${params.toString()}`;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No service team members registered yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3" />
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600">
                <Link href={sortHref(col.key)} className="flex items-center gap-1 hover:text-kids-navy">
                  {col.label}
                  {sort === col.key && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                </Link>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
              <td className="px-4 py-3">
                <ServiceTeamPhoto
                  photoUrl={row.photoUrl}
                  initials={`${row.firstName[0]}${row.lastName[0]}`}
                  downloadName={`${row.firstName}-${row.lastName}`}
                />
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {row.firstName} {row.lastName}
              </td>
              <td className="px-4 py-3">{birthdayFormatter.format(new Date(row.birthday))}</td>
              <td className="px-4 py-3">{row.serviceAttending}</td>
              <td className="px-4 py-3 text-gray-500">{registeredFormatter.format(row.createdAt)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/service-team/${row.id}/id-card`} className="text-kids-navy font-semibold hover:underline">
                    Print ID
                  </Link>
                  {canManage && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Link href={`/service-team/${row.id}/edit`} className="text-kids-navy font-semibold hover:underline">
                        Edit
                      </Link>
                      <span className="text-gray-300">|</span>
                      <DeleteServiceTeamMemberButton
                        memberId={row.id}
                        memberName={`${row.firstName} ${row.lastName}`}
                      />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
