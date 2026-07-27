"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { withToast } from "@/lib/toast";

export async function deleteServiceTeamMember(memberId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/service-team");

  await db.delete(serviceTeamMembers).where(eq(serviceTeamMembers.id, memberId));

  revalidatePath("/service-team");
  redirect(withToast("/service-team", "success", "Service team member deleted."));
}
