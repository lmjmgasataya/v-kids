import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CURSOR_TRAIL_FLAG_KEY } from "@/lib/constants";
import { toggleCursorTrail } from "./actions";
import { ToggleSwitch } from "@/components/ToggleSwitch";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, CURSOR_TRAIL_FLAG_KEY));
  const enabled = flag?.enabled ?? true;

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
