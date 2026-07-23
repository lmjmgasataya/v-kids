"use server";

import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { redirect } from "next/navigation";
import { readChildInput, readGuardianInput, validateChildInput, validateGuardianInput } from "@/lib/kidRegistration";

export async function registerKid(_: unknown, formData: FormData) {
  const child = readChildInput(formData);
  const guardian = readGuardianInput(formData);

  const childError = validateChildInput(child);
  if (childError) return { error: childError };

  const guardianError = validateGuardianInput(guardian);
  if (guardianError) return { error: guardianError };

  const [guardianRow] = await db.insert(guardians).values(guardian).returning({ id: guardians.id });

  const [kidRow] = await db
    .insert(kids)
    .values({
      firstName: child.firstName,
      lastName: child.lastName,
      nickname: child.nickname || null,
      age: child.age,
      gender: child.gender,
      serviceAttending: child.serviceAttending,
      guardianId: guardianRow.id,
    })
    .returning({ id: kids.id });

  redirect(`/register/success?kidId=${kidRow.id}`);
}
