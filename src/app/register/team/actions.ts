"use server";

import crypto from "crypto";
import sharp from "sharp";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { uploadPublicPhoto } from "@/lib/storage";
import { withToast } from "@/lib/toast";

interface TeamRegisterValues {
  firstName: string;
  lastName: string;
  birthday: string;
  serviceAttending: string;
}

export async function registerServiceTeamMember(_: unknown, formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";
  const birthday = (formData.get("birthday") as string)?.trim() ?? "";
  const serviceAttending = (formData.get("serviceAttending") as string)?.trim() ?? "";
  const values: TeamRegisterValues = { firstName, lastName, birthday, serviceAttending };

  if (!firstName || !lastName || !birthday || !serviceAttending) {
    return { error: "Please fill in all required fields.", values };
  }
  if (!SERVICE_OPTIONS.includes(serviceAttending)) {
    return { error: "Please select a valid service.", values };
  }
  const birthdayDate = new Date(birthday);
  if (Number.isNaN(birthdayDate.getTime()) || birthdayDate > new Date()) {
    return { error: "Please enter a valid birthday.", values };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Please upload or take a photo.", values };
  }
  if (!photo.type.startsWith("image/")) {
    return { error: "The uploaded file must be an image.", values };
  }

  const resized = await sharp(Buffer.from(await photo.arrayBuffer()))
    .rotate()
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const photoUrl = await uploadPublicPhoto(resized, `service-team/${crypto.randomUUID()}.jpg`, "image/jpeg");

  await db.insert(serviceTeamMembers).values({
    firstName,
    lastName,
    birthday,
    serviceAttending,
    photoUrl,
  });

  redirect(withToast("/register/team/success", "success", "Registration submitted!"));
}
