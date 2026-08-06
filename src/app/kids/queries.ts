import { db } from "@/db";
import { kids, guardians } from "@/db/schema";
import { GENDER_OPTIONS, SERVICE_OPTIONS } from "@/lib/constants";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

export const PAGE_SIZE = 20;

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

export function resolveGender(genderParam: string): string {
  return (GENDER_OPTIONS as readonly string[]).includes(genderParam) ? genderParam : "";
}

export function resolveService(serviceParam: string): string {
  return (SERVICE_OPTIONS as readonly string[]).includes(serviceParam) ? serviceParam : "";
}

function buildKidsWhere({ q, gender, service }: { q: string; gender?: string; service?: string }) {
  const search = q.trim();
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(kids.firstName, `%${search}%`),
        ilike(kids.lastName, `%${search}%`),
        ilike(kids.nickname, `%${search}%`),
        ilike(guardians.firstName, `%${search}%`),
        ilike(guardians.lastName, `%${search}%`)
      )
    );
  }
  if (gender) conditions.push(eq(kids.gender, gender as "Male" | "Female"));
  if (service) conditions.push(eq(kids.serviceAttending, service));
  return conditions.length ? and(...conditions) : undefined;
}

export async function countKidsRows({
  q,
  gender,
  service,
}: {
  q: string;
  gender?: string;
  service?: string;
}) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id))
    .where(buildKidsWhere({ q, gender, service }));
  return count;
}

export async function fetchKidsRows({
  q,
  sort,
  dir,
  gender,
  service,
  page,
}: {
  q: string;
  sort: SortKey;
  dir: "asc" | "desc";
  gender?: string;
  service?: string;
  page?: number;
}) {
  const orderFn = dir === "asc" ? asc : desc;

  const query = db
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
    .where(buildKidsWhere({ q, gender, service }))
    .orderBy(orderFn(SORTABLE[sort]));

  if (page) return query.limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  return query;
}
