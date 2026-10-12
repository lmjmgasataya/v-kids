"use server";

import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KC_BUCKS_MAX_CUSTOM_GRANT } from "@/lib/constants";

export interface GrantCreditsState {
  error?: string;
  success?: string;
}

const GRANT_AMOUNT = 10;
const GRANT_REASON = "Manual granted";

export async function grantCredits(
  kidId: number,
  _prev: GrantCreditsState | undefined,
  formData: FormData
): Promise<GrantCreditsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  // The quick "+10" button posts no amount; the custom-amount popup posts one.
  const rawAmount = formData.get("amount");
  const amount = rawAmount === null ? GRANT_AMOUNT : Number(rawAmount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > KC_BUCKS_MAX_CUSTOM_GRANT) {
    return { error: `Enter a whole number from 1 to ${KC_BUCKS_MAX_CUSTOM_GRANT}.` };
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

  return { success: `Granted ${amount} KC Bucks for "${reason}".` };
}
