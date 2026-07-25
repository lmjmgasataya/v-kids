"use server";

import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { redirect } from "next/navigation";
import {
  isDuplicateKid,
  readChildInput,
  readGuardianInput,
  validateChildInput,
  validateGuardianInput,
} from "@/lib/kidRegistration";
import { withToast } from "@/lib/toast";

export async function registerKid(_: unknown, formData: FormData) {
  const child = readChildInput(formData);
  const guardian = readGuardianInput(formData);
  const values = { child, guardian };

  const childError = validateChildInput(child);
  if (childError) return { error: childError, values };

  const guardianError = validateGuardianInput(guardian);
  if (guardianError) return { error: guardianError, values };

  if (await isDuplicateKid(child)) {
    return {
      error: "A kid with this same first name, last name, and age is already registered.",
      values,
    };
  }

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

  redirect(withToast(`/register/success?kidId=${kidRow.id}`, "success", "Registration submitted!"));
}
