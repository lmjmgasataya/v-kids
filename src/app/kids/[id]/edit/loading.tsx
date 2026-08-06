import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonFieldset } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Registered Kids", href: "/kids" }]} />
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
        <div>
          <SkeletonBar className="h-8 w-56 mb-2" />
          <SkeletonBar className="h-4 w-72" />
        </div>
        <SkeletonFieldset accent="magenta" rows={[2, 2, 2]} />
        <SkeletonFieldset accent="navy" rows={[2, 2]} />
        <SkeletonBar className="h-11 w-32 rounded-xl" />
      </div>
    </div>
  );
}
