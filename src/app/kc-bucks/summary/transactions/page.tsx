import { redirect } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kcBucksTransactions, kids, users } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FilterSelect } from "@/components/FilterSelect";
import { Pagination } from "@/components/Pagination";
import { capitalizeName } from "@/lib/format";

const PAGE_SIZE = 20;

const TRANSACTION_TYPES = ["checkin", "grant", "redemption"] as const;

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const TYPE_BADGE_CLASS: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  checkin: "bg-kids-green/10 text-kids-green",
  grant: "bg-kids-yellow/10 text-kids-yellow",
  redemption: "bg-kids-magenta/10 text-kids-magenta",
};

export default async function KcBucksTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const sp = await searchParams;
  const typeParam = typeof sp.type === "string" ? sp.type : "";
  const type = (TRANSACTION_TYPES as readonly string[]).includes(typeParam)
    ? (typeParam as (typeof TRANSACTION_TYPES)[number])
    : undefined;
  const requestedPage = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;

  const whereClause = type ? eq(kcBucksTransactions.type, type) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(kcBucksTransactions)
    .where(whereClause);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;

  const rows = await db
    .select({
      id: kcBucksTransactions.id,
      type: kcBucksTransactions.type,
      amount: kcBucksTransactions.amount,
      reason: kcBucksTransactions.reason,
      createdAt: kcBucksTransactions.createdAt,
      kidFirstName: kids.firstName,
      kidLastName: kids.lastName,
      kidNickname: kids.nickname,
      staffName: users.name,
    })
    .from(kcBucksTransactions)
    .innerJoin(kids, eq(kids.id, kcBucksTransactions.kidId))
    .leftJoin(users, eq(users.id, kcBucksTransactions.createdBy))
    .where(whereClause)
    .orderBy(desc(kcBucksTransactions.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Summary", href: "/kc-bucks/summary" },
          { label: "Transactions" },
        ]}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">All Transactions</h2>
        <FilterSelect paramName="type" value={type ?? ""} options={TRANSACTION_TYPES} allLabel="All types" />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kid</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Staff</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">KC Bucks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{dateTimeFormatter.format(row.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {capitalizeName(row.kidFirstName)} {capitalizeName(row.kidLastName)}
                    {row.kidNickname && (
                      <span className="text-xs text-gray-400"> &quot;{capitalizeName(row.kidNickname)}&quot;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-1 capitalize ${TYPE_BADGE_CLASS[row.type]}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.reason}</td>
                  <td className="px-4 py-3 text-gray-500">{row.staffName ?? "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-kids-magenta" : "text-kids-green"}`}
                  >
                    {row.amount > 0 ? "+" : ""}
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/kc-bucks/summary/transactions"
        page={page}
        totalPages={totalPages}
        totalCount={count}
        params={{ type: type ?? "" }}
        itemLabel="transaction"
      />
    </div>
  );
}
