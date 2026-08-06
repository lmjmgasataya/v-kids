import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonField, SkeletonFieldset } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Service Team", href: "/service-team" }]} />
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
        <div>
          <SkeletonBar className="h-8 w-64 mb-2" />
          <SkeletonBar className="h-4 w-72" />
        </div>
        <SkeletonFieldset accent="navy" rows={[2, 1, 2]}>
          <SkeletonField />
          <div>
            <SkeletonBar className="h-3 w-14 mb-2" />
            <SkeletonBar className="h-32 w-32 rounded-lg" />
          </div>
        </SkeletonFieldset>
        <SkeletonBar className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}
