import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { checkIns, featureFlags, kids } from "@/db/schema";
import {
  getCheckInDirectory,
  getManilaDayBounds,
  getManilaDayBoundsForDateString,
  getStaleOpenCheckIns,
} from "@/lib/checkIn";
import { AUTO_CHECK_IN_FLAG_KEY, AUTO_CHECK_OUT_FLAG_KEY, SERVICE_CARDS_FLAG_KEY, SERVICE_OPTIONS } from "@/lib/constants";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckInWorkspace } from "./CheckInWorkspace";
import { CheckOutAllButton } from "./CheckOutAllButton";
import { RosterTable } from "./RosterTable";

const fullDateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeZone: "Asia/Manila" });

export default async function CheckInPage({
  searchParams,
}: {
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
  const [[serviceCardsFlag], [autoCheckInFlag], [autoCheckOutFlag], directory, staleOpenCheckIns, roster] = await Promise.all([
    db.select().from(featureFlags).where(eq(featureFlags.key, SERVICE_CARDS_FLAG_KEY)),
    db.select().from(featureFlags).where(eq(featureFlags.key, AUTO_CHECK_IN_FLAG_KEY)),
    db.select().from(featureFlags).where(eq(featureFlags.key, AUTO_CHECK_OUT_FLAG_KEY)),
    getCheckInDirectory(start, end),
    getStaleOpenCheckIns(start),
    db
      .select({
        id: checkIns.id,
        kidFirstName: kids.firstName,
        kidLastName: kids.lastName,
        kidNickname: kids.nickname,
        kidAge: kids.age,
        serviceAttending: checkIns.serviceAttending,
        checkedInAt: checkIns.checkedInAt,
        checkedOutAt: checkIns.checkedOutAt,
        remarks: checkIns.remarks,
      })
      .from(checkIns)
      .innerJoin(kids, eq(checkIns.kidId, kids.id))
      .where(
        and(
          gte(checkIns.checkedInAt, start),
          lt(checkIns.checkedInAt, end),
          eq(checkIns.serviceAttending, service)
        )
      )
      .orderBy(desc(checkIns.checkedInAt)),
  ]);
  const serviceCardsEnabled = serviceCardsFlag?.enabled ?? true;
  const autoCheckInEnabled = autoCheckInFlag?.enabled ?? false;
  const autoCheckOutEnabled = autoCheckOutFlag?.enabled ?? false;

  const stillOpenCount = roster.filter((row) => !row.checkedOutAt).length;
  const staleOpenCount = staleOpenCheckIns.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In" }]} />

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
        initialToken={token}
        initialService={service}
        initialIntent={intent}
        initialMode={mode}
        serviceCardsEnabled={serviceCardsEnabled}
        autoCheckInEnabled={autoCheckInEnabled}
        autoCheckOutEnabled={autoCheckOutEnabled}
        today={fullDateFormatter.format(start)}
        directory={directory}
      />

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-kids-navy">Today&apos;s roster — {service}</h3>
          <CheckOutAllButton service={service} count={stillOpenCount} />
        </div>
        <RosterTable rows={roster} />
      </div>
    </div>
  );
}
