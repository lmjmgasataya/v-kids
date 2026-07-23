"use server";

import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, kcBucksTransactions, kids } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getOpenCheckIn,
  getOpenCheckInsByKidIds,
  validateCheckInInput,
  type CheckInSearchResult,
  type OpenCheckInSummary,
} from "@/lib/checkIn";
import { getCheckInCreditAmount } from "@/lib/kcBucks";

export interface CheckInActionState {
  error?: string;
  openCheckIn?: OpenCheckInSummary;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function checkInKid(
  kidId: number,
  _prev: CheckInActionState | undefined,
  formData: FormData
): Promise<CheckInActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const serviceAttending = (formData.get("serviceAttending") as string)?.trim() ?? "";
  const remarks = (formData.get("remarks") as string)?.trim() ?? "";

  const error = validateCheckInInput(serviceAttending, remarks);
  if (error) return { error };

  const existingOpen = await getOpenCheckIn(kidId);
  if (existingOpen) {
    return { error: "This kid is already checked in.", openCheckIn: existingOpen };
  }

  let insertedCheckIn: { id: number };
  try {
    [insertedCheckIn] = await db
      .insert(checkIns)
      .values({
        kidId,
        serviceAttending,
        remarks: remarks || null,
        checkedInBy: session.userId,
      })
      .returning({ id: checkIns.id });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const openCheckIn = await getOpenCheckIn(kidId);
      return { error: "This kid is already checked in.", openCheckIn: openCheckIn ?? undefined };
    }
    throw err;
  }

  const creditAmount = await getCheckInCreditAmount();
  if (creditAmount > 0) {
    await db.insert(kcBucksTransactions).values({
      kidId,
      type: "checkin",
      amount: creditAmount,
      reason: `Checked in for ${serviceAttending}`,
      checkInId: insertedCheckIn.id,
      createdBy: session.userId,
    });
  }

  revalidatePath("/check-in");
  redirect("/check-in");
}

export async function checkOutKid(checkInId: number, _prev: { error?: string } | undefined, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const remarks = (formData.get("remarks") as string)?.trim() ?? "";
  if (remarks.length > 500) return { error: "Remarks must be 500 characters or fewer." };

  const [existing] = await db
    .select({ id: checkIns.id, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (existing.checkedOutAt) return { error: "This kid has already been checked out." };

  await db
    .update(checkIns)
    .set({
      checkedOutAt: new Date(),
      checkedOutBy: session.userId,
      ...(remarks ? { remarks } : {}),
    })
    .where(eq(checkIns.id, checkInId));

  revalidatePath("/check-in");
  redirect("/check-in");
}

// Row-level checkout form on the roster table has no local pending/error UI
// (unlike CheckInWorkspace's useActionState form), so it just fires and lets
// the redirect + revalidate above refresh the table.
export async function checkOutKidForm(checkInId: number, formData: FormData) {
  await checkOutKid(checkInId, undefined, formData);
}

// Deletes a still-open check-in, as if it never happened. Only valid before
// checkout — undo the checkout first if the kid has already left.
export async function undoCheckIn(checkInId: number, _formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({ id: checkIns.id, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing || existing.checkedOutAt) return;

  await db.delete(kcBucksTransactions).where(eq(kcBucksTransactions.checkInId, checkInId));
  await db.delete(checkIns).where(eq(checkIns.id, checkInId));

  revalidatePath("/check-in");
  revalidatePath("/attendance");
}

// Reopens a checked-out record. No-ops if the kid already has a newer open
// check-in, since only one open check-in per kid is allowed at a time.
export async function undoCheckOut(checkInId: number, _formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({ id: checkIns.id, kidId: checkIns.kidId, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing || !existing.checkedOutAt) return;

  const alreadyOpen = await getOpenCheckIn(existing.kidId);
  if (alreadyOpen) return;

  await db.update(checkIns).set({ checkedOutAt: null, checkedOutBy: null }).where(eq(checkIns.id, checkInId));

  revalidatePath("/check-in");
  revalidatePath("/attendance");
}

export async function searchKidsForCheckIn(query: string): Promise<CheckInSearchResult[]> {
  const session = await getSession();
  if (!session) return [];

  const search = query.trim();
  if (!search) return [];

  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      defaultService: kids.serviceAttending,
    })
    .from(kids)
    .where(or(ilike(kids.firstName, `%${search}%`), ilike(kids.lastName, `%${search}%`), ilike(kids.nickname, `%${search}%`)))
    .limit(10);

  const openByKid = await getOpenCheckInsByKidIds(rows.map((row) => row.id));

  return rows.map((row) => ({ ...row, openCheckIn: openByKid.get(row.id) ?? null }));
}

export async function resolveQrToken(token: string): Promise<{ kid: CheckInSearchResult } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const [row] = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      defaultService: kids.serviceAttending,
    })
    .from(kids)
    .where(eq(kids.qrToken, token));

  if (!row) return { error: "No kid found for this QR code." };

  const openCheckIn = await getOpenCheckIn(row.id);
  return { kid: { ...row, openCheckIn } };
}
