"use server";

import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { kcBucksTransactions, kids } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getKidBalance, getKidTransactions, type KcBucksLedgerEntry } from "@/lib/kcBucks";

export interface KidBalanceSummary {
  balance: number;
  transactions: KcBucksLedgerEntry[];
}

export async function getKidBalanceSummary(kidId: number): Promise<KidBalanceSummary | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const [balance, transactions] = await Promise.all([getKidBalance(kidId), getKidTransactions(kidId)]);
  return { balance, transactions };
}

export interface KidBalanceSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  serviceAttending: string;
  balance: number;
}

export async function searchKidsWithBalance(query: string, service = ""): Promise<KidBalanceSearchResult[]> {
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
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      serviceAttending: kids.serviceAttending,
      balance: sql<number>`coalesce(sum(${kcBucksTransactions.amount}), 0)::int`,
    })
    .from(kids)
    .leftJoin(kcBucksTransactions, eq(kcBucksTransactions.kidId, kids.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(kids.id)
    .orderBy(asc(kids.firstName), asc(kids.lastName))
    .limit(search ? 10 : 100);
}
