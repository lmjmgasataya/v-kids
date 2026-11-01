"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kids, serviceTeamMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { capitalizeName } from "@/lib/format";
import { serviceTeamPhotoUrl } from "@/lib/photoUrl";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QrCheckResult =
  | { kind: "team"; raw: string; token: string; name: string; photoUrl: string | null }
  | { kind: "kid"; raw: string; token: string; name: string }
  | { kind: "unknown"; raw: string; token: string }
  | { kind: "error"; error: string };

// Read-only: reports which card a scanned QR belongs to, without checking anyone in.
export async function checkScannedQr(decodedText: string): Promise<QrCheckResult> {
  const session = await getSession();
  if (!session) return { kind: "error", error: "Please sign in again." };
  if (session.role !== "admin") return { kind: "error", error: "You don't have permission to do this." };

  let token = decodedText;
  try {
    token = new URL(decodedText).searchParams.get("token") ?? decodedText;
  } catch {
    // Not a URL — treat the raw text as the token.
  }
  if (!UUID_RE.test(token)) return { kind: "unknown", raw: decodedText, token };

  const [member] = await db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      photoKey: serviceTeamMembers.photoKey,
    })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.qrToken, token));
  if (member) {
    return {
      kind: "team",
      raw: decodedText,
      token,
      name: `${capitalizeName(member.firstName)} ${capitalizeName(member.lastName)}`,
      photoUrl: member.photoKey ? serviceTeamPhotoUrl(member.id, member.photoKey, "thumb") : null,
    };
  }

  const [kid] = await db
    .select({ firstName: kids.firstName, lastName: kids.lastName })
    .from(kids)
    .where(eq(kids.qrToken, token));
  if (kid) {
    return { kind: "kid", raw: decodedText, token, name: `${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}` };
  }

  return { kind: "unknown", raw: decodedText, token };
}
