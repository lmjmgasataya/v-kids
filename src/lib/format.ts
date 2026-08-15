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

/**
 * Font size (px) for the ID card's big display name, scaled down as the name gets longer
 * so it fills as much of the card as possible without overflowing the ~293px content width
 * (85.6mm card minus 2x4mm padding, at the browser's fixed 96px/in mm conversion).
 */
export function idCardNameFontSize(name: string): number {
  const trimmed = name.trim();
  const length = trimmed.length || 1;
  const base = Math.min(80, Math.round(570 / length));
  // M/W (and their lowercase forms) render noticeably wider than the average glyph the base
  // formula assumes, so trim the size a bit further whenever one shows up.
  const hasWideLetter = /[mwcgb]/i.test(trimmed);
  return Math.max(24, hasWideLetter ? Math.round(base * 0.85) : base);
}
