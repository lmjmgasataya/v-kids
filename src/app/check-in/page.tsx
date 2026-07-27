import { redirect } from "next/navigation";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { checkIns, featureFlags, kids } from "@/db/schema";
import { getManilaDayBounds } from "@/lib/checkIn";
import { SERVICE_CARDS_FLAG_KEY, SERVICE_OPTIONS } from "@/lib/constants";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckInWorkspace } from "./CheckInWorkspace";
import { RosterTable } from "./RosterTable";

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

  const [serviceCardsFlag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, SERVICE_CARDS_FLAG_KEY));
  const serviceCardsEnabled = serviceCardsFlag?.enabled ?? true;

  const { start, end } = getManilaDayBounds();

  const roster = await db
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
    .orderBy(desc(checkIns.checkedInAt));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In" }]} />

      <CheckInWorkspace
        initialToken={token}
        initialService={service}
        initialIntent={intent}
        initialMode={mode}
        serviceCardsEnabled={serviceCardsEnabled}
      />

      <div>
        <h3 className="text-lg font-bold text-kids-navy mb-3">Today&apos;s roster — {service}</h3>
        <RosterTable rows={roster} />
      </div>
    </div>
  );
}
