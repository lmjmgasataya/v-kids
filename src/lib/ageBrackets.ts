// Age brackets for the attendance "By age group" table and the reports age trend. Edits are
// remembered per browser only (localStorage), so this module is client-safe — call
// loadBrackets/saveBrackets only after hydration.

export interface AgeBracket {
  label: string;
  min: number;
  max: number;
}

// A bracket whose max is at least this is shown as open-ended ("13+"). Kept a finite number so
// it survives JSON in localStorage and stays editable in the number input.
const OPEN_ENDED_MAX = 99;

// The ministry's age groups. Still editable per browser in the attendance UI; a saved set
// with a different number of brackets is ignored by loadBrackets, so older saves fall back to these.
export const DEFAULT_BRACKETS: AgeBracket[] = [
  { label: "Toddlers", min: 1, max: 3 },
  { label: "Preschool", min: 4, max: 6 },
  { label: "Primary", min: 7, max: 9 },
  { label: "Preteens", min: 10, max: 12 },
  { label: "13 & Up", min: 13, max: OPEN_ENDED_MAX },
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
// ranges (if someone edits two to share an age) never double-count.
export function bracketIndexFor(age: number, brackets: AgeBracket[]): number {
  return brackets.findIndex((b) => age >= b.min && age <= b.max);
}

/** "4–6", or "13+" for an open-ended bracket. */
export function formatBracketRange(b: AgeBracket): string {
  return b.max >= OPEN_ENDED_MAX ? `${b.min}+` : `${b.min}–${b.max}`;
}
