/** Formats a name for display: lowercases it, then capitalizes the first letter of each word. */
export function capitalizeName(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** The short name shown on ID cards: the nickname if set, otherwise just the first word of the first name. */
export function idCardDisplayName(firstName: string, nickname: string | null | undefined): string {
  const trimmedNickname = nickname?.trim();
  if (trimmedNickname) return capitalizeName(trimmedNickname);
  return capitalizeName(firstName.trim().split(/\s+/)[0] ?? firstName);
}
