import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { checkIns, kids, serviceTeamCheckIns, serviceTeamMembers } from "@/db/schema";
import { isFlagEnabled } from "@/lib/featureFlags";
import {
  getCheckInDirectory,
  getManilaDayBounds,
  getManilaDayBoundsForDateString,
  getStaleOpenCheckIns,
  type CheckInPersonKind,
} from "@/lib/checkIn";
import { AUTO_CHECK_IN_FLAG_KEY, AUTO_CHECK_OUT_FLAG_KEY, SERVICE_CARDS_FLAG_KEY, SERVICE_OPTIONS } from "@/lib/constants";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckInWorkspace } from "./CheckInWorkspace";
import type { RosterRow } from "./RosterTable";
import { CHECK_IN_KIND_LABELS } from "./labels";

const fullDateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeZone: "Asia/Manila" });

// Today's check-ins across every service — the workspace filters by the selected service
// client-side, so switching services doesn't need a server render.
function getRoster(kind: CheckInPersonKind, start: Date, end: Date): Promise<RosterRow[]> {
  if (kind === "team") {
    return db
      .select({
        id: serviceTeamCheckIns.id,
        personId: serviceTeamCheckIns.memberId,
        firstName: serviceTeamMembers.firstName,
        lastName: serviceTeamMembers.lastName,
        nickname: serviceTeamMembers.nickname,
        serviceAttending: serviceTeamCheckIns.serviceAttending,
        checkedInAt: serviceTeamCheckIns.checkedInAt,
        checkedOutAt: serviceTeamCheckIns.checkedOutAt,
        remarks: serviceTeamCheckIns.remarks,
      })
      .from(serviceTeamCheckIns)
      .innerJoin(serviceTeamMembers, eq(serviceTeamCheckIns.memberId, serviceTeamMembers.id))
      .where(and(gte(serviceTeamCheckIns.checkedInAt, start), lt(serviceTeamCheckIns.checkedInAt, end)))
      .orderBy(desc(serviceTeamCheckIns.checkedInAt))
      .then((rows) => rows.map((row) => ({ ...row, age: null })));
  }
  return db
    .select({
      id: checkIns.id,
      personId: checkIns.kidId,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      serviceAttending: checkIns.serviceAttending,
      checkedInAt: checkIns.checkedInAt,
      checkedOutAt: checkIns.checkedOutAt,
      remarks: checkIns.remarks,
    })
    .from(checkIns)
    .innerJoin(kids, eq(checkIns.kidId, kids.id))
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)))
    .orderBy(desc(checkIns.checkedInAt));
}

// Shared body of /check-in/kids and /check-in/team — same flow, but each only
// sees (and can scan/search) its own kind of person.
export async function CheckInScreen({
  kind,
  searchParams,
}: {
  kind: CheckInPersonKind;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  const service = typeof sp.service === "string" && SERVICE_OPTIONS.includes(sp.service) ? sp.service : SERVICE_OPTIONS[0];
  const intent = sp.intent === "checkout" ? "checkout" : "checkin";
  const mode = sp.mode === "scan" ? "scan" : "search";

  const { start, end } = getManilaDayBounds();

  // All of these reads are independent of each other — run them concurrently
  // instead of round-tripping to the DB one at a time.
  const [serviceCardsEnabled, autoCheckInEnabled, autoCheckOutEnabled, directory, staleOpenCheckIns, roster] =
    await Promise.all([
      isFlagEnabled(SERVICE_CARDS_FLAG_KEY),
      isFlagEnabled(AUTO_CHECK_IN_FLAG_KEY),
      isFlagEnabled(AUTO_CHECK_OUT_FLAG_KEY),
      getCheckInDirectory(kind, start, end),
      // Forgotten checkouts are only tracked for kids.
      kind === "kid" ? getStaleOpenCheckIns(start) : Promise.resolve([]),
      getRoster(kind, start, end),
    ]);

  const staleOpenCount = staleOpenCheckIns.reduce((sum, day) => sum + day.count, 0);
  const label = CHECK_IN_KIND_LABELS[kind];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In", href: "/check-in" }, { label }]} />

      {staleOpenCount > 0 && (
        <div className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-kids-magenta">
            ⚠ {staleOpenCount} kid{staleOpenCount === 1 ? "" : "s"} still not checked out from a previous day.
          </p>
          <div className="flex flex-col gap-1">
            {staleOpenCheckIns.map((day) => {
              const dayStart = getManilaDayBoundsForDateString(day.date).start;
              return (
                <Link
                  key={day.date}
                  href={`/attendance?month=${day.date.slice(0, 7)}&date=${day.date}`}
                  className="text-sm text-kids-navy font-medium hover:underline"
                >
                  {day.count} kid{day.count === 1 ? "" : "s"} from {fullDateFormatter.format(dayStart)} →
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <CheckInWorkspace
        kind={kind}
        initialToken={token}
        initialService={service}
        initialIntent={intent}
        initialMode={mode}
        serviceCardsEnabled={serviceCardsEnabled}
        autoCheckInEnabled={autoCheckInEnabled}
        autoCheckOutEnabled={autoCheckOutEnabled}
        today={fullDateFormatter.format(start)}
        directory={directory}
        roster={roster}
      />
    </div>
  );
}
