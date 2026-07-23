export const SERVICE_OPTIONS = [
  "9AM - Mandurriao",
  "11AM - Mandurriao",
  "2PM - Mandurriao",
  "4PM - Mandurriao",
  "6PM - Mandurriao",
  "10AM - Lapaz",
  "1PM - Lapaz",
];

export const MOBILE_NUMBER_PATTERN = String.raw`(09\d{9})|(\+639\d{9})|(639\d{9})`;
export const MOBILE_NUMBER_REGEX = /^(09\d{9}|\+639\d{9}|639\d{9})$/;
export const MOBILE_NUMBER_HELP = "Enter a valid mobile number: 09XXXXXXXXX, 639XXXXXXXXX, or +639XXXXXXXXX.";

export const CURSOR_TRAIL_FLAG_KEY = "cursor_trail";
