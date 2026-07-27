import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

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
export async function getSignedPhotoUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET!, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}
