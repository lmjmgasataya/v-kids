"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readUserInput, validateUserInput } from "@/lib/userManagement";
import { withToast } from "@/lib/toast";

export async function createUser(_: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const input = readUserInput(formData);
  const error = validateUserInput(input, { passwordRequired: true });
  if (error) return { error };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username));
  if (existing) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  await db.insert(users).values({ username: input.username, name: input.name, role: input.role, passwordHash });

  redirect(withToast("/settings/users", "success", "User created."));
}
