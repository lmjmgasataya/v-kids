export const shortDateFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
export const fullDateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeZone: "UTC" });
export const monthFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric", timeZone: "UTC" });

// Report dates are already Manila calendar dates (YYYY-MM-DD), so format them as UTC midnight.
export function dateFromString(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function percent(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}
