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
  _formData: FormData
): Promise<RedeemCreditsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const amount = REDEEM_AMOUNT;
  const reason = REDEEM_REASON;

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

  revalidatePath("/kc-bucks/balances");
  revalidatePath(`/kc-bucks/balance/${kidId}`);

  return { success: `Redeemed ${amount} KC Bucks for "${reason}".`, balance: balance - amount };
}
