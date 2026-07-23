import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { kcBucksSettings, kcBucksTransactions } from "@/db/schema";
import { CHECKIN_CREDIT_SETTING_KEY } from "@/lib/constants";

export async function getCheckInCreditAmount(): Promise<number> {
  const [row] = await db
    .select()
    .from(kcBucksSettings)
    .where(eq(kcBucksSettings.key, CHECKIN_CREDIT_SETTING_KEY));
  return row?.value ?? 0;
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
