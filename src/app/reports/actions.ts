"use server";

import * as XLSX from "xlsx";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { capitalizeName } from "@/lib/format";
import { getAttendanceReport, getFamiliesReport, parseReportRange, reportRangeStart } from "@/lib/reports";

export type ReportListKind = "follow-up" | "service-mismatch" | "shared-numbers";

function fullName(kid: { firstName: string; lastName: string }) {
  return `${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`;
}

export async function exportReportList(kind: ReportListKind, range?: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  let rows: Record<string, string | number>[];
  if (kind === "shared-numbers") {
    const report = await getFamiliesReport();
    rows = report.sharedNumberGroups.flatMap((group) =>
      group.kids.map((kid) => ({
        "Contact Number": group.contactNumber,
        Kid: fullName(kid),
        Nickname: kid.nickname ? capitalizeName(kid.nickname) : "",
        Service: kid.service,
        Guardian: `${capitalizeName(kid.guardianFirstName)} ${capitalizeName(kid.guardianLastName)}`,
      }))
    );
  } else {
    const report = await getAttendanceReport(reportRangeStart(parseReportRange(range)));
    rows =
      kind === "follow-up"
        ? report.followUp.map((kid) => ({
            Kid: fullName(kid),
            Nickname: kid.nickname ? capitalizeName(kid.nickname) : "",
            "Registered Service": kid.service,
            "Days Attended": kid.daysAttended,
            "Last Attended": kid.lastAttended,
          }))
        : report.serviceMismatch.map((kid) => ({
            Kid: fullName(kid),
            Nickname: kid.nickname ? capitalizeName(kid.nickname) : "",
            "Registered Service": kid.service,
            "Usually Attends": kid.usualService,
            "Check-ins There": kid.usualCount,
            "Total Check-ins": kid.totalCheckIns,
          }));
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return { filename: `${kind}.xlsx`, base64: buffer.toString("base64") };
}
