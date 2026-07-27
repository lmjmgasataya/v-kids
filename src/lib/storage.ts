import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

// Bucket is private — uploads store only the object key; reads go through getSignedPhotoUrl below.
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

// Generates a time-limited signed URL for viewing a private photo (default 15 minutes).
// Never throws — returns null if storage isn't configured or the request fails, so photo
// display degrades to a placeholder instead of breaking the page.
export async function getSignedPhotoUrl(key: string, expiresInSeconds = 900): Promise<string | null> {
  if (!isB2Configured()) return null;
  try {
    const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET!, Key: key });
    return await getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error("Failed to generate signed photo URL", err);
    return null;
  }
}
