import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

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

// Asia/Manila is fixed UTC+8 with no DST, so "today" is a plain offset shift.
export function getManilaDayBounds(reference: Date = new Date()): { start: Date; end: Date } {
  const manilaNow = new Date(reference.getTime() + MANILA_OFFSET_MS);
  const start = new Date(
    Date.UTC(manilaNow.getUTCFullYear(), manilaNow.getUTCMonth(), manilaNow.getUTCDate()) - MANILA_OFFSET_MS
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
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
