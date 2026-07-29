import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrintIdsWorkspace } from "./PrintIdsWorkspace";

export default async function PrintIdsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      gender: kids.gender,
      serviceAttending: kids.serviceAttending,
      qrToken: kids.qrToken,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id))
    .orderBy(asc(kids.lastName), asc(kids.firstName));

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  const kidsWithQr = await Promise.all(
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
          items={[{ label: "Home", href: "/" }, { label: "Registered Kids", href: "/kids" }, { label: "Print IDs" }]}
        />
      </div>

      <PrintIdsWorkspace kids={kidsWithQr} />
    </div>
  );
}
