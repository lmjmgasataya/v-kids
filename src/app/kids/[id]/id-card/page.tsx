import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IdCardViewer } from "@/components/IdCardViewer";
import { capitalizeName, idCardDisplayName } from "@/lib/format";

export default async function KidIdCardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const [row] = await db
    .select({
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      qrToken: kids.qrToken,
      idCardNameScale: kids.idCardNameScale,
    })
    .from(kids)
    .where(eq(kids.id, kidId));

  if (!row) notFound();

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const payload = `${proto}://${host}/check-in?token=${row.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 0 });

  const fullName = `${capitalizeName(row.firstName)} ${capitalizeName(row.lastName)}`;
  const displayName = idCardDisplayName(row.firstName, row.nickname);

  return (
    <div>
      <style>{"@page { size: 85.6mm 53.98mm; margin: 0; }"}</style>

      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Registered Kids", href: "/kids" },
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
          kidId={kidId}
          initialNameScale={row.idCardNameScale}
        />
      </div>
    </div>
  );
}
