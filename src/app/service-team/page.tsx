import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { getSignedPhotoUrl } from "@/lib/storage";
import { ServiceTeamTable } from "./ServiceTeamTable";
import { ExportExcelButton } from "./ExportExcelButton";
import { ImportServiceTeamModal } from "./ImportServiceTeamModal";
import { fetchServiceTeamRows, resolveDir, resolveSort } from "./queries";

export default async function ServiceTeamPage({
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

  const sort = resolveSort(sortParam);
  const dir = resolveDir(dirParam);
  const search = q.trim();

  const rows = await fetchServiceTeamRows({ q: search, sort, dir });
  const rowsWithPhotos = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      photoUrl: row.photoKey ? await getSignedPhotoUrl(row.photoKey) : null,
      downloadUrl: row.photoKey
        ? await getSignedPhotoUrl(row.photoKey, 900, `${row.firstName}-${row.lastName}.jpg`)
        : null,
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Service Team" }]} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Service Team</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/service-team/print-ids"
              className="shrink-0 whitespace-nowrap bg-kids-navy hover:bg-kids-navy/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
            >
              Print IDs
            </Link>
            <ExportExcelButton q={search} sort={sort} dir={dir} />
            <ImportServiceTeamModal />
          </div>
        </div>
        <SearchBox defaultValue={search} placeholder="Search by name…" />
      </div>
      <ServiceTeamTable
        rows={rowsWithPhotos}
        sort={sort}
        dir={dir}
        q={search}
        canManage={session.role === "admin"}
      />
    </div>
  );
}
