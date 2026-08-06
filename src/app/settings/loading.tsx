import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonToggleRow } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Settings</h2>
      <SkeletonToggleRow />
      <SkeletonToggleRow />
      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="h-3 w-52" />
        </div>
        <SkeletonBar className="h-4 w-4" />
      </div>
    </div>
  );
}
