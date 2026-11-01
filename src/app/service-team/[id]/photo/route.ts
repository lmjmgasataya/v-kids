import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPhotoVariant } from "@/lib/photoCache";
import type { PhotoVariant } from "@/lib/photoUrl";

const VARIANTS: PhotoVariant[] = ["thumb", "card", "full"];

// Build links with serviceTeamPhotoUrl (src/lib/photoUrl.ts). Any signed-in user, same as the
// /service-team list that shows these photos.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = Number((await params).id);
  if (!Number.isInteger(memberId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sizeParam = req.nextUrl.searchParams.get("size") ?? "thumb";
  const variant = VARIANTS.find((v) => v === sizeParam);
  if (!variant) return NextResponse.json({ error: "Unknown size" }, { status: 400 });

  const [row] = await db
    .select({ photoKey: serviceTeamMembers.photoKey })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.id, memberId));
  if (!row?.photoKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photo = await getPhotoVariant(row.photoKey, variant);
  if (!photo) return NextResponse.json({ error: "Photo unavailable" }, { status: 502 });

  const headers: Record<string, string> = {
    "Content-Type": "image/jpeg",
    // The URL carries the object key (`v`), so its content never changes — but it's private
    // data, so only the signed-in browser may cache it, not a shared CDN.
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  const downloadName = req.nextUrl.searchParams.get("download");
  if (downloadName) {
    headers["Content-Disposition"] = `attachment; filename="${downloadName.replace(/[^a-zA-Z0-9. _-]/g, "_")}"`;
  }
  return new NextResponse(new Uint8Array(photo), { headers });
}
