import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { KidsTable } from "./KidsTable";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { FilterSelect } from "@/components/FilterSelect";
import { GENDER_OPTIONS, SERVICE_OPTIONS } from "@/lib/constants";
import { ExportExcelButton } from "./ExportExcelButton";
import { ImportKidsModal } from "./ImportKidsModal";
import { fetchKidsRows, resolveDir, resolveGender, resolveService, resolveSort } from "./queries";

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
  const genderParam = typeof sp.gender === "string" ? sp.gender : "";
  const serviceParam = typeof sp.service === "string" ? sp.service : "";

  const sort = resolveSort(sortParam);
  const dir = resolveDir(dirParam);
  const gender = resolveGender(genderParam);
  const service = resolveService(serviceParam);
  const search = q.trim();

  const rows = await fetchKidsRows({ q: search, sort, dir, gender, service });

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Registered Kids" }]} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
            Registered Kids
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/kids/print-ids"
              className="shrink-0 whitespace-nowrap bg-kids-navy hover:bg-kids-navy/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
            >
              Print IDs
            </Link>
            {session.role === "admin" && (
              <>
                <ExportExcelButton q={search} sort={sort} dir={dir} />
                <ImportKidsModal />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBox defaultValue={search} />
          <FilterSelect paramName="gender" value={gender} options={GENDER_OPTIONS} allLabel="All genders" />
          <FilterSelect paramName="service" value={service} options={SERVICE_OPTIONS} allLabel="All services" />
        </div>
      </div>
      <KidsTable
        rows={rows}
        sort={sort}
        dir={dir}
        q={search}
        gender={gender}
        service={service}
        canManage={session.role === "admin"}
      />
    </div>
  );
}
