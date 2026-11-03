import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

// Photos live in a private Cloudflare R2 bucket (S3-compatible API). Moved off Backblaze B2,
// whose 2,500 free reads/day the app used to exhaust; R2's free tier allows 10M reads/month.
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      // Only send/verify checksums when an operation requires them — the SDK's newer
      // always-on checksum defaults aren't fully supported by every S3-compatible provider.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

// Bucket is private — uploads store only the object key; reads go through getPhotoVariant
// (src/lib/photoCache.ts), which caches so each photo is only downloaded from storage once.
// Callers must check isStorageConfigured() before calling — this throws if storage isn't set up.
export async function uploadPhoto(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

// Downloads a private photo's bytes server-side — each call is a billed R2 Class B operation,
// so use getPhotoVariant (cached) instead of calling this directly. Never throws — returns null
// if storage isn't configured or the request fails.
export async function getPhotoBuffer(key: string): Promise<Buffer | null> {
  if (!isStorageConfigured()) return null;
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    if (!res.Body) return null;
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    console.error("Failed to download photo", err);
    return null;
  }
}
