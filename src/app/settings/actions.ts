"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { registrationLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AUTO_CHECK_IN_FLAG_KEY,
  AUTO_CHECK_OUT_FLAG_KEY,
  CURSOR_TRAIL_FLAG_KEY,
  SERVICE_CARDS_FLAG_KEY,
  VOLUNTEER_MANAGE_KIDS_FLAG_KEY,
  VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY,
  type RegistrationFormType,
} from "@/lib/constants";
import { withToast } from "@/lib/toast";
import { toggleFeatureFlag } from "@/lib/featureFlags";

const REGISTRATION_FORM_LABEL: Record<RegistrationFormType, string> = {
  child: "Child registration",
  team: "Service team registration",
};

// Each flag's missing-row default and the path to revalidate live in FLAG_GROUPS
// (src/lib/featureFlags.ts), shared with the toggles on /devops-admin.
export async function toggleCursorTrail() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(CURSOR_TRAIL_FLAG_KEY);
  redirect(withToast("/settings", "success", `Cursor trail turned ${nextEnabled ? "on" : "off"}.`));
}

export async function toggleServiceCards() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(SERVICE_CARDS_FLAG_KEY);
  redirect(withToast("/settings", "success", `Service cards turned ${nextEnabled ? "on" : "off"}.`));
}

export async function toggleAutoCheckIn() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(AUTO_CHECK_IN_FLAG_KEY);
  redirect(withToast("/settings", "success", `Auto check-in turned ${nextEnabled ? "on" : "off"}.`));
}

export async function toggleAutoCheckOut() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(AUTO_CHECK_OUT_FLAG_KEY);
  redirect(withToast("/settings", "success", `Auto check-out turned ${nextEnabled ? "on" : "off"}.`));
}

export async function toggleVolunteerManageServiceTeam() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY);
  redirect(
    withToast("/settings", "success", `Volunteer edit/delete of service team turned ${nextEnabled ? "on" : "off"}.`)
  );
}

export async function toggleVolunteerManageKids() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const nextEnabled = await toggleFeatureFlag(VOLUNTEER_MANAGE_KIDS_FLAG_KEY);
  redirect(withToast("/settings", "success", `Volunteer edit/delete of kids turned ${nextEnabled ? "on" : "off"}.`));
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
