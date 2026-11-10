import QRCode from "qrcode";

// A card's QR never changes (same URL + token), but the Print IDs pages draw one for every
// kid / member on each load. Memoized in this server instance's memory — not Next's data
// cache, whose per-entry lookups would cost more than drawing a few hundred QRs.
const MAX_ENTRIES = 5000;
const cache = new Map<string, Promise<string>>();

/** PNG data URL for an ID card QR. Level "H" leaves room for the service team photo badge. */
export function idCardQrDataUrl(payload: string, errorCorrectionLevel: "M" | "H" = "M"): Promise<string> {
  const key = `${errorCorrectionLevel}|${payload}`;
  let hit = cache.get(key);
  if (!hit) {
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
    hit = QRCode.toDataURL(payload, { width: 300, margin: 0, errorCorrectionLevel });
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}
