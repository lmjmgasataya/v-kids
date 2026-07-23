"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  if (session.userId === userId) {
    redirect("/settings/users");
  }

  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!target) {
    redirect("/settings/users");
  }

  if (target.role === "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (admins.length <= 1) {
      redirect("/settings/users");
    }
  }

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/settings/users");
  redirect("/settings/users");
}
