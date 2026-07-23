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

const brandStripe = (
  <div className="h-[3mm] flex shrink-0">
    <div className="flex-1 bg-kids-magenta" />
    <div className="flex-1 bg-kids-navy" />
    <div className="flex-1 bg-kids-green" />
    <div className="flex-1 bg-kids-yellow" />
  </div>
);

function IdCardFront({ displayName, fullName }: { displayName: string; fullName: string }) {
  return (
    <div className="w-[85.6mm] h-[54mm] bg-white rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300 overflow-hidden flex flex-col break-after-page">
      <div className="flex items-center gap-1.5 px-[5mm] pt-[3.5mm]">
        <LogoMark size={22} />
        <span className="text-[7px] font-bold tracking-widest text-kids-navy uppercase font-[family-name:var(--font-fredoka)]">
          Kids Church
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[4mm] gap-1">
        <div className="text-[26px] leading-tight font-bold text-kids-navy font-[family-name:var(--font-fredoka)] break-words">
          {displayName}
        </div>
        <div className="text-[9px] text-gray-500">{fullName}</div>
      </div>
      {brandStripe}
    </div>
  );
}

function IdCardBack({ qrDataUrl, fullName }: { qrDataUrl: string; fullName: string }) {
  return (
    <div className="w-[85.6mm] h-[54mm] bg-white rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300 overflow-hidden flex flex-col">
      {brandStripe}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Check-in QR code" className="w-[28mm] h-[28mm]" />
        <div className="text-[7px] text-gray-500 text-center px-[4mm]">Scan to check in / out · {fullName}</div>
      </div>
    </div>
  );
}

export default async function KidIdCardPage({ params }: { params: Promise<{ id: string }> }) {
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
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 0 });

  const fullName = `${row.firstName} ${row.lastName}`;
  const displayName = row.nickname?.trim() || row.firstName;

  return (
    <div>
      <style>{"@page { size: 85.6mm 54mm; margin: 0; }"}</style>

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

        <IdCardFront displayName={displayName} fullName={fullName} />
        <IdCardBack qrDataUrl={qrDataUrl} fullName={fullName} />

        <PrintButton />
      </div>
    </div>
  );
}
