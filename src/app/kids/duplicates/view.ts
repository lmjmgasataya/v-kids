// Which list /kids/duplicates shows. Defaults to High matches only — the
// likeliest real duplicates — so Medium/Low noise doesn't bury them.
export const DUPLICATE_VIEWS = ["high", "all", "hidden"] as const;
export type DuplicateView = (typeof DUPLICATE_VIEWS)[number];

export function parseDuplicateView(value: string | string[] | undefined): DuplicateView {
  return (DUPLICATE_VIEWS as readonly string[]).includes(value as string) ? (value as DuplicateView) : "high";
}

export function duplicatesHref(view: DuplicateView): string {
  return view === "high" ? "/kids/duplicates" : `/kids/duplicates?show=${view}`;
}
