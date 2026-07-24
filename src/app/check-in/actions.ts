"use server";

import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, kcBucksTransactions, kids } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getCheckedInServicesTodayByKidIds,
  getManilaDayBounds,
  getOpenCheckIn,
  getOpenCheckInsByKidIds,
  hasCheckedInServiceToday,
  validateCheckInInput,
  type CheckInSearchResult,
  type OpenCheckInSummary,
} from "@/lib/checkIn";
import { getCheckInCreditAmount } from "@/lib/kcBucks";
import { withToast } from "@/lib/toast";

export interface CheckInActionState {
  error?: string;
  success?: string;
  openCheckIn?: OpenCheckInSummary;
}

export interface CheckOutActionState {
  error?: string;
  success?: string;
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
  const mode = formData.get("mode") === "scan" ? "scan" : "search";

  const error = validateCheckInInput(serviceAttending, remarks);
  if (error) return { error };

  const existingOpen = await getOpenCheckIn(kidId);
  if (existingOpen) {
    return { error: "This kid is already checked in.", openCheckIn: existingOpen };
  }

  const { start, end } = getManilaDayBounds();
  const alreadyCheckedInService = await hasCheckedInServiceToday(kidId, serviceAttending, start, end);
  if (alreadyCheckedInService) {
    return { error: `This kid has already checked in to ${serviceAttending} today.` };
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

  // The scan flow keeps the camera mounted and refreshes in place (see CheckInForm)
  // instead of redirecting, so a fresh page load doesn't reset the scroll position
  // away from the QR scanner.
  if (mode === "scan") {
    return { success: "Checked in! 🎉" };
  }

  redirect(
    withToast(
      `/check-in?service=${encodeURIComponent(serviceAttending)}&intent=checkin&mode=${mode}`,
      "success",
      "Checked in! 🎉"
    )
  );
}

export async function checkOutKid(
  checkInId: number,
  _prev: CheckOutActionState | undefined,
  formData: FormData
): Promise<CheckOutActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const remarks = (formData.get("remarks") as string)?.trim() ?? "";
  const service = (formData.get("service") as string)?.trim() ?? "";
  const mode = formData.get("mode") === "scan" ? "scan" : "search";
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

  // The scan flow keeps the camera mounted and refreshes in place (see CheckOutForm)
  // instead of redirecting, so a fresh page load doesn't reset the scroll position
  // away from the QR scanner.
  if (mode === "scan") {
    return { success: "Checked out! 👋" };
  }

  const nextPath = service
    ? `/check-in?service=${encodeURIComponent(service)}&intent=checkout&mode=${mode}`
    : `/check-in?intent=checkout&mode=${mode}`;
  redirect(withToast(nextPath, "success", "Checked out! 👋"));
}

// Row-level checkout form on the roster table redirects + revalidates via
// checkOutKid on success; on validation failure it just returns the error
// for the caller's useActionState to surface as a toast.
export async function checkOutKidForm(checkInId: number, _prev: { error?: string } | undefined, formData: FormData) {
  return checkOutKid(checkInId, undefined, formData);
}

// Deletes a still-open check-in, as if it never happened. Only valid before
// checkout — undo the checkout first if the kid has already left.
export async function undoCheckIn(
  checkInId: number,
  _formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({ id: checkIns.id, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (existing.checkedOutAt) return { error: "This kid has already been checked out — undo the checkout first." };

  await db.delete(kcBucksTransactions).where(eq(kcBucksTransactions.checkInId, checkInId));
  await db.delete(checkIns).where(eq(checkIns.id, checkInId));

  revalidatePath("/check-in");
  revalidatePath("/attendance");
  return { success: "Check-in undone." };
}

// Reopens a checked-out record. No-ops if the kid already has a newer open
// check-in, since only one open check-in per kid is allowed at a time.
export async function undoCheckOut(
  checkInId: number,
  _formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({ id: checkIns.id, kidId: checkIns.kidId, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (!existing.checkedOutAt) return { error: "This kid hasn't been checked out yet." };

  const alreadyOpen = await getOpenCheckIn(existing.kidId);
  if (alreadyOpen) {
    return { error: "This kid already has a newer open check-in." };
  }

  await db.update(checkIns).set({ checkedOutAt: null, checkedOutBy: null }).where(eq(checkIns.id, checkInId));

  revalidatePath("/check-in");
  revalidatePath("/attendance");
  return { success: "Check-out undone." };
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

  const kidIds = rows.map((row) => row.id);
  const { start, end } = getManilaDayBounds();
  const [openByKid, servicesByKid] = await Promise.all([
    getOpenCheckInsByKidIds(kidIds),
    getCheckedInServicesTodayByKidIds(kidIds, start, end),
  ]);

  return rows.map((row) => ({
    ...row,
    openCheckIn: openByKid.get(row.id) ?? null,
    checkedInServicesToday: servicesByKid.get(row.id) ?? [],
  }));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveQrToken(token: string): Promise<{ kid: CheckInSearchResult } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  if (!UUID_RE.test(token)) {
    return { error: "That QR code isn't a Kids Church ID card. Please scan the child's ID card." };
  }

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

  const { start, end } = getManilaDayBounds();
  const [openCheckIn, servicesByKid] = await Promise.all([
    getOpenCheckIn(row.id),
    getCheckedInServicesTodayByKidIds([row.id], start, end),
  ]);

  return { kid: { ...row, openCheckIn, checkedInServicesToday: servicesByKid.get(row.id) ?? [] } };
}
