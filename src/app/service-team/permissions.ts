import type { SessionPayload } from "@/lib/auth";
import { VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY } from "@/lib/constants";
import { isFlagEnabled } from "@/lib/featureFlags";

// Admins can always edit/delete service team members; volunteers only when
// the flag is on. A missing row means disabled — this widens permissions, so
// it should require an explicit opt-in.
export async function canManageServiceTeam(session: SessionPayload): Promise<boolean> {
  if (session.role === "admin") return true;
  return isFlagEnabled(VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY);
}
