"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, kcBucksTransactions, kids, serviceTeamCheckIns, serviceTeamMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  checkOutAllOpenInService,
  checkOutAllOpenTeamInService,
  getCheckedInServicesTodayByKidIds,
  getManilaDayBounds,
  getOpenCheckIn,
  getOpenTeamCheckIn,
  getTeamCheckedInServicesTodayByMemberIds,
  hasCheckedInServiceToday,
  hasTeamCheckedInServiceToday,
  validateCheckInInput,
  type CheckInPersonKind,
  type CheckInSearchResult,
  type OpenCheckInSummary,
} from "@/lib/checkIn";
import { getCheckInCreditAmount, getKidBalance } from "@/lib/kcBucks";
import { peopleCount } from "@/lib/format";

// None of the check-in actions revalidate or redirect: re-rendering the check-in page
// (directory + roster) on every scan was the bulk of its server CPU. Instead each one
// returns just what changed, and CheckInWorkspace patches its in-memory copy.

export interface CheckInActionState {
  error?: string;
  success?: string;
  openCheckIn?: OpenCheckInSummary;
  balance?: number;
  // Set on success: the new check-in, for the caller to add to its roster/directory.
  checkIn?: OpenCheckInSummary;
  remarks?: string | null;
}

export interface CheckOutActionState {
  error?: string;
  success?: string;
  checkedOutAt?: Date;
  remarks?: string;
}

export interface UndoActionState {
  error?: string;
  success?: string;
  // Set by undoCheckOut: the reopened check-in.
  checkIn?: OpenCheckInSummary;
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

  const { start, end } = getManilaDayBounds();

  // These reads are independent of each other, so run them concurrently instead
  // of round-tripping to the DB one at a time. The balance is only needed for
  // the scan flow's success popup, and is read here — before this check-in's
  // credit is inserted below — so the eventual total can be had by simply
  // adding creditAmount, instead of re-querying the ledger after the insert
  // (an unreferenced data-modifying CTE isn't guaranteed to be visible to a
  // SELECT in the same statement, so that doesn't reliably work anyway).
  const [existingOpen, alreadyCheckedInService, creditAmount, priorBalance] = await Promise.all([
    getOpenCheckIn(kidId, start),
    hasCheckedInServiceToday(kidId, serviceAttending, start, end),
    getCheckInCreditAmount(),
    mode === "scan" ? getKidBalance(kidId) : Promise.resolve(0),
  ]);
  if (existingOpen?.isToday) {
    return { error: "This kid is already checked in.", openCheckIn: existingOpen };
  }
  if (alreadyCheckedInService) {
    return { error: `This kid has already checked in to ${serviceAttending} today.` };
  }
  if (existingOpen) {
    // Stale open check-in carried over from a previous day (the kid was never
    // checked out then) — close it out here so today's check-in can proceed;
    // the partial unique index only allows one open check-in per kid at a time.
    await db
      .update(checkIns)
      .set({ checkedOutAt: new Date(), checkedOutBy: session.userId })
      .where(eq(checkIns.id, existingOpen.id));
  }

  let insertedCheckIn: { id: number; checkedInAt: Date };
  try {
    [insertedCheckIn] = await db
      .insert(checkIns)
      .values({
        kidId,
        serviceAttending,
        remarks: remarks || null,
        checkedInBy: session.userId,
      })
      .returning({ id: checkIns.id, checkedInAt: checkIns.checkedInAt });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const openCheckIn = await getOpenCheckIn(kidId, start);
      return { error: "This kid is already checked in.", openCheckIn: openCheckIn ?? undefined };
    }
    throw err;
  }

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

  return {
    success: "Checked in! 🎉",
    // Only the scan flow's success popup shows the balance.
    balance: mode === "scan" ? priorBalance + creditAmount : undefined,
    checkIn: { id: insertedCheckIn.id, serviceAttending, checkedInAt: insertedCheckIn.checkedInAt, isToday: true },
    remarks: remarks || null,
  };
}

export async function checkOutKid(
  checkInId: number,
  _prev: CheckOutActionState | undefined,
  formData: FormData
): Promise<CheckOutActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const remarks = (formData.get("remarks") as string)?.trim() ?? "";
  if (remarks.length > 500) return { error: "Remarks must be 500 characters or fewer." };

  // Single round trip: update only if still open, then inspect what happened
  // rather than SELECTing first to check — the common case is one query, not two.
  const [updated] = await db
    .update(checkIns)
    .set({
      checkedOutAt: new Date(),
      checkedOutBy: session.userId,
      ...(remarks ? { remarks } : {}),
    })
    .where(and(eq(checkIns.id, checkInId), isNull(checkIns.checkedOutAt)))
    .returning({ id: checkIns.id, checkedOutAt: checkIns.checkedOutAt });

  if (!updated) {
    const [existing] = await db
      .select({ id: checkIns.id, checkedOutAt: checkIns.checkedOutAt })
      .from(checkIns)
      .where(eq(checkIns.id, checkInId));
    if (!existing) return { error: "This check-in no longer exists." };
    return { error: "This kid has already been checked out." };
  }

  return { success: "Checked out! 👋", checkedOutAt: updated.checkedOutAt!, remarks: remarks || undefined };
}

// Checks out every kid (or service team member) still checked in to the given
// service today — a cleanup tool for the end of a service, since kids are often
// left forgotten open.
export async function checkOutAllInService(
  service: string,
  kind: CheckInPersonKind,
  _prev: CheckOutActionState | undefined,
  _formData: FormData
): Promise<CheckOutActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const { start, end } = getManilaDayBounds();
  const checkedOutAt = new Date();
  const closedCount =
    kind === "team"
      ? await checkOutAllOpenTeamInService(service, start, end, session.userId)
      : await checkOutAllOpenInService(service, start, end, session.userId);

  if (closedCount === 0) return { success: `No ${kind === "team" ? "service team members" : "kids"} to check out.` };
  return { success: `Checked out ${peopleCount(closedCount, kind)}. 👋`, checkedOutAt };
}

// Row-level checkout form on the roster table; same result as checkOutKid.
export async function checkOutKidForm(checkInId: number, _prev: { error?: string } | undefined, formData: FormData) {
  return checkOutKid(checkInId, undefined, formData);
}

// Deletes a still-open check-in, as if it never happened. Only valid before
// checkout — undo the checkout first if the kid has already left.
export async function undoCheckIn(
  checkInId: number,
  _formData: FormData
): Promise<UndoActionState> {
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

  return { success: "Check-in undone." };
}

// Reopens a checked-out record. No-ops if the kid already has a newer open
// check-in, since only one open check-in per kid is allowed at a time.
export async function undoCheckOut(
  checkInId: number,
  _formData: FormData
): Promise<UndoActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({
      id: checkIns.id,
      kidId: checkIns.kidId,
      serviceAttending: checkIns.serviceAttending,
      checkedInAt: checkIns.checkedInAt,
      checkedOutAt: checkIns.checkedOutAt,
    })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (!existing.checkedOutAt) return { error: "This kid hasn't been checked out yet." };

  const { start } = getManilaDayBounds();
  const alreadyOpen = await getOpenCheckIn(existing.kidId, start);
  if (alreadyOpen) {
    return { error: "This kid already has a newer open check-in." };
  }

  await db.update(checkIns).set({ checkedOutAt: null, checkedOutBy: null }).where(eq(checkIns.id, checkInId));

  return {
    success: "Check-out undone.",
    checkIn: {
      id: existing.id,
      serviceAttending: existing.serviceAttending,
      checkedInAt: existing.checkedInAt,
      isToday: existing.checkedInAt >= start,
    },
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveQrToken(token: string): Promise<{ kid: CheckInSearchResult } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  if (!UUID_RE.test(token)) {
    return { error: "That QR code isn't a Kids Church ID card. Please scan a kid's or service team member's ID card." };
  }

  const { start, end } = getManilaDayBounds();

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

  if (row) {
    const [openCheckIn, servicesByKid] = await Promise.all([
      getOpenCheckIn(row.id, start),
      getCheckedInServicesTodayByKidIds([row.id], start, end),
    ]);
    return { kid: { ...row, kind: "kid", openCheckIn, checkedInServicesToday: servicesByKid.get(row.id) ?? [] } };
  }

  const [member] = await db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      defaultService: serviceTeamMembers.serviceAttending,
    })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.qrToken, token));

  if (!member) return { error: "No kid or service team member found for this QR code." };

  const [openCheckIn, servicesByMember] = await Promise.all([
    getOpenTeamCheckIn(member.id, start),
    getTeamCheckedInServicesTodayByMemberIds([member.id], start, end),
  ]);
  return {
    kid: {
      ...member,
      kind: "team",
      age: null,
      openCheckIn,
      checkedInServicesToday: servicesByMember.get(member.id) ?? [],
    },
  };
}

// Service team counterparts of checkInKid / checkOutKid / undoCheckIn / undoCheckOut,
// against service_team_check_ins. Same flow and return shapes so the check-in page can
// call either by the scanned/searched person's kind — minus KC Bucks, which are kids-only.

export async function checkInTeamMember(
  memberId: number,
  _prev: CheckInActionState | undefined,
  formData: FormData
): Promise<CheckInActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const serviceAttending = (formData.get("serviceAttending") as string)?.trim() ?? "";
  const remarks = (formData.get("remarks") as string)?.trim() ?? "";

  const error = validateCheckInInput(serviceAttending, remarks);
  if (error) return { error };

  const { start, end } = getManilaDayBounds();
  const [existingOpen, alreadyCheckedInService] = await Promise.all([
    getOpenTeamCheckIn(memberId, start),
    hasTeamCheckedInServiceToday(memberId, serviceAttending, start, end),
  ]);
  if (existingOpen?.isToday) {
    return { error: "This service team member is already checked in.", openCheckIn: existingOpen };
  }
  if (alreadyCheckedInService) {
    return { error: `This service team member has already checked in to ${serviceAttending} today.` };
  }
  if (existingOpen) {
    // Stale open check-in from a previous day — close it out (see checkInKid).
    await db
      .update(serviceTeamCheckIns)
      .set({ checkedOutAt: new Date(), checkedOutBy: session.userId })
      .where(eq(serviceTeamCheckIns.id, existingOpen.id));
  }

  let insertedCheckIn: { id: number; checkedInAt: Date };
  try {
    [insertedCheckIn] = await db
      .insert(serviceTeamCheckIns)
      .values({
        memberId,
        serviceAttending,
        remarks: remarks || null,
        checkedInBy: session.userId,
      })
      .returning({ id: serviceTeamCheckIns.id, checkedInAt: serviceTeamCheckIns.checkedInAt });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const openCheckIn = await getOpenTeamCheckIn(memberId, start);
      return { error: "This service team member is already checked in.", openCheckIn: openCheckIn ?? undefined };
    }
    throw err;
  }

  return {
    success: "Checked in! 🎉",
    checkIn: { id: insertedCheckIn.id, serviceAttending, checkedInAt: insertedCheckIn.checkedInAt, isToday: true },
    remarks: remarks || null,
  };
}

export async function checkOutTeamMember(
  checkInId: number,
  _prev: CheckOutActionState | undefined,
  formData: FormData
): Promise<CheckOutActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const remarks = (formData.get("remarks") as string)?.trim() ?? "";
  if (remarks.length > 500) return { error: "Remarks must be 500 characters or fewer." };

  const [updated] = await db
    .update(serviceTeamCheckIns)
    .set({
      checkedOutAt: new Date(),
      checkedOutBy: session.userId,
      ...(remarks ? { remarks } : {}),
    })
    .where(and(eq(serviceTeamCheckIns.id, checkInId), isNull(serviceTeamCheckIns.checkedOutAt)))
    .returning({ id: serviceTeamCheckIns.id, checkedOutAt: serviceTeamCheckIns.checkedOutAt });

  if (!updated) {
    const [existing] = await db
      .select({ id: serviceTeamCheckIns.id })
      .from(serviceTeamCheckIns)
      .where(eq(serviceTeamCheckIns.id, checkInId));
    if (!existing) return { error: "This check-in no longer exists." };
    return { error: "This service team member has already been checked out." };
  }

  return { success: "Checked out! 👋", checkedOutAt: updated.checkedOutAt!, remarks: remarks || undefined };
}

export async function checkOutTeamMemberForm(
  checkInId: number,
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  return checkOutTeamMember(checkInId, undefined, formData);
}

export async function undoTeamCheckIn(
  checkInId: number,
  _formData: FormData
): Promise<UndoActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({ id: serviceTeamCheckIns.id, checkedOutAt: serviceTeamCheckIns.checkedOutAt })
    .from(serviceTeamCheckIns)
    .where(eq(serviceTeamCheckIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (existing.checkedOutAt) {
    return { error: "This service team member has already been checked out — undo the checkout first." };
  }

  await db.delete(serviceTeamCheckIns).where(eq(serviceTeamCheckIns.id, checkInId));

  return { success: "Check-in undone." };
}

export async function undoTeamCheckOut(
  checkInId: number,
  _formData: FormData
): Promise<UndoActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const [existing] = await db
    .select({
      id: serviceTeamCheckIns.id,
      memberId: serviceTeamCheckIns.memberId,
      serviceAttending: serviceTeamCheckIns.serviceAttending,
      checkedInAt: serviceTeamCheckIns.checkedInAt,
      checkedOutAt: serviceTeamCheckIns.checkedOutAt,
    })
    .from(serviceTeamCheckIns)
    .where(eq(serviceTeamCheckIns.id, checkInId));

  if (!existing) return { error: "This check-in no longer exists." };
  if (!existing.checkedOutAt) return { error: "This service team member hasn't been checked out yet." };

  const { start } = getManilaDayBounds();
  const alreadyOpen = await getOpenTeamCheckIn(existing.memberId, start);
  if (alreadyOpen) {
    return { error: "This service team member already has a newer open check-in." };
  }

  await db
    .update(serviceTeamCheckIns)
    .set({ checkedOutAt: null, checkedOutBy: null })
    .where(eq(serviceTeamCheckIns.id, checkInId));

  return {
    success: "Check-out undone.",
    checkIn: {
      id: existing.id,
      serviceAttending: existing.serviceAttending,
      checkedInAt: existing.checkedInAt,
      isToday: existing.checkedInAt >= start,
    },
  };
}
