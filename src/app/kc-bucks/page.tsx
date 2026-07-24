import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavTile } from "@/components/NavTile";

export default async function KcBucksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "KC Bucks" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">KC Bucks</h2>
      <p className="text-sm text-gray-500 -mt-4">Kids earn credits and redeem them for prizes.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        <NavTile
          href="/kc-bucks/grant"
          icon="⭐"
          label="Grant Credits"
          description="Manually award credits for a reason"
          color="kids-green"
        />
        <NavTile
          href="/kc-bucks/balance"
          icon="💰"
          label="Check Balance"
          description="Look up a kid's KC Bucks and history"
          color="kids-yellow"
        />
        <NavTile
          href="/kc-bucks/redeem"
          icon="🎁"
          label="Redeem Credits"
          description="Subtract credits for a prize"
          color="kids-magenta"
        />
        <NavTile
          href="/kc-bucks/settings"
          icon="⚙️"
          label="Credit Settings"
          description="Set how many credits check-in earns"
          color="kids-navy"
        />
        <NavTile
          href="/kc-bucks/edit-grants"
          icon="✏️"
          label="Edit Grants"
          description="Fix or remove a manually granted amount"
          color="kids-green"
        />
        <NavTile
          href="/kc-bucks/balances"
          icon="📊"
          label="All Balances"
          description="Browse every kid's KC Bucks balance"
          color="kids-yellow"
        />
      </div>
    </div>
  );
}
