import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids, guardians } from "@/db/schema";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { KidsTable } from "./KidsTable";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";

const SORTABLE = {
  lastName: kids.lastName,
  age: kids.age,
  gender: kids.gender,
  guardian: guardians.lastName,
  serviceAttending: kids.serviceAttending,
  createdAt: kids.createdAt,
} as const;

type SortKey = keyof typeof SORTABLE;

export default async function KidsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sortParam = typeof sp.sort === "string" ? sp.sort : "createdAt";
  const dirParam = typeof sp.dir === "string" ? sp.dir : "desc";

  const sort: SortKey = sortParam in SORTABLE ? (sortParam as SortKey) : "createdAt";
  const dir = dirParam === "asc" ? "asc" : "desc";
  const orderFn = dir === "asc" ? asc : desc;

  const search = q.trim();
  const whereClause = search
    ? or(
        ilike(kids.firstName, `%${search}%`),
        ilike(kids.lastName, `%${search}%`),
        ilike(kids.nickname, `%${search}%`),
        ilike(guardians.firstName, `%${search}%`),
        ilike(guardians.lastName, `%${search}%`)
      )
    : undefined;

  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      gender: kids.gender,
      serviceAttending: kids.serviceAttending,
      createdAt: kids.createdAt,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianContactNumber: guardians.contactNumber,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id))
    .where(whereClause)
    .orderBy(orderFn(SORTABLE[sort]));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Registered Kids" }]} />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Registered Kids
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/kids/print-ids"
            className="shrink-0 whitespace-nowrap bg-kids-navy hover:bg-kids-navy/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
          >
            Print IDs
          </Link>
          <SearchBox defaultValue={search} />
        </div>
      </div>
      <KidsTable rows={rows} sort={sort} dir={dir} q={search} canManage={session.role === "admin"} />
    </div>
  );
}
