"use server";

import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getKidBalance } from "@/lib/kcBucks";

export async function getKidBalanceForRedeem(kidId: number): Promise<number | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  return getKidBalance(kidId);
}

export interface RedeemCreditsState {
  error?: string;
  success?: string;
  balance?: number;
}

export async function redeemCredits(
  kidId: number,
  _prev: RedeemCreditsState | undefined,
  formData: FormData
): Promise<RedeemCreditsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const amount = Number(formData.get("amount"));
  const reason = (formData.get("reason") as string)?.trim() ?? "";

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Please enter a whole number of credits greater than 0." };
  }
  if (!reason) {
    return { error: "Please describe what's being redeemed." };
  }

  const balance = await getKidBalance(kidId);
  if (amount > balance) {
    return { error: `Not enough credits — current balance is ${balance}.`, balance };
  }

  await db.insert(kcBucksTransactions).values({
    kidId,
    type: "redemption",
    amount: -amount,
    reason,
    createdBy: session.userId,
  });

  return { success: `Redeemed ${amount} KC Bucks for "${reason}".`, balance: balance - amount };
}
