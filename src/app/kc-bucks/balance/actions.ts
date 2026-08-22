"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getKidBalance, getKidTransactions, type KcBucksLedgerEntry } from "@/lib/kcBucks";
import { revalidatePath } from "next/cache";

export interface KidBalanceSummary {
  balance: number;
  transactions: KcBucksLedgerEntry[];
}

export async function getKidBalanceSummary(kidId: number): Promise<KidBalanceSummary | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const [balance, transactions] = await Promise.all([getKidBalance(kidId), getKidTransactions(kidId)]);
  return { balance, transactions };
}

export interface GrantEntry {
  id: number;
  amount: number;
  reason: string;
  createdAt: Date;
}

export async function getKidGrants(kidId: number): Promise<GrantEntry[]> {
  const session = await getSession();
  if (!session) return [];

  return db
    .select({
      id: kcBucksTransactions.id,
      amount: kcBucksTransactions.amount,
      reason: kcBucksTransactions.reason,
      createdAt: kcBucksTransactions.createdAt,
    })
    .from(kcBucksTransactions)
    .where(and(eq(kcBucksTransactions.kidId, kidId), eq(kcBucksTransactions.type, "grant")))
    .orderBy(desc(kcBucksTransactions.createdAt))
    .limit(20);
}

export async function deleteGrant(transactionId: number): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to delete grants." };

  await db
    .delete(kcBucksTransactions)
    .where(and(eq(kcBucksTransactions.id, transactionId), eq(kcBucksTransactions.type, "grant")));

  revalidatePath("/kc-bucks/balances");
  return {};
}
