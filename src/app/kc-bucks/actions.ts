"use server";

import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { getSession } from "@/lib/auth";

export interface KcBucksKid {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
}

const kidColumns = {
  id: kids.id,
  firstName: kids.firstName,
  lastName: kids.lastName,
  nickname: kids.nickname,
  age: kids.age,
};

export async function searchKidsBasic(query: string): Promise<KcBucksKid[]> {
  const session = await getSession();
  if (!session) return [];

  const search = query.trim();
  if (!search) return [];

  return db
    .select(kidColumns)
    .from(kids)
    .where(
      or(ilike(kids.firstName, `%${search}%`), ilike(kids.lastName, `%${search}%`), ilike(kids.nickname, `%${search}%`))
    )
    .limit(10);
}

export async function resolveKidBasicByQrToken(token: string): Promise<{ kid: KcBucksKid } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const [row] = await db.select(kidColumns).from(kids).where(eq(kids.qrToken, token));

  if (!row) return { error: "No kid found for this QR code." };
  return { kid: row };
}

export async function getKidBasicById(kidId: number): Promise<KcBucksKid | null> {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db.select(kidColumns).from(kids).where(eq(kids.id, kidId));
  return row ?? null;
}
