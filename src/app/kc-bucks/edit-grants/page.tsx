import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EditGrantsWorkspace } from "./EditGrantsWorkspace";

export default async function EditGrantsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "Edit Grants" }]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Edit Grants</h2>
      <p className="text-sm text-gray-500 -mt-4">Fix a manually granted amount, or remove it entirely.</p>
      <EditGrantsWorkspace />
    </div>
  );
}
