"use server";

import * as XLSX from "xlsx";
import { db } from "@/db";
import { checkIns, guardians, kcBucksTransactions, kids } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withToast } from "@/lib/toast";
import { parseCsv } from "@/lib/csv";
import {
  isDuplicateKid,
  validateChildInput,
  validateGuardianInput,
  type ChildInput,
  type Gender,
  type GuardianInput,
} from "@/lib/kidRegistration";
import { fetchKidsRows, resolveDir, resolveSort } from "./queries";
import { ID_CARD_NAME_SCALE_MIN, ID_CARD_NAME_SCALE_MAX } from "@/lib/constants";

export async function updateIdCardNameScale(kidId: number, scale: number): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  if (session.role !== "admin") return { error: "You don't have permission to do this." };

  if (!Number.isFinite(scale)) return { error: "Invalid name size." };
  const clamped = Math.min(ID_CARD_NAME_SCALE_MAX, Math.max(ID_CARD_NAME_SCALE_MIN, Math.round(scale)));

  await db.update(kids).set({ idCardNameScale: clamped }).where(eq(kids.id, kidId));

  revalidatePath("/kids/print-ids");
  revalidatePath(`/kids/${kidId}/id-card`);
  return {};
}

export async function deleteKid(kidId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const [existing] = await db.select({ guardianId: kids.guardianId }).from(kids).where(eq(kids.id, kidId));
  if (!existing) redirect("/kids");

  await db.delete(kcBucksTransactions).where(eq(kcBucksTransactions.kidId, kidId));
  await db.delete(checkIns).where(eq(checkIns.kidId, kidId));
  await db.delete(kids).where(eq(kids.id, kidId));

  const [otherKid] = await db
    .select({ id: kids.id })
    .from(kids)
    .where(eq(kids.guardianId, existing.guardianId));
  if (!otherKid) {
    await db.delete(guardians).where(eq(guardians.id, existing.guardianId));
  }

  revalidatePath("/kids");
  redirect(withToast("/kids", "success", "Registration deleted."));
}

export async function exportKidsExcel(q: string, sortParam: string, dirParam: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const sort = resolveSort(sortParam);
  const dir = resolveDir(dirParam);
  const rows = await fetchKidsRows({ q, sort, dir });

  const data = rows.map((row) => ({
    "First Name": row.firstName,
    "Last Name": row.lastName,
    Nickname: row.nickname ?? "",
    Age: row.age,
    Gender: row.gender,
    "Service Attending": row.serviceAttending,
    "Guardian First Name": row.guardianFirstName,
    "Guardian Last Name": row.guardianLastName,
    "Guardian Contact Number": row.guardianContactNumber,
    Registered: row.createdAt.toISOString().slice(0, 10),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kids");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `registered-kids-${new Date().toISOString().slice(0, 10)}.xlsx`,
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

export async function importKidsCsv(csvText: string): Promise<ImportSummary> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/kids");

  const rows = parseCsv(csvText);
  const dataRows = rows.slice(1); // first row is always the header

  const errors: ImportRowError[] = [];
  let imported = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i];
    const rowNum = i + 2; // account for header + 1-indexing

    const child: ChildInput = {
      firstName: (cols[0] ?? "").trim(),
      lastName: (cols[1] ?? "").trim(),
      nickname: (cols[2] ?? "").trim(),
      age: Number((cols[3] ?? "").trim()),
      gender: (cols[4] ?? "").trim() as Gender,
      serviceAttending: (cols[5] ?? "").trim(),
    };
    const guardian: GuardianInput = {
      firstName: (cols[6] ?? "").trim(),
      lastName: (cols[7] ?? "").trim(),
      contactNumber: (cols[8] ?? "").trim(),
      gender: (cols[9] ?? "").trim() as Gender,
    };

    const childError = validateChildInput(child);
    if (childError) {
      errors.push({ row: rowNum, message: childError });
      continue;
    }
    const guardianError = validateGuardianInput(guardian);
    if (guardianError) {
      errors.push({ row: rowNum, message: guardianError });
      continue;
    }

    if (await isDuplicateKid(child)) {
      errors.push({
        row: rowNum,
        message: "A kid with this same first name, last name, and age is already registered.",
      });
      continue;
    }

    const [guardianRow] = await db.insert(guardians).values(guardian).returning({ id: guardians.id });
    await db.insert(kids).values({
      firstName: child.firstName,
      lastName: child.lastName,
      nickname: child.nickname || null,
      age: child.age,
      gender: child.gender,
      serviceAttending: child.serviceAttending,
      guardianId: guardianRow.id,
    });
    imported++;
  }

  if (imported > 0) revalidatePath("/kids");

  return { imported, errors };
}
