import Link from "next/link";
import { DeleteKidButton } from "./DeleteKidButton";
import { capitalizeName } from "@/lib/format";

interface Row {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  gender: string;
  serviceAttending: string;
  createdAt: Date;
  guardianFirstName: string;
  guardianLastName: string;
  guardianContactNumber: string;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: "lastName", label: "Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "guardian", label: "Guardian" },
  { key: "serviceAttending", label: "Service" },
  { key: "createdAt", label: "Registered" },
];

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

export function KidsTable({
  rows,
  sort,
  dir,
  q,
  gender,
  service,
  canManage,
}: {
  rows: Row[];
  sort: string;
  dir: "asc" | "desc";
  q: string;
  gender: string;
  service: string;
  canManage: boolean;
}) {
  function sortHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (gender) params.set("gender", gender);
    if (service) params.set("service", service);
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    return `/kids?${params.toString()}`;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No kids registered yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
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
                <div className="font-medium text-gray-900">
                  {capitalizeName(row.firstName)} {capitalizeName(row.lastName)}
                </div>
                {row.nickname && <div className="text-xs text-gray-400">&quot;{capitalizeName(row.nickname)}&quot;</div>}
              </td>
              <td className="px-4 py-3">{row.age}</td>
              <td className="px-4 py-3">{row.gender}</td>
              <td className="px-4 py-3">
                <div>
                  {capitalizeName(row.guardianFirstName)} {capitalizeName(row.guardianLastName)}
                </div>
                <div className="text-xs text-gray-400">{row.guardianContactNumber}</div>
              </td>
              <td className="px-4 py-3">{row.serviceAttending}</td>
              <td className="px-4 py-3 text-gray-500">{dateFormatter.format(row.createdAt)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  {canManage && (
                    <>
                      <Link href={`/kids/${row.id}/id-card`} className="text-kids-navy font-semibold hover:underline">
                        Print ID
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href={`/kids/${row.id}/edit`} className="text-kids-navy font-semibold hover:underline">
                        Edit
                      </Link>
                      <span className="text-gray-300">|</span>
                      <DeleteKidButton kidId={row.id} kidName={`${capitalizeName(row.firstName)} ${capitalizeName(row.lastName)}`} />
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
