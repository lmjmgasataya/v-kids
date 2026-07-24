import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BalanceWorkspace } from "./BalanceWorkspace";
import type { KcBucksKid } from "../actions";

export default async function CheckBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const kidId = typeof sp.kidId === "string" ? Number(sp.kidId) : NaN;

  let initialKid: KcBucksKid | null = null;
  if (Number.isInteger(kidId)) {
    const [row] = await db
      .select({ id: kids.id, firstName: kids.firstName, lastName: kids.lastName, nickname: kids.nickname, age: kids.age })
      .from(kids)
      .where(eq(kids.id, kidId));
    initialKid = row ?? null;
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "Check Balance" }]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Check Balance</h2>
      <BalanceWorkspace initialKid={initialKid} />
    </div>
  );
}
