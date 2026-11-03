// Age brackets for the attendance "By age group" table and the reports age trend. Edits are
// remembered per browser only (localStorage), so this module is client-safe — call
// loadBrackets/saveBrackets only after hydration.

export interface AgeBracket {
  label: string;
  min: number;
  max: number;
}

// Placeholder brackets — editable in the attendance UI until the ministry settles on the
// real cutoffs.
export const DEFAULT_BRACKETS: AgeBracket[] = [
  { label: "Small Kids", min: 4, max: 6 },
  { label: "Big Kids", min: 7, max: 12 },
  { label: "Preteens", min: 12, max: 13 },
];

const STORAGE_KEY = "attendance-age-brackets";

export function loadBrackets(): AgeBracket[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_BRACKETS.length &&
      parsed.every((b) => typeof b?.label === "string" && Number.isFinite(b?.min) && Number.isFinite(b?.max))
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

export function saveBrackets(brackets: AgeBracket[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brackets));
  } catch {}
}

// Each kid counts toward the first bracket their age falls in, so overlapping
// ranges (e.g. 12 in both Big Kids and Preteens) never double-count.
export function bracketIndexFor(age: number, brackets: AgeBracket[]): number {
  return brackets.findIndex((b) => age >= b.min && age <= b.max);
}
