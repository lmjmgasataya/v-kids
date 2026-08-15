import { eq } from "drizzle-orm";
import { db } from "@/db";
import { registrationLinks } from "@/db/schema";
import type { RegistrationFormType } from "@/lib/constants";

/** Returns the active link row for a form type only if the given token matches and hasn't expired. */
export async function getValidRegistrationLink(formType: RegistrationFormType, token: string) {
  const [link] = await db.select().from(registrationLinks).where(eq(registrationLinks.formType, formType));
  if (!link || link.token !== token || link.expiresAt.getTime() <= Date.now()) return null;
  return link;
}
