import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonPagination, SkeletonTable, SkeletonToolbar } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Registered Kids" }]} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
            Registered Kids
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <SkeletonBar className="h-9 w-24 rounded-full" />
            <SkeletonBar className="h-9 w-32 rounded-full" />
          </div>
        </div>
        <SkeletonToolbar filterCount={2} />
      </div>
      <SkeletonTable columns={6} />
      <SkeletonPagination />
    </div>
  );
}
