import { redirect } from "next/navigation";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { checkIns, kids } from "@/db/schema";
import { getManilaDayBounds } from "@/lib/checkIn";
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

  const { start, end } = getManilaDayBounds();

  const roster = await db
    .select({
      id: checkIns.id,
      kidFirstName: kids.firstName,
      kidLastName: kids.lastName,
      kidNickname: kids.nickname,
      serviceAttending: checkIns.serviceAttending,
      checkedInAt: checkIns.checkedInAt,
      checkedOutAt: checkIns.checkedOutAt,
      remarks: checkIns.remarks,
    })
    .from(checkIns)
    .innerJoin(kids, eq(checkIns.kidId, kids.id))
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)))
    .orderBy(desc(checkIns.checkedInAt));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Check-In</h2>

      <CheckInWorkspace initialToken={token} />

      <div>
        <h3 className="text-lg font-bold text-kids-navy mb-3">Today&apos;s roster</h3>
        <RosterTable rows={roster} />
      </div>
    </div>
  );
}
