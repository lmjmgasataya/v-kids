"use server";

import { db } from "@/db";
import { checkIns, guardians, kcBucksTransactions, kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withToast } from "@/lib/toast";

export async function deleteKid(kidId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const [existing] = await db.select({ guardianId: kids.guardianId }).from(kids).where(eq(kids.id, kidId));
  if (!existing) redirect("/kids");

  await db.delete(kcBucksTransactions).where(eq(kcBucksTransactions.kidId, kidId));
  await db.delete(checkIns).where(eq(checkIns.kidId, kidId));
  await db.delete(kids).where(eq(kids.id, kidId));

  const [otherKid] = await db
    .select({ id: kids.id })
    .from(kids)
    .where(eq(kids.guardianId, existing.guardianId));
  if (!otherKid) {
    await db.delete(guardians).where(eq(guardians.id, existing.guardianId));
  }

  revalidatePath("/kids");
  redirect(withToast("/kids", "success", "Registration deleted."));
}
