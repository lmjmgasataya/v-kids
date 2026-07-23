"use server";

import { eq, ilike, or, sql } from "drizzle-orm";
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
  balance: number;
}

export async function searchKidsWithBalance(query: string): Promise<KidBalanceSearchResult[]> {
  const session = await getSession();
  if (!session) return [];

  const search = query.trim();
  if (!search) return [];

  return db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      balance: sql<number>`coalesce(sum(${kcBucksTransactions.amount}), 0)::int`,
    })
    .from(kids)
    .leftJoin(kcBucksTransactions, eq(kcBucksTransactions.kidId, kids.id))
    .where(
      or(ilike(kids.firstName, `%${search}%`), ilike(kids.lastName, `%${search}%`), ilike(kids.nickname, `%${search}%`))
    )
    .groupBy(kids.id)
    .limit(10);
}
