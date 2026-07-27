import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { asc, desc, ilike, or } from "drizzle-orm";

export const SORTABLE = {
  lastName: serviceTeamMembers.lastName,
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

export async function fetchServiceTeamRows({ q, sort, dir }: { q: string; sort: SortKey; dir: "asc" | "desc" }) {
  const orderFn = dir === "asc" ? asc : desc;
  const search = q.trim();
  const whereClause = search
    ? or(ilike(serviceTeamMembers.firstName, `%${search}%`), ilike(serviceTeamMembers.lastName, `%${search}%`))
    : undefined;

  return db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      birthday: serviceTeamMembers.birthday,
      serviceAttending: serviceTeamMembers.serviceAttending,
      photoKey: serviceTeamMembers.photoKey,
      createdAt: serviceTeamMembers.createdAt,
    })
    .from(serviceTeamMembers)
    .where(whereClause)
    .orderBy(orderFn(SORTABLE[sort]));
}
