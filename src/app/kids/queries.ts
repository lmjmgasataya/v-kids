import { db } from "@/db";
import { kids, guardians } from "@/db/schema";
import { asc, desc, eq, ilike, or } from "drizzle-orm";

export const SORTABLE = {
  lastName: kids.lastName,
  age: kids.age,
  gender: kids.gender,
  guardian: guardians.lastName,
  serviceAttending: kids.serviceAttending,
  createdAt: kids.createdAt,
} as const;

export type SortKey = keyof typeof SORTABLE;

export function resolveSort(sortParam: string): SortKey {
  return sortParam in SORTABLE ? (sortParam as SortKey) : "createdAt";
}

export function resolveDir(dirParam: string): "asc" | "desc" {
  return dirParam === "asc" ? "asc" : "desc";
}

export async function fetchKidsRows({ q, sort, dir }: { q: string; sort: SortKey; dir: "asc" | "desc" }) {
  const orderFn = dir === "asc" ? asc : desc;
  const search = q.trim();
  const whereClause = search
    ? or(
        ilike(kids.firstName, `%${search}%`),
        ilike(kids.lastName, `%${search}%`),
        ilike(kids.nickname, `%${search}%`),
        ilike(guardians.firstName, `%${search}%`),
        ilike(guardians.lastName, `%${search}%`)
      )
    : undefined;

  return db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      gender: kids.gender,
      serviceAttending: kids.serviceAttending,
      createdAt: kids.createdAt,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianContactNumber: guardians.contactNumber,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id))
    .where(whereClause)
    .orderBy(orderFn(SORTABLE[sort]));
}
