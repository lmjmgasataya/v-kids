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

export interface AddGrantState {
  error?: string;
  success?: string;
}

const GRANT_REASON = "Manual granted";

export async function addGrant(
  kidId: number,
  _prev: AddGrantState | undefined,
  formData: FormData
): Promise<AddGrantState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to add grants." };

  const amount = Number(formData.get("amount"));
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a whole number amount greater than 0." };
  }

  const reason = GRANT_REASON;

  await db.insert(kcBucksTransactions).values({
    kidId,
    type: "grant",
    amount,
    reason,
    createdBy: session.userId,
  });

  revalidatePath("/kc-bucks/balances");
  revalidatePath(`/kc-bucks/balance/${kidId}`);

  return { success: `Added ${amount} KC Bucks for "${reason}".` };
}

export async function updateGrant(transactionId: number, amount: number): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to edit grants." };

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a whole number amount greater than 0." };
  }

  await db
    .update(kcBucksTransactions)
    .set({ amount })
    .where(and(eq(kcBucksTransactions.id, transactionId), eq(kcBucksTransactions.type, "grant")));

  revalidatePath("/kc-bucks/balances");
  return {};
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
