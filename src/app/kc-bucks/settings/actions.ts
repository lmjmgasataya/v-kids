"use server";

import { db } from "@/db";
import { kcBucksSettings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CHECKIN_CREDIT_SETTING_KEY } from "@/lib/constants";
import { withToast } from "@/lib/toast";

export async function setCheckInCreditAmount(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const raw = Number(formData.get("amount"));
  const amount = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;

  await db
    .insert(kcBucksSettings)
    .values({ key: CHECKIN_CREDIT_SETTING_KEY, value: amount })
    .onConflictDoUpdate({ target: kcBucksSettings.key, set: { value: amount, updatedAt: new Date() } });

  revalidatePath("/kc-bucks/settings");
  redirect(withToast("/kc-bucks/settings", "success", "Credit settings saved."));
}
