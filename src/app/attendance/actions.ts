"use server";

import * as XLSX from "xlsx";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { checkOutAllOpenInService, getAttendanceByService, getManilaDayBoundsForDateString } from "@/lib/checkIn";

export async function exportAttendanceExcel(date: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/attendance");

  const { start, end } = getManilaDayBoundsForDateString(date);
  const services = await getAttendanceByService(start, end);

  const timeFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });

  const data = services.flatMap((service) =>
    service.kids.map((kid) => ({
      Service: service.service,
      "First Name": kid.firstName,
      "Last Name": kid.lastName,
      Nickname: kid.nickname ?? "",
      Age: kid.age,
      "Checked In At": timeFormatter.format(kid.checkedInAt),
      "Checked Out At": kid.checkedOutAt ? timeFormatter.format(kid.checkedOutAt) : "",
      Status: kid.checkedOutAt ? "Checked out" : "Still present",
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `attendance-${date}.xlsx`,
    base64: buffer.toString("base64"),
  };
}

export interface CheckOutAllActionState {
  error?: string;
  success?: string;
}

export async function checkOutAllInServiceForDate(
  service: string,
  date: string,
  _prev: CheckOutAllActionState | undefined,
  _formData: FormData
): Promise<CheckOutAllActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  const { start, end } = getManilaDayBoundsForDateString(date);
  const closedCount = await checkOutAllOpenInService(service, start, end, session.userId);

  revalidatePath("/attendance");
  revalidatePath("/check-in");

  if (closedCount === 0) return { success: "No kids to check out." };
  return { success: `Checked out ${closedCount} kid${closedCount === 1 ? "" : "s"}. 👋` };
}
