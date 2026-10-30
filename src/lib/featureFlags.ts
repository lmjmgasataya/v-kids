import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import {
  AUTO_CHECK_IN_FLAG_KEY,
  AUTO_CHECK_OUT_FLAG_KEY,
  CURSOR_TRAIL_FLAG_KEY,
  SERVICE_CARDS_FLAG_KEY,
  VOLUNTEER_MANAGE_KIDS_FLAG_KEY,
  VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY,
} from "@/lib/constants";

export interface FlagDefinition {
  key: string;
  label: string;
  /**
   * What a missing row means. Must match the `flag?.enabled ?? <default>` fallback
   * used where the code reads the flag.
   */
  defaultEnabled: boolean;
  /** Path to revalidate after a toggle so the reader picks up the new value. */
  revalidate: { path: string; type?: "layout" | "page" };
}

/**
 * Every flag the code reads, grouped by the area of the app it affects. Drives the
 * toggles on /devops-admin (and the shared toggle logic used by /settings). Add a new
 * flag here when the code starts reading it — DB flags not listed here show under "Other".
 */
export const FLAG_GROUPS: { area: string; flags: FlagDefinition[] }[] = [
  {
    area: "Whole app",
    flags: [
      {
        key: CURSOR_TRAIL_FLAG_KEY,
        label: "Cursor trail — colorful dots that follow the mouse",
        defaultEnabled: true,
        // The root layout reads this flag on every request.
        revalidate: { path: "/", type: "layout" },
      },
    ],
  },
  {
    area: "Check-In",
    flags: [
      {
        key: SERVICE_CARDS_FLAG_KEY,
        label: "Service picker as a row of cards instead of a dropdown",
        defaultEnabled: true,
        revalidate: { path: "/check-in" },
      },
      {
        key: AUTO_CHECK_IN_FLAG_KEY,
        label: "Auto check-in — skip the confirmation card on scan / tap",
        defaultEnabled: false,
        revalidate: { path: "/check-in" },
      },
      {
        key: AUTO_CHECK_OUT_FLAG_KEY,
        label: "Auto check-out — skip the confirmation card on scan / tap",
        defaultEnabled: false,
        revalidate: { path: "/check-in" },
      },
    ],
  },
  {
    area: "Registered Kids",
    flags: [
      {
        key: VOLUNTEER_MANAGE_KIDS_FLAG_KEY,
        label: "Volunteers can edit / delete registered kids",
        defaultEnabled: false,
        revalidate: { path: "/kids", type: "layout" },
      },
    ],
  },
  {
    area: "Service Team",
    flags: [
      {
        key: VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY,
        label: "Volunteers can edit / delete service team members",
        defaultEnabled: false,
        revalidate: { path: "/service-team", type: "layout" },
      },
    ],
  },
];

const FLAGS_BY_KEY = new Map(FLAG_GROUPS.flatMap((g) => g.flags.map((f) => [f.key, f] as const)));

export function isKnownFlag(key: string): boolean {
  return FLAGS_BY_KEY.has(key);
}

/** A flag's effective state, applying the same missing-row default the code uses. */
export function flagEnabled(key: string, row: { enabled: boolean } | undefined): boolean {
  // Unknown flags fall back to the column default (true); they only show up when a row exists anyway.
  return row?.enabled ?? FLAGS_BY_KEY.get(key)?.defaultEnabled ?? true;
}

/**
 * Flips a flag and returns its new state. An upsert, since the row may not exist yet
 * on first toggle. Callers must check the session is an admin first.
 */
export async function toggleFeatureFlag(key: string): Promise<boolean> {
  const [row] = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
  const nextEnabled = !flagEnabled(key, row);

  await db
    .insert(featureFlags)
    .values({ key, enabled: nextEnabled })
    .onConflictDoUpdate({ target: featureFlags.key, set: { enabled: nextEnabled, updatedAt: new Date() } });

  const { path, type } = FLAGS_BY_KEY.get(key)?.revalidate ?? { path: "/", type: "layout" as const };
  revalidatePath(path, type);
  return nextEnabled;
}
