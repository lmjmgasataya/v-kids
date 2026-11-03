import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReportsNav } from "./ReportsNav";

// Layouts don't re-run on client navigation between the pages below, so each page also
// checks the session itself.
export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Reports" }]} />
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Reports</h2>
        <p className="text-sm text-gray-500 mb-4">Registrations, attendance, families and service team.</p>
        <Suspense>
          <ReportsNav />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
