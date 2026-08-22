import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { kcBucksTransactions, users } from "@/db/schema";

const CHECKIN_CREDIT_AMOUNT = 10;

export async function getCheckInCreditAmount(): Promise<number> {
  return CHECKIN_CREDIT_AMOUNT;
}

export async function getKidBalance(kidId: number): Promise<number> {
  const [row] = await db
    .select({ balance: sql<number>`coalesce(sum(${kcBucksTransactions.amount}), 0)::int` })
    .from(kcBucksTransactions)
    .where(eq(kcBucksTransactions.kidId, kidId));
  return row?.balance ?? 0;
}

export interface KcBucksLedgerEntry {
  id: number;
  type: "checkin" | "grant" | "redemption";
  amount: number;
  reason: string;
  createdAt: Date;
}

export async function getKidTransactions(kidId: number, limit = 20): Promise<KcBucksLedgerEntry[]> {
  return db
    .select({
      id: kcBucksTransactions.id,
      type: kcBucksTransactions.type,
      amount: kcBucksTransactions.amount,
      reason: kcBucksTransactions.reason,
      createdAt: kcBucksTransactions.createdAt,
    })
    .from(kcBucksTransactions)
    .where(eq(kcBucksTransactions.kidId, kidId))
    .orderBy(desc(kcBucksTransactions.createdAt))
    .limit(limit);
}

export interface KcBucksSummaryTotals {
  checkinCredits: number; // earned automatically via check-in
  grantedCredits: number; // manually granted
  redeemedCredits: number; // spent on prizes (reported as a positive amount)
  netOutstanding: number; // total balance owed across every kid
}

export async function getKcBucksSummaryTotals(): Promise<KcBucksSummaryTotals> {
  const rows = await db
    .select({
      type: kcBucksTransactions.type,
      total: sql<number>`coalesce(sum(${kcBucksTransactions.amount}), 0)::int`,
    })
    .from(kcBucksTransactions)
    .groupBy(kcBucksTransactions.type);

  const byType = new Map(rows.map((row) => [row.type, row.total]));
  const checkinCredits = byType.get("checkin") ?? 0;
  const grantedCredits = byType.get("grant") ?? 0;
  const redeemedCredits = -(byType.get("redemption") ?? 0);

  return {
    checkinCredits,
    grantedCredits,
    redeemedCredits,
    netOutstanding: checkinCredits + grantedCredits - redeemedCredits,
  };
}

export interface KcBucksReasonBreakdown {
  reason: string;
  count: number;
  amount: number;
}

export async function getKcBucksGrantsByReason(limit = 10): Promise<KcBucksReasonBreakdown[]> {
  const amountExpr = sql<number>`sum(${kcBucksTransactions.amount})::int`;
  return db
    .select({ reason: kcBucksTransactions.reason, count: sql<number>`count(*)::int`, amount: amountExpr })
    .from(kcBucksTransactions)
    .where(eq(kcBucksTransactions.type, "grant"))
    .groupBy(kcBucksTransactions.reason)
    .orderBy(desc(amountExpr))
    .limit(limit);
}

export async function getKcBucksRedemptionsByReason(limit = 10): Promise<KcBucksReasonBreakdown[]> {
  const amountExpr = sql<number>`sum(abs(${kcBucksTransactions.amount}))::int`;
  return db
    .select({ reason: kcBucksTransactions.reason, count: sql<number>`count(*)::int`, amount: amountExpr })
    .from(kcBucksTransactions)
    .where(eq(kcBucksTransactions.type, "redemption"))
    .groupBy(kcBucksTransactions.reason)
    .orderBy(desc(amountExpr))
    .limit(limit);
}

export interface KcBucksStaffBreakdown {
  userId: number | null;
  name: string;
  count: number;
  amount: number;
}

export async function getKcBucksGrantsByStaff(limit = 10): Promise<KcBucksStaffBreakdown[]> {
  const amountExpr = sql<number>`sum(${kcBucksTransactions.amount})::int`;
  const nameExpr = sql<string>`coalesce(${users.name}, 'Unknown staff')`;
  return db
    .select({ userId: kcBucksTransactions.createdBy, name: nameExpr, count: sql<number>`count(*)::int`, amount: amountExpr })
    .from(kcBucksTransactions)
    .leftJoin(users, eq(users.id, kcBucksTransactions.createdBy))
    .where(eq(kcBucksTransactions.type, "grant"))
    .groupBy(kcBucksTransactions.createdBy, users.name)
    .orderBy(desc(amountExpr))
    .limit(limit);
}
