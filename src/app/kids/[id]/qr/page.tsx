import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LogoMark } from "@/components/LogoMark";
import { PrintButton } from "./PrintButton";

export default async function KidQrPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const [row] = await db
    .select({ firstName: kids.firstName, lastName: kids.lastName, nickname: kids.nickname, qrToken: kids.qrToken })
    .from(kids)
    .where(eq(kids.id, kidId));

  if (!row) notFound();

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const payload = `${proto}://${host}/check-in?token=${row.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 1 });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Registered Kids", href: "/kids" },
          { label: `${row.firstName} ${row.lastName}` },
        ]}
      />
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto text-center py-6">
        <LogoMark size={48} />
        <div>
          <h2 className="text-2xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
            {row.firstName} {row.lastName}
          </h2>
          {row.nickname && <p className="text-sm text-gray-500">&quot;{row.nickname}&quot;</p>}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Check-in QR code" width={320} height={320} className="rounded-2xl border border-gray-200" />
        <p className="text-xs text-gray-400 break-all">{row.qrToken}</p>
        <PrintButton />
      </div>
    </div>
  );
}
