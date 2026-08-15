import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { featureFlags, registrationLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CURSOR_TRAIL_FLAG_KEY, SERVICE_CARDS_FLAG_KEY } from "@/lib/constants";
import { toggleCursorTrail, toggleServiceCards, generateRegistrationLink, deleteRegistrationLink } from "./actions";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { RegistrationLinkCard } from "@/components/RegistrationLinkCard";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, CURSOR_TRAIL_FLAG_KEY));
  const enabled = flag?.enabled ?? true;

  const [serviceCardsFlag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, SERVICE_CARDS_FLAG_KEY));
  const serviceCardsEnabled = serviceCardsFlag?.enabled ?? true;

  const links = await db.select().from(registrationLinks);
  const childLink = links.find((l) => l.formType === "child");
  const teamLink = links.find((l) => l.formType === "team");

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = `${proto}://${host}`;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Settings</h2>
      <p className="text-sm text-gray-500 -mt-4">These settings apply for everyone using the app.</p>

      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Cursor trail effect</p>
          <p className="text-sm text-gray-500">Colorful dots that follow the mouse cursor across the app.</p>
        </div>
        <form action={toggleCursorTrail} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 w-8 text-right">{enabled ? "On" : "Off"}</span>
          <ToggleSwitch enabled={enabled} />
        </form>
      </div>

      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Service cards on Check-In</p>
          <p className="text-sm text-gray-500">Show the service picker as a row of cards instead of a dropdown.</p>
        </div>
        <form action={toggleServiceCards} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 w-8 text-right">
            {serviceCardsEnabled ? "On" : "Off"}
          </span>
          <ToggleSwitch enabled={serviceCardsEnabled} />
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Shareable registration links
        </h3>
        <p className="text-sm text-gray-500 -mt-2">
          Generate a public link for each form that stops working after it expires — hand it out for a specific
          event without leaving registration open forever.
        </p>

        <RegistrationLinkCard
          title="Child registration"
          description="Public link to the child + guardian sign-up form."
          url={childLink ? `${origin}/register/child/link/${childLink.token}` : null}
          expiresAt={childLink?.expiresAt.toISOString() ?? null}
          action={generateRegistrationLink.bind(null, "child")}
          deleteAction={deleteRegistrationLink.bind(null, "child")}
        />

        <RegistrationLinkCard
          title="Service team registration"
          description="Public link to the service team member sign-up form."
          url={teamLink ? `${origin}/register/team/link/${teamLink.token}` : null}
          expiresAt={teamLink?.expiresAt.toISOString() ?? null}
          action={generateRegistrationLink.bind(null, "team")}
          deleteAction={deleteRegistrationLink.bind(null, "team")}
        />
      </div>

      <Link
        href="/settings/users"
        className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex items-center justify-between gap-4 hover:border-kids-navy/40 transition"
      >
        <div>
          <p className="font-semibold text-gray-900">Manage users</p>
          <p className="text-sm text-gray-500">Add, edit, or remove staff accounts.</p>
        </div>
        <span className="text-kids-navy font-semibold">→</span>
      </Link>
    </div>
  );
}
