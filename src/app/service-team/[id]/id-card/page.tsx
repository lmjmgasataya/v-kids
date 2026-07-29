import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IdCardViewer } from "@/components/IdCardViewer";

export default async function ServiceTeamIdCardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) notFound();

  const [row] = await db
    .select({
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      qrToken: serviceTeamMembers.qrToken,
    })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.id, memberId));

  if (!row) notFound();

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const payload = `${proto}://${host}/check-in?token=${row.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 0 });

  const fullName = `${row.firstName} ${row.lastName}`;
  const displayName = row.nickname?.trim() || row.firstName;

  return (
    <div>
      <style>{"@page { size: 85.6mm 53.98mm; margin: 0; }"}</style>

      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Service Team", href: "/service-team" },
            { label: fullName },
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-6 py-6 print:gap-0 print:py-0 print:-mx-4 print:-my-8">
        <h2 className="text-2xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)] print:hidden">
          ID Card
        </h2>

        <IdCardViewer
          displayName={displayName}
          fullName={fullName}
          qrDataUrl={qrDataUrl}
          fileBaseName={fullName}
        />
      </div>
    </div>
  );
}
