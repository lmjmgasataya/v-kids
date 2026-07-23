"use server";

import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { readChildInput, readGuardianInput, validateChildInput, validateGuardianInput } from "@/lib/kidRegistration";

export async function updateKid(kidId: number, _: unknown, formData: FormData) {
  const child = readChildInput(formData);
  const guardian = readGuardianInput(formData);

  const childError = validateChildInput(child);
  if (childError) return { error: childError };

  const guardianError = validateGuardianInput(guardian);
  if (guardianError) return { error: guardianError };

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

  redirect("/kids");
}
