import { NextRequest, NextResponse } from "next/server";
import { getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { DEVOPS_TABLES } from "@/lib/devopsTables";

// Full-table CSV download for /devops-admin/data. Admin only — not covered by
// src/proxy.ts (API routes aren't in its matcher), so it checks the session itself.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const key = req.nextUrl.searchParams.get("table") ?? "";
  const entry = DEVOPS_TABLES.find((t) => t.key === key);
  if (!entry) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  // Secrets listed in the registry's `omit` (password hashes, registration link tokens)
  // are never selected, so they never leave the database.
  const columns = Object.fromEntries(
    Object.entries(getTableColumns(entry.table)).filter(([name]) => !entry.omit?.includes(name))
  );

  let csv: string;
  try {
    const rows = (await db.select(columns).from(entry.table)) as Record<string, unknown>[];
    csv = toCsv(Object.keys(columns), rows);
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${key}_${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
