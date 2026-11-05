"use server";

import * as XLSX from "xlsx";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  checkOutAllOpenInDateRange,
  checkOutAllOpenInService,
  checkOutAllOpenTeamInDateRange,
  checkOutAllOpenTeamInService,
  getAttendanceByService,
  getManilaDayBoundsForDateString,
  getTeamAttendanceByService,
  type CheckInPersonKind,
} from "@/lib/checkIn";
import { peopleCount } from "@/lib/format";

export async function exportAttendanceExcel(date: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/attendance");

  const { start, end } = getManilaDayBoundsForDateString(date);
  const [services, teamServices] = await Promise.all([
    getAttendanceByService(start, end),
    getTeamAttendanceByService(start, end),
  ]);

  const timeFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });

  const data = services.flatMap((service) =>
    service.people.map((kid) => ({
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

  const teamData = teamServices.flatMap((service) =>
    service.people.map((member) => ({
      Service: service.service,
      "First Name": member.firstName,
      "Last Name": member.lastName,
      Nickname: member.nickname ?? "",
      "Checked In At": timeFormatter.format(member.checkedInAt),
      "Checked Out At": member.checkedOutAt ? timeFormatter.format(member.checkedOutAt) : "",
      Status: member.checkedOutAt ? "Checked out" : "Still present",
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "Attendance");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(teamData), "Service Team");
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
  kind: CheckInPersonKind,
  _prev: CheckOutAllActionState | undefined,
  _formData: FormData
): Promise<CheckOutAllActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  const { start, end } = getManilaDayBoundsForDateString(date);
  const closedCount =
    kind === "team"
      ? await checkOutAllOpenTeamInService(service, start, end, session.userId)
      : await checkOutAllOpenInService(service, start, end, session.userId);

  revalidatePath("/attendance");
  revalidatePath("/check-in", "layout");

  if (closedCount === 0) return { success: `No ${kind === "team" ? "service team members" : "kids"} to check out.` };
  return { success: `Checked out ${peopleCount(closedCount, kind)}. 👋` };
}

export async function checkOutAllInAllServicesForDate(
  date: string,
  kind: CheckInPersonKind,
  _prev: CheckOutAllActionState | undefined,
  _formData: FormData
): Promise<CheckOutAllActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  const { start, end } = getManilaDayBoundsForDateString(date);
  const closedCount =
    kind === "team"
      ? await checkOutAllOpenTeamInDateRange(start, end, session.userId)
      : await checkOutAllOpenInDateRange(start, end, session.userId);

  revalidatePath("/attendance");
  revalidatePath("/check-in", "layout");

  if (closedCount === 0) return { success: `No ${kind === "team" ? "service team members" : "kids"} to check out.` };
  return { success: `Checked out ${peopleCount(closedCount, kind)}. 👋` };
}
