import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="text-lg font-semibold text-gray-900">{session.name}</p>
        <p className="text-sm text-gray-500 capitalize">Role: {session.role}</p>
      </div>
    </div>
  );
}
