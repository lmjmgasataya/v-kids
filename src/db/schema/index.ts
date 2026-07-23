import { pgTable, pgEnum, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type LoginLog = typeof loginLogs.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
