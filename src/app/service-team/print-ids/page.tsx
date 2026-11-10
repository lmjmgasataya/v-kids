import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { idCardQrDataUrl } from "@/lib/qrCode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { serviceTeamPhotoUrl } from "@/lib/photoUrl";
import { PrintIdsWorkspace } from "./PrintIdsWorkspace";

export default async function ServiceTeamPrintIdsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/service-team");

  const rows = await db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      birthday: serviceTeamMembers.birthday,
      serviceAttending: serviceTeamMembers.serviceAttending,
      qrToken: serviceTeamMembers.qrToken,
      idCardNameScale: serviceTeamMembers.idCardNameScale,
      idCardPhotoZoom: serviceTeamMembers.idCardPhotoZoom,
      idCardPhotoX: serviceTeamMembers.idCardPhotoX,
      idCardPhotoY: serviceTeamMembers.idCardPhotoY,
      photoKey: serviceTeamMembers.photoKey,
      idPrinted: serviceTeamMembers.idPrinted,
    })
    .from(serviceTeamMembers)
    .orderBy(asc(serviceTeamMembers.lastName), asc(serviceTeamMembers.firstName));

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  const membersWithQr = await Promise.all(
    rows.map(async ({ photoKey, ...row }) => {
      const payload = `${proto}://${host}/check-in?token=${row.qrToken}`;
      // Level H (~30% recoverable) so the photo badge over the middle doesn't stop it scanning.
      const qrDataUrl = await idCardQrDataUrl(payload, "H");
      // A same-origin link (not an inline data URL) keeps the page payload small; same-origin
      // also means the client-side badge canvas isn't tainted, so html2canvas export still works.
      const photoUrl = photoKey ? serviceTeamPhotoUrl(row.id, photoKey, "card") : null;
      return { ...row, qrDataUrl, photoUrl };
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
