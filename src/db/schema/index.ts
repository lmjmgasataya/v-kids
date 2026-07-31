import { pgTable, pgEnum, serial, text, boolean, timestamp, integer, uuid, uniqueIndex, index, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["admin", "volunteer"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("volunteer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  userId: integer("user_id").references(() => users.id),
  success: boolean("success").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const genderEnum = pgEnum("gender", ["Male", "Female"]);

export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  gender: genderEnum("gender").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kids = pgTable("kids", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickname: text("nickname"),
  age: integer("age").notNull(),
  gender: genderEnum("gender").notNull(),
  serviceAttending: text("service_attending").notNull(),
  guardianId: integer("guardian_id")
    .references(() => guardians.id)
    .notNull(),
  qrToken: uuid("qr_token").defaultRandom().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkIns = pgTable(
  "check_ins",
  {
    id: serial("id").primaryKey(),
    kidId: integer("kid_id")
      .references(() => kids.id)
      .notNull(),
    serviceAttending: text("service_attending").notNull(),
    checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
    checkedOutAt: timestamp("checked_out_at"),
    remarks: text("remarks"),
    checkedInBy: integer("checked_in_by").references(() => users.id),
    checkedOutBy: integer("checked_out_by").references(() => users.id),
  },
  (t) => [uniqueIndex("check_ins_open_kid_idx").on(t.kidId).where(sql`${t.checkedOutAt} is null`)]
);

export const serviceTeamMembers = pgTable("service_team_members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickname: text("nickname"),
  gender: genderEnum("gender"),
  birthday: date("birthday").notNull(),
  serviceAttending: text("service_attending").notNull(),
  photoKey: text("photo_key"),
  qrToken: uuid("qr_token").defaultRandom().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kcBucksTransactionTypeEnum = pgEnum("kc_bucks_transaction_type", ["checkin", "grant", "redemption"]);

export const kcBucksSettings = pgTable("kc_bucks_settings", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kcBucksTransactions = pgTable(
  "kc_bucks_transactions",
  {
    id: serial("id").primaryKey(),
    kidId: integer("kid_id")
      .references(() => kids.id)
      .notNull(),
    type: kcBucksTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    checkInId: integer("check_in_id").references(() => checkIns.id),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Covers getKidBalance (equality on kidId) and getKidTransactions (kidId + order by createdAt desc)
    index("kc_bucks_transactions_kid_created_idx").on(t.kidId, t.createdAt.desc()),
    // Covers the check-in delete/checkout lookup by checkInId
    index("kc_bucks_transactions_check_in_idx").on(t.checkInId),
  ]
);

export type User = typeof users.$inferSelect;
export type LoginLog = typeof loginLogs.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type ServiceTeamMember = typeof serviceTeamMembers.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type KcBucksSettings = typeof kcBucksSettings.$inferSelect;
export type KcBucksTransaction = typeof kcBucksTransactions.$inferSelect;
