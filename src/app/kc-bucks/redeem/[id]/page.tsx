import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getKidBasicById } from "../../actions";
import { getKidBalanceForRedeem } from "../actions";
import { RedeemDetail } from "../RedeemDetail";

export default async function RedeemCreditsKidPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const kid = await getKidBasicById(kidId);
  if (!kid) notFound();

  const balanceResult = await getKidBalanceForRedeem(kid.id);
  const initialBalance = typeof balanceResult === "number" ? balanceResult : 0;
  const fullName = `${kid.firstName} ${kid.lastName}`;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Redeem Credits", href: "/kc-bucks/redeem" },
          { label: fullName },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Redeem Credits</h2>
      <RedeemDetail kid={kid} initialBalance={initialBalance} />
    </div>
  );
}
