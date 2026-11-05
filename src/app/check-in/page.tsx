import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavTile } from "@/components/NavTile";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Every printed ID card's QR points here (/check-in?token=…), so send it on to
  // the matching kids/team check-in page. Unknown or malformed tokens go to the
  // kids page, which shows the scan error.
  const sp = await searchParams;
  if (typeof sp.token === "string") {
    const token = sp.token;
    const [member] = UUID_RE.test(token)
      ? await db.select({ id: serviceTeamMembers.id }).from(serviceTeamMembers).where(eq(serviceTeamMembers.qrToken, token))
      : [];
    redirect(`/check-in/${member ? "team" : "kids"}?token=${encodeURIComponent(token)}`);
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In" }]} />

      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Who are we checking in?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <NavTile
            href="/check-in/kids"
            icon="🧒"
            label="Kids"
            description="Check kids in and out of service"
            color="kids-green"
          />
          <NavTile
            href="/check-in/team"
            icon="🙋"
            label="Service Team"
            description="Check service team members in and out"
            color="kids-navy"
          />
        </div>
      </div>
    </div>
  );
}
