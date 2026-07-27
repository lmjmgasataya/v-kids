"use server";

import crypto from "crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { uploadPhoto } from "@/lib/storage";
import { withToast } from "@/lib/toast";

export async function updateServiceTeamMember(memberId: number, _: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/service-team");

  const firstName = (formData.get("firstName") as string)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";
  const birthday = (formData.get("birthday") as string)?.trim() ?? "";
  const serviceAttending = (formData.get("serviceAttending") as string)?.trim() ?? "";

  if (!firstName || !lastName || !birthday || !serviceAttending) {
    return { error: "Please fill in all required fields." };
  }
  if (!SERVICE_OPTIONS.includes(serviceAttending)) {
    return { error: "Please select a valid service." };
  }
  const birthdayDate = new Date(birthday);
  if (Number.isNaN(birthdayDate.getTime()) || birthdayDate > new Date()) {
    return { error: "Please enter a valid birthday." };
  }

  const [existing] = await db
    .select({ id: serviceTeamMembers.id })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.id, memberId));
  if (!existing) {
    return { error: "This service team member no longer exists." };
  }

  const photo = formData.get("photo");
  let photoKey: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      return { error: "The uploaded file must be an image." };
    }
    const resized = await sharp(Buffer.from(await photo.arrayBuffer()))
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    photoKey = await uploadPhoto(resized, `service-team/${crypto.randomUUID()}.jpg`, "image/jpeg");
  }

  await db
    .update(serviceTeamMembers)
    .set({
      firstName,
      lastName,
      birthday,
      serviceAttending,
      ...(photoKey ? { photoKey } : {}),
    })
    .where(eq(serviceTeamMembers.id, memberId));

  redirect(withToast("/service-team", "success", "Service team member updated."));
}
