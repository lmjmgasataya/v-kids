import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.B2_REGION!,
      endpoint: process.env.B2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
      },
    });
  }
  return client;
}

// Uploads to a public B2 bucket (public at the bucket-settings level) and returns the resulting URL.
export async function uploadPublicPhoto(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.B2_PUBLIC_URL_BASE}/${key}`;
}
