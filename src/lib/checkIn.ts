import { and, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, kids } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { manilaDateString } from "@/lib/date";

export * from "@/lib/date";

export interface OpenCheckInSummary {
  id: number;
  serviceAttending: string;
  checkedInAt: Date;
  // False when this open check-in is a stale carry-over from a previous day
  // (the kid was never checked out) rather than today's actual check-in.
  isToday: boolean;
}

export interface CheckInSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  defaultService: string;
  openCheckIn: OpenCheckInSummary | null;
  checkedInServicesToday: string[];
}

export async function getOpenCheckIn(kidId: number, todayStart: Date): Promise<OpenCheckInSummary | null> {
  const [row] = await db
    .select({ id: checkIns.id, serviceAttending: checkIns.serviceAttending, checkedInAt: checkIns.checkedInAt })
    .from(checkIns)
    .where(and(eq(checkIns.kidId, kidId), isNull(checkIns.checkedOutAt)));
  if (!row) return null;
  return { ...row, isToday: row.checkedInAt >= todayStart };
}

export async function getOpenCheckInsByKidIds(
  kidIds: number[],
  todayStart: Date
): Promise<Map<number, OpenCheckInSummary>> {
  if (kidIds.length === 0) return new Map();
  const rows = await db
    .select({
      kidId: checkIns.kidId,
      id: checkIns.id,
      serviceAttending: checkIns.serviceAttending,
      checkedInAt: checkIns.checkedInAt,
    })
    .from(checkIns)
    .where(and(inArray(checkIns.kidId, kidIds), isNull(checkIns.checkedOutAt)));
  return new Map(rows.map((row) => [row.kidId, { ...row, isToday: row.checkedInAt >= todayStart }]));
}

export async function getCheckedInServicesTodayByKidIds(
  kidIds: number[],
  start: Date,
  end: Date
): Promise<Map<number, string[]>> {
  if (kidIds.length === 0) return new Map();
  const rows = await db
    .select({ kidId: checkIns.kidId, service: checkIns.serviceAttending })
    .from(checkIns)
    .where(and(inArray(checkIns.kidId, kidIds), gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)));

  const map = new Map<number, Set<string>>();
  for (const row of rows) {
    if (!map.has(row.kidId)) map.set(row.kidId, new Set());
    map.get(row.kidId)!.add(row.service);
  }
  return new Map(Array.from(map.entries()).map(([kidId, services]) => [kidId, Array.from(services)]));
}

export interface CheckInDirectoryEntry extends CheckInSearchResult {
  qrToken: string;
}

// Every kid plus their live check-in status, for the check-in page to preload
// client-side — search and QR-scan resolution then both run against this
// in-memory snapshot instead of round-tripping to the DB per keystroke/scan.
export async function getCheckInDirectory(start: Date, end: Date): Promise<CheckInDirectoryEntry[]> {
  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      defaultService: kids.serviceAttending,
      qrToken: kids.qrToken,
    })
    .from(kids);

  const kidIds = rows.map((row) => row.id);
  const [openByKid, servicesByKid] = await Promise.all([
    getOpenCheckInsByKidIds(kidIds, start),
    getCheckedInServicesTodayByKidIds(kidIds, start, end),
  ]);

  return rows.map((row) => ({
    ...row,
    openCheckIn: openByKid.get(row.id) ?? null,
    checkedInServicesToday: servicesByKid.get(row.id) ?? [],
  }));
}

export async function hasCheckedInServiceToday(
  kidId: number,
  service: string,
  start: Date,
  end: Date
): Promise<boolean> {
  const [row] = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.kidId, kidId),
        eq(checkIns.serviceAttending, service),
        gte(checkIns.checkedInAt, start),
        lt(checkIns.checkedInAt, end)
      )
    )
    .limit(1);
  return !!row;
}

export interface DateAttendanceSummary {
  date: string; // YYYY-MM-DD, Manila calendar date
  checkedIn: number;
  stillPresent: number;
}

// Since services only run on a handful of days a month (usually just Sundays),
// this buckets a month's check-ins by Manila calendar date in JS rather than
// pushing a timezone-aware date_trunc into SQL.
export async function getAttendanceDatesInMonth(start: Date, end: Date): Promise<DateAttendanceSummary[]> {
  const rows = await db
    .select({ checkedInAt: checkIns.checkedInAt, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)));

  const buckets = new Map<string, { checkedIn: number; stillPresent: number }>();
  for (const row of rows) {
    const dateStr = manilaDateString(row.checkedInAt);
    const bucket = buckets.get(dateStr) ?? { checkedIn: 0, stillPresent: 0 };
    bucket.checkedIn += 1;
    if (!row.checkedOutAt) bucket.stillPresent += 1;
    buckets.set(dateStr, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, bucket]) => ({ date, ...bucket }));
}

// Checks out every still-open check-in for a service within a day window.
// Shared by the check-in page's (today-only) and attendance page's (any date)
// bulk checkout buttons. Returns the number of check-ins closed.
export async function checkOutAllOpenInService(
  service: string,
  start: Date,
  end: Date,
  checkedOutBy: number
): Promise<number> {
  const closed = await db
    .update(checkIns)
    .set({ checkedOutAt: new Date(), checkedOutBy })
    .where(
      and(
        eq(checkIns.serviceAttending, service),
        gte(checkIns.checkedInAt, start),
        lt(checkIns.checkedInAt, end),
        isNull(checkIns.checkedOutAt)
      )
    )
    .returning({ id: checkIns.id });
  return closed.length;
}

// Same as checkOutAllOpenInService, but across every service for the day —
// the attendance page's "check out ALL" button for a full day's cleanup.
export async function checkOutAllOpenInDateRange(start: Date, end: Date, checkedOutBy: number): Promise<number> {
  const closed = await db
    .update(checkIns)
    .set({ checkedOutAt: new Date(), checkedOutBy })
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end), isNull(checkIns.checkedOutAt)))
    .returning({ id: checkIns.id });
  return closed.length;
}

export function validateCheckInInput(serviceAttending: string, remarks: string): string | null {
  if (!serviceAttending) return "Please select a service.";
  if (!SERVICE_OPTIONS.includes(serviceAttending)) return "Please select a valid service.";
  if (remarks.length > 500) return "Remarks must be 500 characters or fewer.";
  return null;
}

export interface ServiceAttendanceKid {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  checkedInAt: Date;
  checkedOutAt: Date | null;
}

export interface ServiceAttendance {
  service: string;
  checkedIn: number; // total kids who checked in today, regardless of checkout status
  checkedOut: number; // of those, how many have since checked out
  stillPresent: number; // checkedIn - checkedOut
  kids: ServiceAttendanceKid[];
}

export async function getAttendanceByService(start: Date, end: Date): Promise<ServiceAttendance[]> {
  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      service: checkIns.serviceAttending,
      checkedInAt: checkIns.checkedInAt,
      checkedOutAt: checkIns.checkedOutAt,
    })
    .from(checkIns)
    .innerJoin(kids, eq(checkIns.kidId, kids.id))
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)))
    .orderBy(kids.firstName, kids.lastName);

  const buckets = new Map<string, ServiceAttendanceKid[]>();
  for (const service of SERVICE_OPTIONS) buckets.set(service, []);
  for (const row of rows) {
    if (!buckets.has(row.service)) buckets.set(row.service, []);
    buckets.get(row.service)!.push({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      nickname: row.nickname,
      age: row.age,
      checkedInAt: row.checkedInAt,
      checkedOutAt: row.checkedOutAt,
    });
  }

  return Array.from(buckets.entries()).map(([service, serviceKids]) => {
    const checkedOut = serviceKids.filter((kid) => kid.checkedOutAt).length;
    return {
      service,
      checkedIn: serviceKids.length,
      checkedOut,
      stillPresent: serviceKids.length - checkedOut,
      kids: serviceKids,
    };
  });
}
