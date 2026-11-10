"use server";

import { redirect } from "next/navigation";
import {
  insertGuardianAndKid,
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

  const kidRow = await insertGuardianAndKid(child, guardian);

  redirect(withToast(`/register/child/success?kidId=${kidRow.id}`, "success", "Registration submitted!"));
}
