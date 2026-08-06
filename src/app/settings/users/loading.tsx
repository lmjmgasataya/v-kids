import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonPagination, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Users" }]}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Users</h2>
        <SkeletonBar className="h-9 w-28 rounded-full" />
      </div>
      <SkeletonTable columns={3} />
      <SkeletonPagination />
    </div>
  );
}
