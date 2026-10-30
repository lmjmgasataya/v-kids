import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DevopsNav } from "./DevopsNav";

// Admin only. Layouts don't re-run on client navigation between the pages below, so each
// page, Server Action and the export route handler also checks the role itself.
export default async function DevopsAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Devops Admin" }]}
        />
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Devops Admin</h2>
        <p className="text-sm text-gray-500 mb-4">Feature flags, database sizes, data exports and login logs.</p>
        <DevopsNav />
      </div>
      {children}
    </div>
  );
}
