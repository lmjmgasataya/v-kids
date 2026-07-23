import { and, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, kids } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";

export * from "@/lib/date";

export interface OpenCheckInSummary {
  id: number;
  serviceAttending: string;
  checkedInAt: Date;
}

export interface CheckInSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  defaultService: string;
  openCheckIn: OpenCheckInSummary | null;
}

export async function getOpenCheckIn(kidId: number): Promise<OpenCheckInSummary | null> {
  const [row] = await db
    .select({ id: checkIns.id, serviceAttending: checkIns.serviceAttending, checkedInAt: checkIns.checkedInAt })
    .from(checkIns)
    .where(and(eq(checkIns.kidId, kidId), isNull(checkIns.checkedOutAt)));
  return row ?? null;
}

export async function getOpenCheckInsByKidIds(kidIds: number[]): Promise<Map<number, OpenCheckInSummary>> {
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
  return new Map(rows.map((row) => [row.kidId, row]));
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
  checkedInAt: Date;
  checkedOutAt: Date | null;
}

export interface ServiceAttendance {
  service: string;
  checkedIn: number;
  checkedOut: number;
  total: number;
  kids: ServiceAttendanceKid[];
}

export async function getAttendanceByService(start: Date, end: Date): Promise<ServiceAttendance[]> {
  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
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
      checkedInAt: row.checkedInAt,
      checkedOutAt: row.checkedOutAt,
    });
  }

  return Array.from(buckets.entries()).map(([service, serviceKids]) => ({
    service,
    checkedIn: serviceKids.filter((kid) => !kid.checkedOutAt).length,
    checkedOut: serviceKids.filter((kid) => kid.checkedOutAt).length,
    total: serviceKids.length,
    kids: serviceKids,
  }));
}
