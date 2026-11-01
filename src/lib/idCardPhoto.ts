import { getPhotoVariant } from "./photoCache";

// The uncropped source photo for a service team member's ID card QR badge, as an inline data URL.
// Inlined (rather than a link) so the client-side badge canvas isn't tainted and html2canvas
// export works; the round crop, zoom/position and white ring are drawn in the browser by
// QrPhotoBadge so they can be adjusted live. Served from the photo cache, not straight from B2.
// Never throws — returns null (no badge) if there's no photo or it can't be loaded.
export async function idCardPhotoDataUrl(photoKey: string | null): Promise<string | null> {
  if (!photoKey) return null;
  const photo = await getPhotoVariant(photoKey, "card");
  return photo ? `data:image/jpeg;base64,${photo.toString("base64")}` : null;
}
