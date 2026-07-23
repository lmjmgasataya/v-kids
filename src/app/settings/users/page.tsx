import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DeleteUserButton } from "./DeleteUserButton";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const rows = await db
    .select({ id: users.id, username: users.username, name: users.name, role: users.role })
    .from(users)
    .orderBy(asc(users.username));

  const adminCount = rows.filter((r) => r.role === "admin").length;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Users" }]}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Users</h2>
        <Link
          href="/settings/users/new"
          className="bg-kids-green hover:bg-kids-green/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
        >
          + Add user
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelf = row.id === session.userId;
              const isLastAdmin = row.role === "admin" && adminCount <= 1;
              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.username}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/settings/users/${row.id}/edit`}
                        className="text-kids-navy font-semibold hover:underline"
                      >
                        Edit
                      </Link>
                      {isSelf || isLastAdmin ? (
                        <span
                          className="text-gray-300 text-sm font-semibold cursor-not-allowed"
                          title={isSelf ? "You can't delete your own account" : "At least one admin is required"}
                        >
                          Delete
                        </span>
                      ) : (
                        <DeleteUserButton userId={row.id} username={row.username} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
