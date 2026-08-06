import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonList, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Check-In" }]} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-9 w-24 rounded-full" />
          <SkeletonBar className="h-9 w-24 rounded-full" />
        </div>
        <SkeletonBar className="h-10 w-full rounded-lg" />
        <SkeletonList rows={3} />
      </div>

      <div>
        <SkeletonBar className="h-5 w-56 mb-3" />
        <SkeletonTable columns={5} rows={5} />
      </div>
    </div>
  );
}
