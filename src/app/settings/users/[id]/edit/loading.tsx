import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonFieldset } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Users", href: "/settings/users" },
        ]}
      />
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
        <div>
          <SkeletonBar className="h-8 w-40 mb-2" />
          <SkeletonBar className="h-4 w-56" />
        </div>
        <SkeletonFieldset accent="navy" rows={[1, 1, 1]} />
        <SkeletonBar className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
