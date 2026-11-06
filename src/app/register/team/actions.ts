"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { isStorageConfigured, uploadPhoto } from "@/lib/storage";
import { preparePhotoUpload } from "@/lib/photoUpload";
import { withToast } from "@/lib/toast";

interface TeamRegisterValues {
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  birthday: string;
  serviceAttending: string;
}

export async function registerServiceTeamMember(_: unknown, formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";
  const nickname = (formData.get("nickname") as string)?.trim() ?? "";
  const gender = (formData.get("gender") as string)?.trim() ?? "";
  const birthday = (formData.get("birthday") as string)?.trim() ?? "";
  const serviceAttending = (formData.get("serviceAttending") as string)?.trim() ?? "";
  const values: TeamRegisterValues = { firstName, lastName, nickname, gender, birthday, serviceAttending };

  if (!firstName || !lastName || !gender || !birthday || !serviceAttending) {
    return { error: "Please fill in all required fields.", values };
  }
  if (!SERVICE_OPTIONS.includes(serviceAttending)) {
    return { error: "Please select a valid service.", values };
  }
  const birthdayDate = new Date(birthday);
  if (Number.isNaN(birthdayDate.getTime()) || birthdayDate > new Date()) {
    return { error: "Please enter a valid birthday.", values };
  }

  let photoKey: string | null = null;
  if (isStorageConfigured()) {
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith("image/")) {
        return { error: "The uploaded file must be an image.", values };
      }

      const resized = await preparePhotoUpload(photo);

      photoKey = await uploadPhoto(resized, `service-team/${crypto.randomUUID()}.jpg`, "image/jpeg");
    }
  }

  await db.insert(serviceTeamMembers).values({
    firstName,
    lastName,
    nickname: nickname || null,
    gender: gender as "Male" | "Female",
    birthday,
    serviceAttending,
    photoKey,
  });

  redirect(withToast("/register/team/success", "success", "Registration submitted!"));
}
