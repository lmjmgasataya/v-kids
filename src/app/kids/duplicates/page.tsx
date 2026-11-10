import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { guardians, kidDuplicateDismissals, kids } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { capitalizeName } from "@/lib/format";
import { findDuplicateGroups, pairKey, type DuplicateConfidence } from "@/lib/kidDuplicates";
import { DeleteKidButton } from "../DeleteKidButton";
import { canManageKids } from "../permissions";
import { dismissDuplicatePairs, restoreDuplicatePair } from "./actions";
import { duplicatesHref, parseDuplicateView, type DuplicateView } from "./view";

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

const CONFIDENCE_STYLES: Record<DuplicateConfidence, string> = {
  High: "bg-kids-magenta/10 text-kids-magenta",
  Medium: "bg-kids-yellow/20 text-kids-navy",
  Low: "bg-gray-100 text-gray-500",
};

const VIEW_LABELS: Record<DuplicateView, string> = {
  high: "High matches",
  all: "All matches",
  hidden: "Hidden",
};

export default async function KidDuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const view = parseDuplicateView((await searchParams).show);

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

  const dismissals = await db
    .select({ kidAId: kidDuplicateDismissals.kidAId, kidBId: kidDuplicateDismissals.kidBId, createdAt: kidDuplicateDismissals.createdAt })
    .from(kidDuplicateDismissals)
    .orderBy(desc(kidDuplicateDismissals.createdAt));

  const allGroups = findDuplicateGroups(rows, new Set(dismissals.map((d) => pairKey(d.kidAId, d.kidBId))));
  const highGroups = allGroups.filter((g) => g.confidence === "High");
  const groups = view === "high" ? highGroups : view === "all" ? allGroups : [];
  const counts: Record<DuplicateView, number> = {
    high: highGroups.length,
    all: allGroups.length,
    hidden: dismissals.length,
  };
  const canManage = await canManageKids(session);
  const nameById = new Map(rows.map((r) => [r.id, `${capitalizeName(r.firstName)} ${capitalizeName(r.lastName)}`]));
  const dismissButtonClass =
    "text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-full px-2.5 py-1 transition whitespace-nowrap";

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
          swapped, or the same guardian number. Review each group before deleting anything. If they&apos;re really
          different kids, mark them <span className="font-semibold">Not duplicates</span> to hide them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["high", "all", "hidden"] as const).map((key) => (
          <Link
            key={key}
            href={duplicatesHref(key)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
              key === view
                ? "bg-kids-green text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {VIEW_LABELS[key]} ({counts[key]})
          </Link>
        ))}
      </div>

      {view === "hidden" ? (
        dismissals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">Nothing hidden yet.</p>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <p className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-xs text-gray-600">
              Pairs marked as not duplicates. Restore one to have it suggested again.
            </p>
            <ul>
              {dismissals.map((d) => (
                <li
                  key={`${d.kidAId}-${d.kidBId}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-0 text-sm"
                >
                  <span className="text-gray-900">
                    {nameById.get(d.kidAId)} ↔ {nameById.get(d.kidBId)}
                    <span className="block text-xs text-gray-400">Hidden {dateFormatter.format(d.createdAt)}</span>
                  </span>
                  {canManage && (
                    <form action={restoreDuplicatePair.bind(null, d.kidAId, d.kidBId)}>
                      <button type="submit" className={dismissButtonClass}>
                        Restore
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : groups.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          {view === "high" && counts.all > 0 ? (
            <>
              No high matches left. 🎉{" "}
              <Link href={duplicatesHref("all")} className="text-kids-navy font-semibold hover:underline">
                Review {counts.all} lower-confidence group{counts.all === 1 ? "" : "s"}
              </Link>
            </>
          ) : (
            "No possible duplicates found. 🎉"
          )}
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-600">
            {groups.length} group{groups.length === 1 ? "" : "s"} found
            {view === "high" && counts.all > counts.high && (
              <span className="font-normal text-gray-500">
                {" "}
                · {counts.all - counts.high} lower-confidence group{counts.all - counts.high === 1 ? "" : "s"} hidden —{" "}
                <Link href={duplicatesHref("all")} className="text-kids-navy font-semibold hover:underline">
                  show all
                </Link>
              </span>
            )}
          </p>
          {groups.map((group) => (
            <div
              key={group.members.map((m) => m.id).join("-")}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap px-4 py-3 border-b border-gray-200 bg-gray-50">
                <ul className="flex flex-col gap-1 text-xs text-gray-600">
                  {group.pairs.map((pair) => (
                    <li key={`${pair.aId}-${pair.bId}`} className="flex items-center gap-2 flex-wrap">
                      <span>
                        {group.pairs.length > 1 && (
                          <span className="font-semibold text-gray-800">
                            {nameById.get(pair.aId)} ↔ {nameById.get(pair.bId)}:{" "}
                          </span>
                        )}
                        {pair.reasons.join(" · ")}
                      </span>
                      {canManage && group.pairs.length > 1 && (
                        <form action={dismissDuplicatePairs.bind(null, [[pair.aId, pair.bId]], view)}>
                          <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 hover:underline">
                            Not a match
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${CONFIDENCE_STYLES[group.confidence]}`}>
                    {group.confidence} match
                  </span>
                  {canManage && (
                    <form
                      action={dismissDuplicatePairs.bind(
                        null,
                        group.pairs.map((p) => [p.aId, p.bId] as [number, number]),
                        view,
                      )}
                    >
                      <button type="submit" className={dismissButtonClass}>
                        Not duplicates
                      </button>
                    </form>
                  )}
                </div>
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
