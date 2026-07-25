"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

export async function updateGrant(
  transactionId: number,
  amount: number,
  reason: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to edit grants." };

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Please enter a whole number of credits greater than 0." };
  }
  if (!reason) {
    return { error: "Please describe the reason." };
  }

  const [existing] = await db
    .select({ type: kcBucksTransactions.type })
    .from(kcBucksTransactions)
    .where(eq(kcBucksTransactions.id, transactionId));

  if (!existing || existing.type !== "grant") {
    return { error: "This entry can no longer be edited." };
  }

  await db.update(kcBucksTransactions).set({ amount, reason }).where(eq(kcBucksTransactions.id, transactionId));

  revalidatePath("/kc-bucks/balance");
  return {};
}

export async function deleteGrant(transactionId: number): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to delete grants." };

  await db
    .delete(kcBucksTransactions)
    .where(and(eq(kcBucksTransactions.id, transactionId), eq(kcBucksTransactions.type, "grant")));

  revalidatePath("/kc-bucks/balance");
  return {};
}
