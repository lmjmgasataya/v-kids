import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/LogoMark";
import { NavTile } from "@/components/NavTile";

const TILES = [
  {
    href: "/register",
    icon: "📝",
    label: "Register",
    description: "Sign up a child or service team member",
    color: "kids-magenta",
  },
  {
    href: "/kids",
    icon: "📋",
    label: "Registered Kids",
    description: "View, search, and edit registrations",
    color: "kids-navy",
  },
  {
    href: "/check-in",
    icon: "✅",
    label: "Check-In",
    description: "Check kids in and out of service",
    color: "kids-green",
  },
  {
    href: "/kc-bucks",
    icon: "💰",
    label: "KC Bucks",
    description: "Grant, redeem, and check balances",
    color: "kids-yellow",
  },
  {
    href: "/attendance",
    icon: "📊",
    label: "Attendance",
    description: "See attendance per service for a day",
    color: "kids-magenta",
  },
  {
    href: "/service-team",
    icon: "👥",
    label: "Service Team",
    description: "View registered service team members",
    color: "kids-navy",
  },
] as const;

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isOddLeftover = TILES.length % 2 === 1;

  return (
    <div className="flex flex-col items-center gap-10 py-8 text-center">
      <LogoMark size={96} />

      <div>
        <h2 className="text-4xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Welcome to Kids Church!
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {TILES.map((tile, i) => {
          const isLastAlone = isOddLeftover && i === TILES.length - 1;
          return (
            <div
              key={tile.href}
              className={isLastAlone ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : undefined}
            >
              <NavTile
                href={tile.href}
                icon={tile.icon}
                label={tile.label}
                description={tile.description}
                color={tile.color}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
