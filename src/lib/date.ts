// Pure date helpers with no server-only imports, safe to use from Client Components.

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

// Asia/Manila is fixed UTC+8 with no DST, so "today" is a plain offset shift.
export function getManilaDayBounds(reference: Date = new Date()): { start: Date; end: Date } {
  const manilaNow = new Date(reference.getTime() + MANILA_OFFSET_MS);
  const start = new Date(
    Date.UTC(manilaNow.getUTCFullYear(), manilaNow.getUTCMonth(), manilaNow.getUTCDate()) - MANILA_OFFSET_MS
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// "Today" in Asia/Manila as a YYYY-MM-DD string, for use as a date-input default/query param.
export function manilaDateString(reference: Date = new Date()): string {
  const manilaNow = new Date(reference.getTime() + MANILA_OFFSET_MS);
  return manilaNow.toISOString().slice(0, 10);
}

export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return shifted.toISOString().slice(0, 10);
}

export function getManilaDayBoundsForDateString(dateStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) - MANILA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
