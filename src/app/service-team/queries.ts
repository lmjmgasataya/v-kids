import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { GENDER_OPTIONS, SERVICE_OPTIONS } from "@/lib/constants";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

export const PAGE_SIZE = 20;

export const SORTABLE = {
  lastName: serviceTeamMembers.lastName,
  gender: serviceTeamMembers.gender,
  birthday: serviceTeamMembers.birthday,
  serviceAttending: serviceTeamMembers.serviceAttending,
  createdAt: serviceTeamMembers.createdAt,
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

function buildServiceTeamWhere({ q, gender, service }: { q: string; gender?: string; service?: string }) {
  const search = q.trim();
  const conditions = [];
  if (search) {
    conditions.push(or(ilike(serviceTeamMembers.firstName, `%${search}%`), ilike(serviceTeamMembers.lastName, `%${search}%`)));
  }
  if (gender) conditions.push(eq(serviceTeamMembers.gender, gender as "Male" | "Female"));
  if (service) conditions.push(eq(serviceTeamMembers.serviceAttending, service));
  return conditions.length ? and(...conditions) : undefined;
}

export async function countServiceTeamRows({
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
    .from(serviceTeamMembers)
    .where(buildServiceTeamWhere({ q, gender, service }));
  return count;
}

export async function fetchServiceTeamRows({
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
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      gender: serviceTeamMembers.gender,
      birthday: serviceTeamMembers.birthday,
      serviceAttending: serviceTeamMembers.serviceAttending,
      photoKey: serviceTeamMembers.photoKey,
      qrToken: serviceTeamMembers.qrToken,
      createdAt: serviceTeamMembers.createdAt,
    })
    .from(serviceTeamMembers)
    .where(buildServiceTeamWhere({ q, gender, service }))
    .orderBy(orderFn(SORTABLE[sort]));

  if (page) return query.limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  return query;
}
