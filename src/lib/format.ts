/** Formats a name for display: lowercases it, then capitalizes the first letter of each word. */
export function capitalizeName(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}
