import {
  guardians,
  kids,
  checkIns,
  kcBucksTransactions,
  kcBucksSettings,
  serviceTeamMembers,
  users,
  loginLogs,
  featureFlags,
  registrationLinks,
} from "@/db/schema";
import type { PgTable } from "drizzle-orm/pg-core";

export interface DevopsTable {
  /** ?table= key for /api/devops-admin/export — the pg table name. */
  key: string;
  label: string;
  table: PgTable;
  /** Columns (Drizzle property names) left out of the CSV export — secrets. */
  omit?: string[];
}

/**
 * Every table in the public schema, grouped by the area of the app that owns it. Drives the
 * Data page (row counts + CSV export), the export route and the Database size list on the
 * /devops-admin overview. Add a new table here when it's added to the schema.
 */
export const DEVOPS_TABLE_GROUPS: { area: string; tables: DevopsTable[] }[] = [
  {
    area: "Registered Kids",
    tables: [
      { key: "kids", label: "Kids", table: kids },
      { key: "guardians", label: "Guardians", table: guardians },
    ],
  },
  {
    area: "Check-In & Attendance",
    tables: [{ key: "check_ins", label: "Check-ins", table: checkIns }],
  },
  {
    area: "KC Bucks",
    tables: [
      { key: "kc_bucks_transactions", label: "KC Bucks Transactions", table: kcBucksTransactions },
      { key: "kc_bucks_settings", label: "KC Bucks Settings", table: kcBucksSettings },
    ],
  },
  {
    area: "Service Team",
    tables: [{ key: "service_team_members", label: "Service Team Members", table: serviceTeamMembers }],
  },
  {
    area: "Staff & Settings",
    tables: [
      { key: "users", label: "Users (no passwords)", table: users, omit: ["passwordHash"] },
      { key: "login_logs", label: "Login Logs", table: loginLogs },
      { key: "feature_flags", label: "Feature Flags", table: featureFlags },
      // A live token opens the public registration form until it expires.
      { key: "registration_links", label: "Registration Links (no tokens)", table: registrationLinks, omit: ["token"] },
    ],
  },
];

export const DEVOPS_TABLES: DevopsTable[] = DEVOPS_TABLE_GROUPS.flatMap((g) => g.tables);
