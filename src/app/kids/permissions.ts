import { eq } from "drizzle-orm";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import type { SessionPayload } from "@/lib/auth";
import { VOLUNTEER_MANAGE_KIDS_FLAG_KEY } from "@/lib/constants";

// Admins can always edit/delete registered kids; volunteers only when the
// flag is on. A missing row means disabled — this widens permissions, so it
// should require an explicit opt-in.
export async function canManageKids(session: SessionPayload): Promise<boolean> {
  if (session.role === "admin") return true;

  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, VOLUNTEER_MANAGE_KIDS_FLAG_KEY));
  return flag?.enabled ?? false;
}
