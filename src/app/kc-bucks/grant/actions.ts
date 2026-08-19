"use server";

import { db } from "@/db";
import { kcBucksTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface GrantCreditsState {
  error?: string;
  success?: string;
}

const GRANT_AMOUNT = 10;
const GRANT_REASON = "Manual granted";

export async function grantCredits(
  kidId: number,
  _prev: GrantCreditsState | undefined,
  _formData: FormData
): Promise<GrantCreditsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const amount = GRANT_AMOUNT;
  const reason = GRANT_REASON;

  await db.insert(kcBucksTransactions).values({
    kidId,
    type: "grant",
    amount,
    reason,
    createdBy: session.userId,
  });

  return { success: `Granted ${amount} KC Bucks for "${reason}".` };
}
