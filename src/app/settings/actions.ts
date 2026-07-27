"use server";

import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CURSOR_TRAIL_FLAG_KEY, SERVICE_CARDS_FLAG_KEY } from "@/lib/constants";
import { withToast } from "@/lib/toast";

export async function toggleCursorTrail() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, CURSOR_TRAIL_FLAG_KEY));
  const nextEnabled = !(flag?.enabled ?? true);

  await db
    .insert(featureFlags)
    .values({ key: CURSOR_TRAIL_FLAG_KEY, enabled: nextEnabled })
    .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: nextEnabled, updatedAt: new Date() } });

  // The root layout reads this flag on every request; without this, its
  // cached render can keep showing the old value until a manual reload.
  revalidatePath("/", "layout");
  redirect(withToast("/settings", "success", `Cursor trail turned ${nextEnabled ? "on" : "off"}.`));
}

export async function toggleServiceCards() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, SERVICE_CARDS_FLAG_KEY));
  const nextEnabled = !(flag?.enabled ?? true);

  await db
    .insert(featureFlags)
    .values({ key: SERVICE_CARDS_FLAG_KEY, enabled: nextEnabled })
    .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: nextEnabled, updatedAt: new Date() } });

  revalidatePath("/check-in");
  redirect(withToast("/settings", "success", `Service cards turned ${nextEnabled ? "on" : "off"}.`));
}
