"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { featureFlags, registrationLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTO_CHECK_IN_FLAG_KEY, CURSOR_TRAIL_FLAG_KEY, SERVICE_CARDS_FLAG_KEY, type RegistrationFormType } from "@/lib/constants";
import { withToast } from "@/lib/toast";

const REGISTRATION_FORM_LABEL: Record<RegistrationFormType, string> = {
  child: "Child registration",
  team: "Service team registration",
};

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

export async function toggleAutoCheckIn() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, AUTO_CHECK_IN_FLAG_KEY));
  // Unlike the other flags, a missing row means disabled — this one skips the
  // check-in confirmation step, so it should require an explicit opt-in.
  const nextEnabled = !(flag?.enabled ?? false);

  await db
    .insert(featureFlags)
    .values({ key: AUTO_CHECK_IN_FLAG_KEY, enabled: nextEnabled })
    .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: nextEnabled, updatedAt: new Date() } });

  revalidatePath("/check-in");
  redirect(withToast("/settings", "success", `Auto check-in turned ${nextEnabled ? "on" : "off"}.`));
}

export async function generateRegistrationLink(formType: RegistrationFormType, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const label = REGISTRATION_FORM_LABEL[formType];
  const expiresAtRaw = formData.get("expiresAt");
  const expiresAt = typeof expiresAtRaw === "string" ? new Date(expiresAtRaw) : null;

  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    redirect(withToast("/settings", "error", "Please choose a valid expiration date and time."));
  }
  if (expiresAt.getTime() <= Date.now()) {
    redirect(withToast("/settings", "error", "Expiration must be in the future."));
  }

  const token = randomUUID();

  await db
    .insert(registrationLinks)
    .values({ formType, token, expiresAt })
    .onConflictDoUpdate({ target: registrationLinks.formType, set: { token, expiresAt, updatedAt: new Date() } });

  revalidatePath("/settings");
  redirect(withToast("/settings", "success", `${label} link generated.`));
}

export async function deleteRegistrationLink(formType: RegistrationFormType) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const label = REGISTRATION_FORM_LABEL[formType];

  await db.delete(registrationLinks).where(eq(registrationLinks.formType, formType));

  revalidatePath("/settings");
  redirect(withToast("/settings", "success", `${label} link deleted.`));
}
