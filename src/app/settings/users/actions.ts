"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withToast } from "@/lib/toast";

export async function deleteUser(userId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  if (session.userId === userId) {
    redirect(withToast("/settings/users", "warning", "You can't delete your own account."));
  }

  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!target) {
    redirect(withToast("/settings/users", "error", "This user no longer exists."));
  }

  if (target.role === "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (admins.length <= 1) {
      redirect(withToast("/settings/users", "warning", "At least one admin is required."));
    }
  }

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/settings/users");
  redirect(withToast("/settings/users", "success", "User deleted."));
}
