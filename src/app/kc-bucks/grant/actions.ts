"use server";

import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface GrantCreditsState {
  error?: string;
  success?: string;
}

export async function grantCredits(
  kidId: number,
  _prev: GrantCreditsState | undefined,
  formData: FormData
): Promise<GrantCreditsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const amount = Number(formData.get("amount"));
  const reasonOption = (formData.get("reason") as string)?.trim() ?? "";
  const customReason = (formData.get("customReason") as string)?.trim() ?? "";

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Please enter a whole number of credits greater than 0." };
  }
  if (!reasonOption) {
    return { error: "Please select a reason." };
  }

  const reason = reasonOption === "Other" ? customReason : reasonOption;
  if (!reason) {
    return { error: "Please describe the reason." };
  }

  await db.insert(kcBucksTransactions).values({
    kidId,
    type: "grant",
    amount,
    reason,
    createdBy: session.userId,
  });

  return { success: `Granted ${amount} KC Bucks for "${reason}".` };
}
