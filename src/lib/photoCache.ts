import sharp from "sharp";
import { unstable_cache } from "next/cache";
import { getPhotoBuffer } from "./storage";
import type { PhotoVariant } from "./photoUrl";

// Every read from the private B2 bucket is a billed Class B transaction, so photos are only
// ever downloaded once per (key, variant) and then served from Next's data cache (persisted
// across requests, instances and deploys on Vercel). Object keys are immutable — a retake is
// uploaded under a new random key — so entries never need invalidating.
const loadVariant = unstable_cache(
  async (key: string, variant: PhotoVariant): Promise<string> => {
    const original = await getPhotoBuffer(key);
    // Throw rather than return null so a failed download isn't cached forever.
    if (!original) throw new Error(`Photo not available: ${key}`);

    let out: Buffer;
    switch (variant) {
      case "full":
        out = original;
        break;
      case "card":
        // Source for the ID card QR badge, cropped client-side — big enough to zoom in on a face.
        out = await sharp(original)
          .rotate()
          .resize(480, 480, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        break;
      case "thumb":
        // 40px list avatar at 2x.
        out = await sharp(original).rotate().resize(96, 96, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
        break;
    }
    return out.toString("base64");
  },
  ["service-team-photo-v1"]
);

// Never throws — returns null if storage isn't configured or the photo can't be loaded.
export async function getPhotoVariant(key: string, variant: PhotoVariant): Promise<Buffer | null> {
  try {
    return Buffer.from(await loadVariant(key, variant), "base64");
  } catch (err) {
    console.error("Failed to load photo", err);
    return null;
  }
}
