"use server";

import * as XLSX from "xlsx";
import { and, eq, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { withToast } from "@/lib/toast";
import { parseCsv } from "@/lib/csv";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { fetchServiceTeamRows, resolveDir, resolveSort } from "./queries";

export async function deleteServiceTeamMember(memberId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/service-team");

  await db.delete(serviceTeamMembers).where(eq(serviceTeamMembers.id, memberId));

  revalidatePath("/service-team");
  redirect(withToast("/service-team", "success", "Service team member deleted."));
}

export async function exportServiceTeamExcel(q: string, sortParam: string, dirParam: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sort = resolveSort(sortParam);
  const dir = resolveDir(dirParam);
  const rows = await fetchServiceTeamRows({ q, sort, dir });

  const data = rows.map((row) => ({
    "First Name": row.firstName,
    "Last Name": row.lastName,
    Nickname: row.nickname ?? "",
    Birthday: row.birthday,
    "Service Attending": row.serviceAttending,
    Registered: row.createdAt.toISOString().slice(0, 10),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Service Team");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `service-team-${new Date().toISOString().slice(0, 10)}.xlsx`,
    base64: buffer.toString("base64"),
  };
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportSummary {
  imported: number;
  errors: ImportRowError[];
}

async function isDuplicateServiceTeamMember(firstName: string, lastName: string, birthday: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: serviceTeamMembers.id })
    .from(serviceTeamMembers)
    .where(
      and(
        ilike(serviceTeamMembers.firstName, firstName),
        ilike(serviceTeamMembers.lastName, lastName),
        eq(serviceTeamMembers.birthday, birthday)
      )
    );
  return !!existing;
}

export async function importServiceTeamCsv(csvText: string): Promise<ImportSummary> {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = parseCsv(csvText);
  const dataRows = rows.slice(1); // first row is always the header

  const errors: ImportRowError[] = [];
  let imported = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i];
    const rowNum = i + 2; // account for header + 1-indexing

    const firstName = (cols[0] ?? "").trim();
    const lastName = (cols[1] ?? "").trim();
    const nickname = (cols[2] ?? "").trim();
    const birthday = (cols[3] ?? "").trim();
    const serviceAttending = (cols[4] ?? "").trim();

    if (!firstName || !lastName || !birthday || !serviceAttending) {
      errors.push({ row: rowNum, message: "Please fill in all required fields." });
      continue;
    }
    if (!SERVICE_OPTIONS.includes(serviceAttending)) {
      errors.push({ row: rowNum, message: "Invalid service." });
      continue;
    }
    const birthdayDate = new Date(birthday);
    if (Number.isNaN(birthdayDate.getTime()) || birthdayDate > new Date()) {
      errors.push({ row: rowNum, message: "Invalid birthday." });
      continue;
    }
    if (await isDuplicateServiceTeamMember(firstName, lastName, birthday)) {
      errors.push({
        row: rowNum,
        message: "A service team member with this same first name, last name, and birthday is already registered.",
      });
      continue;
    }

    await db.insert(serviceTeamMembers).values({
      firstName,
      lastName,
      nickname: nickname || null,
      birthday,
      serviceAttending,
    });
    imported++;
  }

  if (imported > 0) revalidatePath("/service-team");

  return { imported, errors };
}
