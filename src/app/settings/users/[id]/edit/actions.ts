"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readUserInput, validateUserInput } from "@/lib/userManagement";
import { withToast } from "@/lib/toast";

export async function updateUser(userId: number, _: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const input = readUserInput(formData);
  const error = validateUserInput(input, { passwordRequired: false });
  if (error) return { error };

  const [usernameTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, input.username), ne(users.id, userId)));
  if (usernameTaken) {
    return { error: "That username is already taken." };
  }

  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!target) {
    return { error: "This user no longer exists." };
  }

  if (target.role === "admin" && input.role !== "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (admins.length <= 1) {
      return { error: "At least one admin is required — promote another user first." };
    }
  }

  await db
    .update(users)
    .set({
      username: input.username,
      name: input.name,
      role: input.role,
      ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}),
    })
    .where(eq(users.id, userId));

  redirect(withToast("/settings/users", "success", "User updated."));
}
