import { redirect } from "next/navigation";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids, kcBucksTransactions } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { FilterSelect } from "@/components/FilterSelect";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { BalancesTable } from "./BalancesTable";
import { Pagination } from "./Pagination";

const PAGE_SIZE = 20;

const balanceExpr = sql<number>`coalesce(sum(${kcBucksTransactions.amount}), 0)::int`;

const SORTABLE = {
  lastName: kids.lastName,
  age: kids.age,
  balance: balanceExpr,
} as const;

type SortKey = keyof typeof SORTABLE;

export default async function KcBucksBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sortParam = typeof sp.sort === "string" ? sp.sort : "lastName";
  const dirParam = typeof sp.dir === "string" ? sp.dir : "asc";
  const serviceParam = typeof sp.service === "string" ? sp.service : "";
  const requestedPage = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;

  const sort: SortKey = sortParam in SORTABLE ? (sortParam as SortKey) : "lastName";
  const dir = dirParam === "desc" ? "desc" : "asc";
  const orderFn = dir === "asc" ? asc : desc;
  const service = (SERVICE_OPTIONS as readonly string[]).includes(serviceParam) ? serviceParam : "";

  const search = q.trim();
  const conditions = [];
  if (search) {
    conditions.push(or(ilike(kids.firstName, `%${search}%`), ilike(kids.lastName, `%${search}%`), ilike(kids.nickname, `%${search}%`)));
  }
  if (service) conditions.push(eq(kids.serviceAttending, service));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(kids).where(whereClause);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;

  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      balance: balanceExpr,
    })
    .from(kids)
    .leftJoin(kcBucksTransactions, eq(kcBucksTransactions.kidId, kids.id))
    .where(whereClause)
    .groupBy(kids.id)
    .orderBy(orderFn(SORTABLE[sort]))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "All Balances" }]}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">All Balances</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBox defaultValue={search} />
          <FilterSelect paramName="service" value={service} options={SERVICE_OPTIONS} allLabel="All services" />
        </div>
      </div>
      <BalancesTable rows={rows} sort={sort} dir={dir} q={search} service={service} />
      <Pagination page={page} totalPages={totalPages} totalCount={count} q={search} sort={sort} dir={dir} service={service} />
    </div>
  );
}
