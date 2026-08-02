import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getKidBasicById } from "../../actions";
import { getKidGrants } from "../actions";
import { EditGrantsDetail } from "../EditGrantsDetail";
import { capitalizeName } from "@/lib/format";

export default async function EditGrantsKidPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const kid = await getKidBasicById(kidId);
  if (!kid) notFound();

  const grants = await getKidGrants(kid.id);
  const fullName = `${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Edit Grants", href: "/kc-bucks/edit-grants" },
          { label: fullName },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Edit Grants</h2>
      <p className="text-sm text-gray-500 -mt-4">Fix a manually granted amount, or remove it entirely.</p>
      <EditGrantsDetail kid={kid} initialGrants={grants} />
    </div>
  );
}
