import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavTile } from "@/components/NavTile";

const TILES = [
  {
    href: "/kc-bucks/grant",
    icon: "⭐",
    label: "Grant Credits",
    description: "Manually award credits for a reason",
    adminOnly: false,
  },
  {
    href: "/kc-bucks/balance",
    icon: "💰",
    label: "Check Balance",
    description: "Look up a kid's KC Bucks and history",
    adminOnly: false,
  },
  {
    href: "/kc-bucks/redeem",
    icon: "🎁",
    label: "Redeem Credits",
    description: "Subtract credits for a prize",
    adminOnly: false,
  },
  {
    href: "/kc-bucks/settings",
    icon: "⚙️",
    label: "Credit Settings",
    description: "Set how many credits check-in earns",
    adminOnly: true,
  },
  {
    href: "/kc-bucks/edit-grants",
    icon: "✏️",
    label: "Edit Grants",
    description: "Fix or remove a manually granted amount",
    adminOnly: true,
  },
  {
    href: "/kc-bucks/balances",
    icon: "📊",
    label: "All Balances",
    description: "Browse every kid's KC Bucks balance",
    adminOnly: false,
  },
  {
    href: "/kc-bucks/summary",
    icon: "📈",
    label: "Summary",
    description: "Totals and breakdowns across every kid",
    adminOnly: true,
  },
] as const;

// Cycled per tile position to match the logo's magenta/navy/green/yellow quadrants.
const TILE_COLORS = ["kids-magenta", "kids-navy", "kids-green", "kids-yellow"] as const;

export default async function KcBucksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tiles = TILES.filter((tile) => !tile.adminOnly || session.role === "admin");
  const isOddLeftover = tiles.length % 2 === 1;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "KC Bucks" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">KC Bucks</h2>
      <p className="text-sm text-gray-500 -mt-4">Kids earn credits and redeem them for prizes.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
        {tiles.map((tile, i) => {
          const isLastAlone = isOddLeftover && i === tiles.length - 1;
          return (
            <div key={tile.href} className={isLastAlone ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : undefined}>
              <NavTile
                href={tile.href}
                icon={tile.icon}
                label={tile.label}
                description={tile.description}
                color={TILE_COLORS[i % TILE_COLORS.length]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
