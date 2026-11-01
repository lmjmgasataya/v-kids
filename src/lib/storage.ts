import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function isB2Configured(): boolean {
  return Boolean(
    process.env.B2_BUCKET &&
      process.env.B2_ENDPOINT &&
      process.env.B2_REGION &&
      process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY
  );
}

function getClient(): S3Client {
  if (!client) {
    const endpoint = process.env.B2_ENDPOINT!;
    client = new S3Client({
      region: process.env.B2_REGION!,
      endpoint: /^https?:\/\//.test(endpoint) ? endpoint : `https://${endpoint}`,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
      },
    });
  }
  return client;
}

// Bucket is private — uploads store only the object key; reads go through getPhotoVariant
// (src/lib/photoCache.ts), which caches so each photo is only downloaded from B2 once.
// Callers must check isB2Configured() before calling — this throws if storage isn't set up.
export async function uploadPhoto(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

// Downloads a private photo's bytes server-side — each call is a billed B2 Class B transaction,
// so use getPhotoVariant (cached) instead of calling this directly. Never throws — returns null
// if storage isn't configured or the request fails.
export async function getPhotoBuffer(key: string): Promise<Buffer | null> {
  if (!isB2Configured()) return null;
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: process.env.B2_BUCKET!, Key: key }));
    if (!res.Body) return null;
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    console.error("Failed to download photo", err);
    return null;
  }
}
