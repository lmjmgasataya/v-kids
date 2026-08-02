export const GENDER_OPTIONS = ["Male", "Female"] as const;

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
export const SERVICE_CARDS_FLAG_KEY = "service_cards";

export const ROLE_OPTIONS = ["admin", "volunteer"] as const;

export const CHECKIN_CREDIT_SETTING_KEY = "checkin_credit_amount";

export const KC_BUCKS_REASON_OPTIONS = [
  "Led prayer",
  "Recited memory verse",
  "Answered Bible question",
  "Helped a friend",
  "Good behavior",
  "Other",
];
