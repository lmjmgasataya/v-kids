// One-time migration: copies every service team photo from Backblaze B2 to Cloudflare R2 under
// the same object key, so photoKey values in the database stay valid. Reads keys from the
// database (no bucket listing), skips objects already in R2, and never deletes anything from B2.
// Run: npx tsx --env-file=.env.local src/db/copy-photos-to-r2.ts
import "dotenv/config";
import { isNotNull } from "drizzle-orm";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from ".";
import { serviceTeamMembers } from "./schema";

const b2Endpoint = process.env.B2_ENDPOINT!;
const b2 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: /^https?:\/\//.test(b2Endpoint) ? b2Endpoint : `https://${b2Endpoint}`,
  credentials: { accessKeyId: process.env.B2_KEY_ID!, secretAccessKey: process.env.B2_APPLICATION_KEY! },
});
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

async function existsInR2(key: string) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    return true;
  } catch (err) {
    if ((err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

async function main() {
  const rows = await db
    .select({ id: serviceTeamMembers.id, photoKey: serviceTeamMembers.photoKey })
    .from(serviceTeamMembers)
    .where(isNotNull(serviceTeamMembers.photoKey));

  let copied = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const { id, photoKey } of rows) {
    const key = photoKey!;
    try {
      if (await existsInR2(key)) {
        skipped++;
        continue;
      }
      const res = await b2.send(new GetObjectCommand({ Bucket: process.env.B2_BUCKET!, Key: key }));
      const body = Buffer.from(await res.Body!.transformToByteArray());
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
          Body: body,
          ContentType: res.ContentType ?? "image/jpeg",
        })
      );
      copied++;
      console.log(`copied  member ${id}  ${key}  (${Math.round(body.length / 1024)} KB)`);
    } catch (err) {
      failed.push(key);
      console.error(`FAILED  member ${id}  ${key}:`, (err as Error).message);
    }
  }

  console.log(`\n${rows.length} photos: ${copied} copied, ${skipped} already in R2, ${failed.length} failed`);
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
