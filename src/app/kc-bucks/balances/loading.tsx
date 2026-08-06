import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonPagination, SkeletonTable, SkeletonToolbar } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "All Balances" }]}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">All Balances</h2>
        <SkeletonToolbar filterCount={1} />
      </div>
      <SkeletonTable columns={3} />
      <SkeletonPagination />
    </div>
  );
}
