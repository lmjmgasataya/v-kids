import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Service Team", href: "/service-team" },
          { label: "Print IDs" },
        ]}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <SkeletonBar className="h-8 w-40 mb-2" />
            <SkeletonBar className="h-4 w-64" />
          </div>
          <SkeletonBar className="h-9 w-64 rounded-lg" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <SkeletonBar className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-11 w-24 rounded-xl" />
            <SkeletonBar className="h-11 w-24 rounded-xl" />
          </div>
        </div>
        <SkeletonTable columns={4} leading="checkbox" />
      </div>
    </div>
  );
}
