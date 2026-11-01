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
export const VOLUNTEER_MANAGE_SERVICE_TEAM_FLAG_KEY = "volunteer_manage_service_team";
export const VOLUNTEER_MANAGE_KIDS_FLAG_KEY = "volunteer_manage_kids";

export const REGISTRATION_FORM_TYPES = ["child", "team"] as const;
export type RegistrationFormType = (typeof REGISTRATION_FORM_TYPES)[number];

export const ROLE_OPTIONS = ["admin", "volunteer"] as const;

export const ID_CARD_NAME_SCALE_MIN = 50;
export const ID_CARD_NAME_SCALE_MAX = 150;

// Service team QR photo badge width (white ring included), as a % of the QR's width — the same
// for every card. The QR is generated with error correction level H (~30% recoverable); a
// 47%-wide circle covers ~17% of the code's area — clean digital images decoded up to 50% in
// tests, but print blur/glare eat into that headroom, so verify printed cards at
// /devops-admin/check-stm.
export const ID_CARD_PHOTO_SCALE = 47;

// Zoom into the photo inside that badge (100 = the photo's short side just fills the circle).
export const ID_CARD_PHOTO_ZOOM_MIN = 100;
export const ID_CARD_PHOTO_ZOOM_MAX = 400;


/** Upper bound for a custom KC Bucks grant from /kc-bucks/grant — guards against typos. */
export const KC_BUCKS_MAX_CUSTOM_GRANT = 1000;
