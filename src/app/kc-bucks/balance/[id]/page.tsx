import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getKidBasicById } from "../../actions";
import { getKidBalanceSummary } from "../actions";
import { BalanceDetail } from "../BalanceDetail";

export default async function CheckBalanceKidPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const kid = await getKidBasicById(kidId);
  if (!kid) notFound();

  const summaryResult = await getKidBalanceSummary(kid.id);
  if ("error" in summaryResult) notFound();

  const fullName = `${kid.firstName} ${kid.lastName}`;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Check Balance", href: "/kc-bucks/balance" },
          { label: fullName },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Check Balance</h2>
      <BalanceDetail kid={kid} summary={summaryResult} />
    </div>
  );
}
