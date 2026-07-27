import Link from "next/link";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getOpenCheckIn } from "@/lib/checkIn";
import { CheckInNowForm } from "./CheckInNowForm";

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const kidId = typeof sp.kidId === "string" ? Number(sp.kidId) : NaN;

  let kid: { id: number; firstName: string; serviceAttending: string } | undefined;
  let alreadyCheckedIn = false;

  if (Number.isInteger(kidId)) {
    const [row] = await db
      .select({ id: kids.id, firstName: kids.firstName, serviceAttending: kids.serviceAttending })
      .from(kids)
      .where(eq(kids.id, kidId));
    kid = row;
    if (kid) {
      alreadyCheckedIn = !!(await getOpenCheckIn(kid.id));
    }
  }

  const session = kid ? await getSession() : null;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Register", href: "/register" },
          { label: "Register a Child", href: "/register/child" },
          { label: "Success" },
        ]}
      />
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          You&apos;re all set!
        </h2>
        <p className="text-gray-500 max-w-sm">Thanks for registering. See you at Kids Church!</p>

        {kid && alreadyCheckedIn && (
          <p className="text-sm font-semibold text-kids-green bg-kids-green/10 rounded-full px-4 py-2">
            {kid.firstName} is already checked in for {kid.serviceAttending}.
          </p>
        )}

        {kid && !alreadyCheckedIn && (
          <div className="w-full max-w-sm rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-kids-navy">{kid.firstName}</span> is signed up for{" "}
              <span className="font-semibold">{kid.serviceAttending}</span> and can check in already.
            </p>
            {session ? (
              <CheckInNowForm kidId={kid.id} defaultService={kid.serviceAttending} />
            ) : (
              <p className="text-xs text-gray-500">Just visit the welcome desk to check {kid.firstName} in today.</p>
            )}
          </div>
        )}

        <Link href="/" className="text-sm font-semibold text-kids-magenta hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
