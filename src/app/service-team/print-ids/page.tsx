import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrintIdsWorkspace } from "./PrintIdsWorkspace";

export default async function ServiceTeamPrintIdsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      birthday: serviceTeamMembers.birthday,
      serviceAttending: serviceTeamMembers.serviceAttending,
      qrToken: serviceTeamMembers.qrToken,
    })
    .from(serviceTeamMembers)
    .orderBy(asc(serviceTeamMembers.lastName), asc(serviceTeamMembers.firstName));

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  const membersWithQr = await Promise.all(
    rows.map(async (row) => {
      const payload = `${proto}://${host}/check-in?token=${row.qrToken}`;
      const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 0 });
      return { ...row, qrDataUrl };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <style>{"@page { size: 85.6mm 53.98mm; margin: 0; }"}</style>

      <div className="print:hidden">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Service Team", href: "/service-team" }, { label: "Print IDs" }]}
        />
      </div>

      <PrintIdsWorkspace members={membersWithQr} />
    </div>
  );
}
