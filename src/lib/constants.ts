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
export const AUTO_CHECK_IN_FLAG_KEY = "auto_check_in";
export const AUTO_CHECK_OUT_FLAG_KEY = "auto_check_out";

export const REGISTRATION_FORM_TYPES = ["child", "team"] as const;
export type RegistrationFormType = (typeof REGISTRATION_FORM_TYPES)[number];

export const ROLE_OPTIONS = ["admin", "volunteer"] as const;

export const ID_CARD_NAME_SCALE_MIN = 50;
export const ID_CARD_NAME_SCALE_MAX = 150;

