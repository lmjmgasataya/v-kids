import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { capitalizeName } from "@/lib/format";
import { findDuplicateGroups, type DuplicateConfidence } from "@/lib/kidDuplicates";
import { DeleteKidButton } from "../DeleteKidButton";
import { canManageKids } from "../permissions";

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

const CONFIDENCE_STYLES: Record<DuplicateConfidence, string> = {
  High: "bg-kids-magenta/10 text-kids-magenta",
  Medium: "bg-kids-yellow/20 text-kids-navy",
  Low: "bg-gray-100 text-gray-500",
};

export default async function KidDuplicatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      gender: kids.gender,
      serviceAttending: kids.serviceAttending,
      createdAt: kids.createdAt,
      guardianId: kids.guardianId,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianContactNumber: guardians.contactNumber,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id));

  const groups = findDuplicateGroups(rows);
  const canManage = await canManageKids(session);
  const nameById = new Map(rows.map((r) => [r.id, `${capitalizeName(r.firstName)} ${capitalizeName(r.lastName)}`]));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Registered Kids", href: "/kids" },
          { label: "Possible Duplicates" },
        ]}
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Possible Duplicates
        </h2>
        <p className="text-sm text-gray-500">
          Registrations that look like the same kid — similar spelling, a nickname used as the first name, names
          swapped, or the same guardian number. Review each group before deleting anything.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No possible duplicates found. 🎉</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-600">
            {groups.length} group{groups.length === 1 ? "" : "s"} found
          </p>
          {groups.map((group) => (
            <div
              key={group.members.map((m) => m.id).join("-")}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap px-4 py-3 border-b border-gray-200 bg-gray-50">
                <ul className="flex flex-col gap-1 text-xs text-gray-600">
                  {group.pairs.map((pair) => (
                    <li key={`${pair.aId}-${pair.bId}`}>
                      {group.pairs.length > 1 && (
                        <span className="font-semibold text-gray-800">
                          {nameById.get(pair.aId)} ↔ {nameById.get(pair.bId)}:{" "}
                        </span>
                      )}
                      {pair.reasons.join(" · ")}
                    </li>
                  ))}
                </ul>
                <span
                  className={`shrink-0 text-xs font-bold rounded-full px-2.5 py-1 ${CONFIDENCE_STYLES[group.confidence]}`}
                >
                  {group.confidence} match
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Age</th>
                      <th className="px-4 py-2 font-semibold">Gender</th>
                      <th className="px-4 py-2 font-semibold">Guardian</th>
                      <th className="px-4 py-2 font-semibold">Service</th>
                      <th className="px-4 py-2 font-semibold">Registered</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.members.map((kid) => (
                      <tr key={kid.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
                          {kid.nickname && (
                            <span className="text-xs text-gray-400"> &quot;{capitalizeName(kid.nickname)}&quot;</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{kid.age}</td>
                        <td className="px-4 py-3">{kid.gender}</td>
                        <td className="px-4 py-3">
                          {capitalizeName(kid.guardianFirstName)} {capitalizeName(kid.guardianLastName)}
                          <span className="block text-xs text-gray-400">{kid.guardianContactNumber}</span>
                        </td>
                        <td className="px-4 py-3">{kid.serviceAttending}</td>
                        <td className="px-4 py-3 text-gray-500">{dateFormatter.format(kid.createdAt)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {canManage && (
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/kids/${kid.id}/edit`} className="text-kids-navy font-semibold hover:underline">
                                Edit
                              </Link>
                              <span className="text-gray-300">|</span>
                              <DeleteKidButton
                                kidId={kid.id}
                                kidName={`${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`}
                                returnTo="/kids/duplicates"
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
