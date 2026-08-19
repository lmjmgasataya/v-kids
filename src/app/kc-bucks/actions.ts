"use server";

import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { getSession } from "@/lib/auth";

export interface KcBucksKid {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  serviceAttending: string;
}

const kidColumns = {
  id: kids.id,
  firstName: kids.firstName,
  lastName: kids.lastName,
  nickname: kids.nickname,
  age: kids.age,
  serviceAttending: kids.serviceAttending,
};

export async function searchKidsBasic(query: string, service = ""): Promise<KcBucksKid[]> {
  const session = await getSession();
  if (!session) return [];

  const search = query.trim();
  const conditions = [];
  if (search) {
    conditions.push(
      or(ilike(kids.firstName, `%${search}%`), ilike(kids.lastName, `%${search}%`), ilike(kids.nickname, `%${search}%`))
    );
  }
  if (service) conditions.push(eq(kids.serviceAttending, service));

  return db
    .select(kidColumns)
    .from(kids)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(kids.firstName), asc(kids.lastName))
    .limit(search ? 10 : 100);
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
