"use server";

import { db } from "@/db";
import { guardians, kids } from "@/db/schema";
import { redirect } from "next/navigation";

type Gender = "Male" | "Female";

export async function registerKid(_: unknown, formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const nickname = (formData.get("nickname") as string)?.trim();
  const age = Number(formData.get("age"));
  const gender = formData.get("gender") as Gender;
  const serviceAttending = (formData.get("serviceAttending") as string)?.trim();

  const guardianFirstName = (formData.get("guardianFirstName") as string)?.trim();
  const guardianLastName = (formData.get("guardianLastName") as string)?.trim();
  const guardianContactNumber = (formData.get("guardianContactNumber") as string)?.trim();
  const guardianGender = formData.get("guardianGender") as Gender;

  if (!firstName || !lastName || !Number.isFinite(age) || age < 0 || !gender || !serviceAttending) {
    return { error: "Please fill in all required fields for the child." };
  }
  if (!guardianFirstName || !guardianLastName || !guardianContactNumber || !guardianGender) {
    return { error: "Please fill in all required guardian fields." };
  }

  const [guardian] = await db
    .insert(guardians)
    .values({
      firstName: guardianFirstName,
      lastName: guardianLastName,
      contactNumber: guardianContactNumber,
      gender: guardianGender,
    })
    .returning({ id: guardians.id });

  await db.insert(kids).values({
    firstName,
    lastName,
    nickname: nickname || null,
    age,
    gender,
    serviceAttending,
    guardianId: guardian.id,
  });

  redirect("/register/success");
}
