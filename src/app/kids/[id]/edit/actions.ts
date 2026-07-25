"use server";

import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  isDuplicateKid,
  readChildInput,
  readGuardianInput,
  validateChildInput,
  validateGuardianInput,
} from "@/lib/kidRegistration";
import { withToast } from "@/lib/toast";

export async function updateKid(kidId: number, _: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const child = readChildInput(formData);
  const guardian = readGuardianInput(formData);

  const childError = validateChildInput(child);
  if (childError) return { error: childError };

  const guardianError = validateGuardianInput(guardian);
  if (guardianError) return { error: guardianError };

  if (await isDuplicateKid(child, kidId)) {
    return { error: "A kid with this same first name, last name, and age is already registered." };
  }

  const [existing] = await db.select({ guardianId: kids.guardianId }).from(kids).where(eq(kids.id, kidId));
  if (!existing) {
    return { error: "This registration no longer exists." };
  }

  await db.update(guardians).set(guardian).where(eq(guardians.id, existing.guardianId));

  await db
    .update(kids)
    .set({
      firstName: child.firstName,
      lastName: child.lastName,
      nickname: child.nickname || null,
      age: child.age,
      gender: child.gender,
      serviceAttending: child.serviceAttending,
    })
    .where(eq(kids.id, kidId));

  redirect(withToast("/kids", "success", "Registration updated."));
}
