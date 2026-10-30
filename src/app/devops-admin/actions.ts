"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { withToast } from "@/lib/toast";
import { isKnownFlag, toggleFeatureFlag } from "@/lib/featureFlags";

export async function toggleFlag(key: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  // The key is a bound arg, so it comes back from the client — only touch flags the
  // code reads or rows that already exist, never create arbitrary keys.
  if (!isKnownFlag(key)) {
    const [row] = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
    if (!row) redirect(withToast("/devops-admin", "error", `Unknown flag "${key}".`));
  }

  const nextEnabled = await toggleFeatureFlag(key);
  revalidatePath("/settings");
  redirect(withToast("/devops-admin", "success", `${key} turned ${nextEnabled ? "on" : "off"}.`));
}

export async function deleteFlag(key: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  // Deleting a flag the code reads would silently reset it to its default — toggle it instead.
  if (isKnownFlag(key)) {
    redirect(withToast("/devops-admin", "warning", `${key} is read by the code and can't be deleted.`));
  }

  await db.delete(featureFlags).where(eq(featureFlags.key, key));
  revalidatePath("/devops-admin");
  redirect(withToast("/devops-admin", "success", `Flag "${key}" deleted.`));
}
