import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { loginLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";

const LIMIT = 200;

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function LoginLogsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const rows = await db.select().from(loginLogs).orderBy(desc(loginLogs.loggedAt)).limit(LIMIT);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Login logs</h3>
        <span className="text-xs text-gray-400">latest {LIMIT} · read-only</span>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Result</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IP address</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User agent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{dateTimeFormatter.format(log.loggedAt)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        log.success ? "bg-kids-green/15 text-kids-green" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {log.success ? "OK" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate" title={log.userAgent ?? undefined}>
                    {log.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-kids-navy/20 bg-white p-8 text-center text-sm text-gray-500">
          No login logs yet — the <span className="font-mono">login</span> action doesn&apos;t write to{" "}
          <span className="font-mono">login_logs</span> yet.
        </div>
      )}
    </div>
  );
}
