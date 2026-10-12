"use server";

import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getKidBalance } from "@/lib/kcBucks";

const REDEEM_AMOUNT = 10;
const REDEEM_REASON = "Manual redemption";

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

  // The quick "-10" button posts no amount; the custom-amount popup posts one.
  const rawAmount = formData.get("amount");
  const amount = rawAmount === null ? REDEEM_AMOUNT : Number(rawAmount);
  const balance = await getKidBalance(kidId);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a whole number amount greater than 0.", balance };
  }

  const reason = REDEEM_REASON;
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

  revalidatePath("/kc-bucks/balances");
  revalidatePath(`/kc-bucks/balance/${kidId}`);

  return { success: `Redeemed ${amount} KC Bucks for "${reason}".`, balance: balance - amount };
}
