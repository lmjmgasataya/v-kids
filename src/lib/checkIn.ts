import { and, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
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

export interface ServiceAttendance {
  service: string;
  checkedIn: number;
  checkedOut: number;
  total: number;
}

export async function getAttendanceByService(start: Date, end: Date): Promise<ServiceAttendance[]> {
  const rows = await db
    .select({ service: checkIns.serviceAttending, checkedOutAt: checkIns.checkedOutAt })
    .from(checkIns)
    .where(and(gte(checkIns.checkedInAt, start), lt(checkIns.checkedInAt, end)));

  const counts = new Map<string, { checkedIn: number; checkedOut: number }>();
  for (const service of SERVICE_OPTIONS) counts.set(service, { checkedIn: 0, checkedOut: 0 });
  for (const row of rows) {
    if (!counts.has(row.service)) counts.set(row.service, { checkedIn: 0, checkedOut: 0 });
    const bucket = counts.get(row.service)!;
    if (row.checkedOutAt) bucket.checkedOut++;
    else bucket.checkedIn++;
  }

  return Array.from(counts.entries()).map(([service, bucket]) => ({
    service,
    checkedIn: bucket.checkedIn,
    checkedOut: bucket.checkedOut,
    total: bucket.checkedIn + bucket.checkedOut,
  }));
}
